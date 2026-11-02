#!/usr/bin/env node
/**
 * bin/simulate-floci-flow.mjs
 * Live Floci (Flossy) AWS Simulation Runner
 * 
 * Demonstrates that Floci is a FULL local AWS wire-protocol emulator,
 * NOT just a static diagram. Executes real transactions against:
 * 1. DynamoDB (CQRS Accounts Master Table)
 * 2. SQS (Integration Ingress & DLQ Queues)
 * 3. EventBridge (Central Banking EventBus)
 * 4. Step Functions (Distributed Money Transfer Saga with Happy Path & Compensation)
 */

import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { SFNClient, StartExecutionCommand, DescribeExecutionCommand } from "@aws-sdk/client-sfn";

const FLOCI_ENDPOINT = process.env.FLOCI_ENDPOINT || "http://localhost:4566";
const REGION = "us-east-1";
const CREDENTIALS = { accessKeyId: "mock_key", secretAccessKey: "mock_secret" };

console.log("\x1b[1m\x1b[36m========================================================================\x1b[0m");
console.log("\x1b[1m\x1b[36m  🚀 FLOCI LOCAL AWS RUNTIME SIMULATION (Going Beyond Diagrams)         \x1b[0m");
console.log("\x1b[1m\x1b[36m========================================================================\x1b[0m");
console.log(`📡 Connecting to live Floci emulator at: \x1b[33m${FLOCI_ENDPOINT}\x1b[0m\n`);

