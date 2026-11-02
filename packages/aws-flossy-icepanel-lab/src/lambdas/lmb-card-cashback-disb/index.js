/**
 * Lambda: lmb-(env)-io-vads-cashback-disb-cmd-01
 * Disburses card cashback benefits to customer accounts in DynamoDB.
 * Supports both UNPROTECTED (demonstrating Lost Update) and PROTECTED_OCC (Auto-healing) modes.
 */
const { DynamoDBClient, GetItemCommand, UpdateItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const flociHost = process.env.AWS_LAMBDA_RUNTIME_API ? process.env.AWS_LAMBDA_RUNTIME_API.split(":")[0] : "localhost";
const FLOCI_ENDPOINT = process.env.FLOCI_ENDPOINT && !process.env.FLOCI_ENDPOINT.includes("localhost")
  ? process.env.FLOCI_ENDPOINT
  : `http://${flociHost}:4566`;
const TABLE_NAME = process.env.ACCOUNTS_TABLE || "core-accounts-master-local";

const ddb = new DynamoDBClient({
  endpoint: FLOCI_ENDPOINT,
  region: "us-east-1",
  credentials: { accessKeyId: "mock", secretAccessKey: "mock" }
});

exports.handler = async (event) => {
  const payload = typeof event === 'string' ? JSON.parse(event) : (event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : event);
  const { accountId, cashbackAmount = 25.0, mode = "PROTECTED_OCC", staleVersion } = payload;

  if (!accountId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusCode: 400, error: "accountId is required" })
    };
  }

  // 1. Read current state
  const getRes = await ddb.send(new GetItemCommand({
    TableName: TABLE_NAME,
    Key: { accountId: { S: accountId } },
    ConsistentRead: true
  }));

  if (!getRes.Item) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusCode: 404, error: "Account not found" })
    };
  }

  let currentCashback = getRes.Item.cashbackEarned ? Number(getRes.Item.cashbackEarned.N) : 0;
  let currentVersion = getRes.Item.version ? Number(getRes.Item.version.N) : 1;
  const points = getRes.Item.pointsBalance ? Number(getRes.Item.pointsBalance.N) : 0;

  if (mode === "UNPROTECTED_BLIND_OVERWRITE") {
    // BUGGY SCENARIO: Blind update using stale snapshot or blind overwrite
    // We intentionally simulate a write that didn't know points were updated, overwriting points back to stale
    const stalePoints = payload.stalePoints !== undefined ? payload.stalePoints : points;
    
    await ddb.send(new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { accountId: { S: accountId } },
      UpdateExpression: "SET cashbackEarned = :cb, pointsBalance = :pts, lastAccrualTimestamp = :now",
      ExpressionAttributeValues: {
        ":cb": { N: String(currentCashback + cashbackAmount) },
        ":pts": { N: String(stalePoints) }, // OVERWRITES & DESTROYS RECENT POINTS!
        ":now": { S: new Date().toISOString() }
      }
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statusCode: 200,
        mode: "UNPROTECTED_BLIND_OVERWRITE",
        status: "LOST_UPDATE_OCCURRED",
        message: "Blind overwrite completed without version check. Lost Update successfully induced.",
        overwrittenPointsBalance: stalePoints,
        newCashbackEarned: currentCashback + cashbackAmount
      })
    };
  }

  // 2. PROTECTED OCC SCENARIO
  let effectiveStale = staleVersion;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const verToExpect = (attempts === 1 && effectiveStale !== undefined) ? effectiveStale : currentVersion;
      const nextVer = verToExpect + 1;

      const updateRes = await ddb.send(new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { accountId: { S: accountId } },
        UpdateExpression: "SET cashbackEarned = :cb, version = :nextVer, lastAccrualTimestamp = :now",
        ConditionExpression: "attribute_exists(accountId) AND version = :ver",
        ExpressionAttributeValues: {
          ":cb": { N: String(currentCashback + cashbackAmount) },
          ":nextVer": { N: String(nextVer) },
          ":ver": { N: String(verToExpect) },
          ":now": { S: new Date().toISOString() }
        },
        ReturnValues: "ALL_NEW"
      }));

      // CQRS Projection: Write audit event to core-transactions-history-local
      try {
        await ddb.send(new PutItemCommand({
          TableName: "core-transactions-history-local",
          Item: {
            accountId: { S: accountId },
            transactionTimestamp: { N: String(Date.now()) },
            transactionType: { S: "CASHBACK_DISBURSED" },
            amount: { N: String(cashbackAmount) },
            version: { N: String(updateRes.Attributes.version.N) }
          }
        }));
      } catch (e) {
        console.error("Non-blocking CQRS projection error:", e.message);
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusCode: 200,
          mode: "PROTECTED_OCC",
          status: "SUCCESS",
          attempts,
          data: {
            accountId,
            cashbackEarned: Number(updateRes.Attributes.cashbackEarned.N),
            pointsBalance: Number(updateRes.Attributes.pointsBalance.N),
            version: Number(updateRes.Attributes.version.N)
          }
        })
      };
    } catch (err) {
      if (err.name === "ConditionalCheckFailedException") {
        if (attempts >= maxAttempts) {
          return {
            statusCode: 409,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              statusCode: 409,
              mode: "PROTECTED_OCC",
              status: "COLLISION_EXHAUSTED",
              error: "High contention collision could not be resolved after max attempts."
            })
          };
        }

        // Wait brief jitter
        await new Promise(r => setTimeout(r, 20 + Math.random() * 30));

        // Re-read fresh state
        const fresh = await ddb.send(new GetItemCommand({
          TableName: TABLE_NAME,
          Key: { accountId: { S: accountId } },
          ConsistentRead: true
        }));
        
        currentVersion = Number(fresh.Item.version.N);
        currentCashback = fresh.Item.cashbackEarned ? Number(fresh.Item.cashbackEarned.N) : 0;
        effectiveStale = undefined; // Clear stale version for retry
      } else {
        throw err;
      }
    }
  }
};
