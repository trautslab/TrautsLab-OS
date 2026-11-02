# 🏛️ Core Banking Repository Archetypes Specification

In modern event-driven, cloud-native Core Banking architectures (such as AWS implementations at BCP aligned with BIAN standards), repositories adhere to 7 canonical architectural archetypes:

---

## 1. Plug for Integration (Integration Adapters / Connectors)
* **Purpose:** Acts as anti-corruption layers (ACL), protocol translators, and gateway connectors between the cloud-native event backbone and external or legacy systems.
* **Typical Tech Stack:** Node.js/TypeScript or Java Quarkus, AWS Lambda / ECS Fargate, SQS, API Gateway HTTP APIs, IBM MQ / SNA adapters, SWIFT/ISO20022 parser.
* **Responsibilities:**
  - Ingress webhooks from clearinghouses (CCE, Visa/Mastercard, Yape/Plin rails).
  - Bi-directional bridge to on-premise Host Mainframe (IMS/DB2/CICS).
  - Outbound third-party integrations (Twilio SMS, Firebase Cloud Messaging FCM, SES, KYC Biometrics).
* **Naming Pattern:** `plug-<system>-<direction>-<protocol>` (e.g., `plug-host-mainframe-adapter`, `plug-cce-clearing-ingress`).

---

## 2. Command (CQRS Mutating Services)
* **Purpose:** Handles domain state mutations, enforces business invariants, validates transactional rules, and publishes Domain Events.
* **Typical Tech Stack:** Node.js/Go/Java, AWS Lambda / App Runner, Amazon DynamoDB (Write Model), AWS EventBridge.
* **Responsibilities:**
  - Idempotency checks (`Idempotency-Key` via DynamoDB TTL locks).
  - Validation of BIAN Control Records.
  - Transactional Outbox pattern emission to EventBridge.
* **Naming Pattern:** `cmd-<domain>-<aggregate>` (e.g., `cmd-current-account-transfers`, `cmd-payment-execution-orders`).

---

## 3. Query (CQRS Read Services)
* **Purpose:** Serves high-throughput, low-latency, read-only queries with zero business logic mutation.
* **Typical Tech Stack:** Node.js / Rust, AWS Lambda, Amazon DynamoDB Read Replicas / ElastiCache Redis / OpenSearch.
* **Responsibilities:**
  - Sub-15ms P99 responses for mobile banking and ATM queries.
  - Composite view hydration across multiple read projections.
  - Pagination, filtering, and authorization projection masking.
* **Naming Pattern:** `qry-<domain>-<view>` (e.g., `qry-position-keeping-balances`, `qry-party-profile-directory`).

---

## 4. Projection (Event Projectors / Materialized View Builders)
* **Purpose:** Asynchronously consumes domain events from EventBridge / DynamoDB Streams to build read-optimized views, analytics tables, and cache stores.
* **Typical Tech Stack:** AWS Lambda / EventBridge Pipes / Kinesis Data Firehose, DynamoDB, OpenSearch.
* **Responsibilities:**
  - Eventual consistency management.
  - Deduplication and out-of-order event handling via monotonic versioning.
  - Hydration of query databases without impacting write transaction performance.
* **Naming Pattern:** `prj-<domain>-<target-view>` (e.g., `prj-account-balance-realtime`, `prj-general-ledger-journal`).

---

## 5. Alarms & Observability (Health, SLOs & Threat Monitors)
* **Purpose:** Implements real-time observability, SLO error budget tracking, anomaly detection, DLQ backlog alerts, and compliance alarms.
* **Typical Tech Stack:** CloudWatch Metric Alarms, CloudWatch Synthetics, SNS Topics, Lambda Alert Forwarder (Slack/PagerDuty/OpsGenie), AWS X-Ray.
* **Responsibilities:**
  - High DLQ depth alerts across payment queues.
  - P99 latency degradation alarms (>200ms on payments).
  - Fraud spike detection and circuit breaker triggers.
* **Naming Pattern:** `alm-<domain>-<monitor>` (e.g., `alm-payment-execution-dlq-monitor`, `alm-fraud-score-anomaly-detector`).

---

## 6. Step Functions Sagas (Distributed Transaction Orchestrators)
* **Purpose:** Orchestrates multi-domain, long-running, or distributed transactions using the Saga Pattern with automated compensation mechanisms.
* **Typical Tech Stack:** AWS Step Functions (Express / Standard Workflows), Amazon EventBridge, AWS Lambda task runners.
* **Responsibilities:**
  - End-to-end orchestration of distributed funds transfers (Debit Source -> Hold Balance -> Credit Target -> Clear Hold).
  - Error catching and automated compensation rollback on partial failures.
  - Exponential backoff and jittered retries for transient outages.
* **Naming Pattern:** `sfn-<domain>-<workflow>-saga` (e.g., `sfn-payment-instant-transfer-saga`, `sfn-customer-onboarding-orchestrator`).

---

## 7. EventBridge Backbone & Rules (Domain Event Buses & Contracts)
* **Purpose:** Defines the central enterprise event taxonomy, schema registries (JSON Schema / OpenAPI), routing rules, filters, and dead-letter queues.
* **Typical Tech Stack:** Amazon EventBridge Custom Buses, EventBridge Pipes, Amazon SQS DLQ, CloudWatch Logs.
* **Responsibilities:**
  - Loose coupling between bounded contexts.
  - Event schema validation and contract versioning.
  - Dead-letter queue buffering for resilience.
* **Naming Pattern:** `evb-<domain>-bus-rules` (e.g., `evb-core-banking-domain-bus`, `evb-fraud-detection-rules`).