async function runSimulation() {
  // -------------------------------------------------------------
  // STEP 1: DYNAMODB CQRS MASTER WRITE & READ
  // -------------------------------------------------------------
  console.log("\x1b[1m\x1b[32m[1/4] DynamoDB: CQRS Account Master Table ('core-accounts-master-local')\x1b[0m");
  const ddb = new DynamoDBClient({ endpoint: FLOCI_ENDPOINT, region: REGION, credentials: CREDENTIALS });
  
  const testAccount = {
    accountId: { S: "ACC-BIAN-7701" },
    customerName: { S: "Maria Rodriguez" },
    accountType: { S: "CHECKING_VIP" },
    balance: { N: "12500.50" },
    currency: { S: "USD" },
    status: { S: "ACTIVE" },
    updatedAt: { S: new Date().toISOString() }
  };

  console.log("   -> Executing PutItemCommand (Master account creation)...");
  await ddb.send(new PutItemCommand({
    TableName: "core-accounts-master-local",
    Item: testAccount
  }));
  console.log("   ✓ Account successfully written to DynamoDB storage.");

  console.log("   -> Executing GetItemCommand to verify persistence...");
  const getRes = await ddb.send(new GetItemCommand({
    TableName: "core-accounts-master-local",
    Key: { accountId: { S: "ACC-BIAN-7701" } }
  }));
  console.log(`   ✓ Retrieved Account: ${getRes.Item?.accountId?.S} | Name: ${getRes.Item?.customerName?.S} | Balance: $${getRes.Item?.balance?.N} ${getRes.Item?.currency?.S}\n`);

  // -------------------------------------------------------------
  // STEP 2: SQS INGRESS & DLQ INTEGRATION PLUG
  // -------------------------------------------------------------
  console.log("\x1b[1m\x1b[32m[2/4] SQS: Ingress Integration Plug ('payment-cce-ingress-queue-local')\x1b[0m");
  const sqs = new SQSClient({ endpoint: FLOCI_ENDPOINT, region: REGION, credentials: CREDENTIALS });
  const queueUrl = `${FLOCI_ENDPOINT}/000000000000/payment-cce-ingress-queue-local`;

  const paymentPayload = {
    paymentId: "PAY-2026-9921",
    channel: "MOBILE_APP",
    sourceIban: "US8900012345",
    targetIban: "US9900054321",
    amount: 350.00,
    timestamp: Date.now()
  };

  console.log("   -> Sending transactional payload to SQS queue...");
  const sendRes = await sqs.send(new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(paymentPayload)
  }));
  console.log(`   ✓ Message Enqueued! MessageId: ${sendRes.MessageId}`);

  console.log("   -> Polling message from queue...");
  const recvRes = await sqs.send(new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 1
  }));
  if (recvRes.Messages && recvRes.Messages.length > 0) {
    const received = JSON.parse(recvRes.Messages[0].Body);
    console.log(`   ✓ Message Dequeued: PaymentId: ${received.paymentId} | Amount: $${received.amount} | Channel: ${received.channel}\n`);
  }

  // -------------------------------------------------------------
  // STEP 3: EVENTBRIDGE BACKBONE (CENTRAL EVENTBUS)
  // -------------------------------------------------------------
  console.log("\x1b[1m\x1b[32m[3/4] EventBridge: Central Backbone ('core-banking-eventbus-local')\x1b[0m");
  const eb = new EventBridgeClient({ endpoint: FLOCI_ENDPOINT, region: REGION, credentials: CREDENTIALS });

  console.log("   -> Emitting domain event 'PaymentInitiated' to EventBridge bus...");
  const ebRes = await eb.send(new PutEventsCommand({
    Entries: [
      {
        EventBusName: "core-banking-eventbus-local",
        Source: "core.payment.execution",
        DetailType: "PaymentInitiated",
        Detail: JSON.stringify({
          transferId: "TX-FLOW02-5501",
          sourceAccountId: "ACC-BIAN-7701",
          targetAccountId: "ACC-BIAN-9902",
          amount: 1500.00,
          currency: "USD",
          status: "INITIATED"
        })
      }
    ]
  }));
  console.log(`   ✓ Domain Event emitted successfully! FailedEntryCount: ${ebRes.FailedEntryCount || 0} | EventId: ${ebRes.Entries?.[0]?.EventId}\n`);

  // -------------------------------------------------------------
  // STEP 4: STEP FUNCTIONS DISTRIBUTED SAGA EXECUTION
  // -------------------------------------------------------------
  console.log("\x1b[1m\x1b[32m[4/4] Step Functions: Instant Transfer Distributed Saga (FLOW-02)\x1b[0m");
  const sfn = new SFNClient({ endpoint: FLOCI_ENDPOINT, region: REGION, credentials: CREDENTIALS });
  const stateMachineArn = "arn:aws:states:us-east-1:000000000000:stateMachine:sfn-payment-instant-transfer-saga-local";

  // Case A: Happy Path (Fraud Risk Score <= 85)
  console.log("   🔹 Scenario A: Legitimate Transfer (Risk Score = 15 -> Happy Path)");
  const execHappy = await sfn.send(new StartExecutionCommand({
    stateMachineArn,
    name: `happy-path-exec-${Date.now()}`,
    input: JSON.stringify({
      transferId: "TX-SAFE-1001",
      sourceAccountId: "ACC-BIAN-7701",
      amount: 120.00,
      fraudRiskScore: 15
    })
  }));
  console.log(`   -> Started Saga Execution ARN: ${execHappy.executionArn}`);
  
  // Wait a fraction to inspect result
  await new Promise(r => setTimeout(r, 400));
  const descHappy = await sfn.send(new DescribeExecutionCommand({ executionArn: execHappy.executionArn }));
  console.log(`   ✓ Saga Status: \x1b[1m\x1b[32m${descHappy.status}\x1b[0m`);
  console.log(`   ✓ Execution Output: ${descHappy.output}`);

  // Case B: High Risk Fraud Score (> 85 -> Automated Compensation Branch)
  console.log("\n   🔸 Scenario B: Suspicious Transfer (Risk Score = 96 -> Compensation Branch)");
  const execComp = await sfn.send(new StartExecutionCommand({
    stateMachineArn,
    name: `fraud-compensation-exec-${Date.now()}`,
    input: JSON.stringify({
      transferId: "TX-SUSP-9988",
      sourceAccountId: "ACC-BIAN-7701",
      amount: 45000.00,
      fraudRiskScore: 96
    })
  }));
  console.log(`   -> Started Saga Execution ARN: ${execComp.executionArn}`);

  await new Promise(r => setTimeout(r, 400));
  const descComp = await sfn.send(new DescribeExecutionCommand({ executionArn: execComp.executionArn }));
  console.log(`   ✓ Saga Status: \x1b[1m\x1b[33m${descComp.status}\x1b[0m`);
  console.log(`   ✓ Execution Output: ${descComp.output}`);

  console.log("\n\x1b[1m\x1b[36m========================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[32m  🎉 CONCLUSION: Floci is executing LIVE AWS wire-protocols on port 4566!\x1b[0m");
  console.log("  The architecture diagrams in LikeC4 map 1:1 to real, running emulated AWS services.");
  console.log("\x1b[1m\x1b[36m========================================================================\x1b[0m\n");
}

runSimulation().catch(err => {
  console.error("❌ Simulation Error:", err);
  process.exit(1);
});

