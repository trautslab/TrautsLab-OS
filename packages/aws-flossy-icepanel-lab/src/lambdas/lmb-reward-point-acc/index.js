/**
 * Lambda: lmb-(env)-io-acse-reward-point-acc-qry_findby-01
 * Implements RewardsAccountContract
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
  const { accountId, operation, pointsToAdd, expectedVersion } = payload;

  if (!accountId || !operation) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statusCode: 400,
        error: { code: "MISSING_MANDATORY_FIELDS", message: "accountId and operation are required" }
      })
    };
  }

  try {
    if (operation === "GET_BALANCE") {
      const res = await ddb.send(new GetItemCommand({
        TableName: TABLE_NAME,
        Key: { accountId: { S: accountId } }
      }));

      const item = res.Item;
      const points = item?.pointsBalance?.N ? Number(item.pointsBalance.N) : 2500;
      const tier = points >= 10000 ? "PLATINUM" : (points >= 5000 ? "GOLD" : "SILVER");
      const version = item?.version?.N ? Number(item.version.N) : 1;

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusCode: 200,
          data: {
            accountId,
            pointsBalance: points,
            tier,
            lastAccrualTimestamp: item?.lastAccrualTimestamp?.S || new Date().toISOString(),
            version
          }
        })
      };
    } else if (operation === "ACCRUE_POINTS") {
      const increment = Number(pointsToAdd || 100);
      
      // Update with Optimistic Concurrency Control (OCC) if expectedVersion provided
      const conditionExpr = expectedVersion ? "attribute_exists(accountId) AND version = :expVer" : "attribute_exists(accountId)";
      const exprValues = {
        ":inc": { N: String(increment) },
        ":now": { S: new Date().toISOString() },
        ":one": { N: "1" }
      };
      if (expectedVersion) {
        exprValues[":expVer"] = { N: String(expectedVersion) };
      }

      const updateRes = await ddb.send(new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { accountId: { S: accountId } },
        UpdateExpression: "ADD pointsBalance :inc, version :one SET lastAccrualTimestamp = :now",
        ConditionExpression: conditionExpr,
        ExpressionAttributeValues: exprValues,
        ReturnValues: "ALL_NEW"
      }));

      const newPoints = Number(updateRes.Attributes.pointsBalance.N);
      const newVersion = Number(updateRes.Attributes.version.N);

      // CQRS Projection: Write audit event to core-transactions-history-local
      try {
        await ddb.send(new PutItemCommand({
          TableName: "core-transactions-history-local",
          Item: {
            accountId: { S: accountId },
            transactionTimestamp: { N: String(Date.now()) },
            transactionType: { S: "POINTS_ACCRUED" },
            amount: { N: String(increment) },
            version: { N: String(newVersion) }
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
          data: {
            accountId,
            pointsBalance: newPoints,
            tier: newPoints >= 10000 ? "PLATINUM" : "GOLD",
            lastAccrualTimestamp: updateRes.Attributes.lastAccrualTimestamp.S,
            version: newVersion
          }
        })
      };
    }
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 409,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusCode: 409,
          error: {
            code: "OCC_VERSION_CONFLICT",
            message: `Version conflict: Expected version ${expectedVersion} does not match current state in DynamoDB.`
          }
        })
      };
    }
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statusCode: 500,
        error: { code: "DYNAMODB_ERROR", message: err.message }
      })
    };
  }
};
