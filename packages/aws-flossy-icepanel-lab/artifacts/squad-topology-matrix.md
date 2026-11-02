# 📊 Squad Topology & BIAN Traceability Matrix

**Squad:** Cuentas & Rieles Transaccionales  
**Total BIAN Domains:** 11  
**Total Repositories:** 80  
**Total End-to-End Flows:** 20  

## Repository Inventory by BIAN Domain

| Repo Index | Repository Name | Archetype | BIAN Domain | BIAN Control Record | Technology Stack | AWS Service |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `cmd-current-account-lifecycle` | **Command** | Current Account | Current Account Agreement | Node | AWS Lambda |
| 2 | `cmd-current-account-deposits` | **Command** | Current Account | Current Account Agreement | TypeScript Lambda, DynamoDB, EventBridge Outbox | AWS Lambda |
| 3 | `cmd-current-account-overdraft` | **Command** | Current Account | Current Account Agreement | Go 1 | AWS Lambda |
| 4 | `qry-current-account-details` | **Query** | Current Account | Current Account Agreement | Node | AWS Lambda |
| 5 | `qry-current-account-statements` | **Query** | Current Account | Current Account Agreement | Python FastAPI Lambda, S3 Glacier/Standard | AWS Lambda |
| 6 | `prj-current-account-readmodel` | **Projection** | Current Account | Current Account Agreement | Node | AWS Lambda |
| 7 | `prj-current-account-analytics` | **Projection** | Current Account | Current Account Agreement | EventBridge Pipes & Firehose | AWS Lambda |
| 8 | `sfn-current-account-closure-saga` | **Step Function** | Current Account | Current Account Agreement | AWS Lambda, Node.js | AWS Step Functions |
| 9 | `plug-host-mainframe-core-sync` | **Plug for Integration** | Current Account | Current Account Agreement | Java 21 Quarkus ECS Fargate container | Amazon ECS Fargate |
| 10 | `alm-current-account-errors` | **Alarms** | Current Account | Current Account Agreement | AWS Lambda, Node.js | Amazon CloudWatch Alarms |
| 11 | `cmd-payment-execution-initiate` | **Command** | Payment Execution | Payment Order Procedure | Node | AWS Lambda |
| 12 | `cmd-payment-execution-authorization` | **Command** | Payment Execution | Payment Order Procedure | Go Lambda | AWS Lambda |
| 13 | `cmd-payment-execution-settle` | **Command** | Payment Execution | Payment Order Procedure | TypeScript Lambda | AWS Lambda |
| 14 | `qry-payment-execution-status` | **Query** | Payment Execution | Payment Order Procedure | Node | AWS Lambda |
| 15 | `qry-payment-execution-limits` | **Query** | Payment Execution | Payment Order Procedure | Node | AWS Lambda |
| 16 | `prj-payment-execution-history` | **Projection** | Payment Execution | Payment Order Procedure | Lambda DynamoDB Streams | AWS Lambda |
| 17 | `prj-payment-execution-metrics` | **Projection** | Payment Execution | Payment Order Procedure | AWS Lambda, Node.js | AWS Lambda |
| 18 | `sfn-payment-instant-transfer-saga` | **Step Function** | Payment Execution | Payment Order Procedure | AWS Lambda, Node.js | AWS Step Functions |
| 19 | `sfn-payment-clearing-cce-saga` | **Step Function** | Payment Execution | Payment Order Procedure | AWS Lambda, Node.js | AWS Step Functions |
| 20 | `plug-cce-clearing-ingress` | **Plug for Integration** | Payment Execution | Payment Order Procedure | ECS Fargate API | Amazon ECS Fargate |
| 21 | `plug-swift-iso20022-connector` | **Plug for Integration** | Payment Execution | Payment Order Procedure | Java 21 Spring Native | AWS Lambda |
| 22 | `alm-payment-execution-p99-latency` | **Alarms** | Payment Execution | Payment Order Procedure | AWS Lambda, Node.js | Amazon CloudWatch Alarms |
| 23 | `cmd-party-routing-register` | **Command** | Party Routing Profile | Party Directory Entry | Node | AWS Lambda |
| 24 | `cmd-party-routing-deregister` | **Command** | Party Routing Profile | Party Directory Entry | Node | AWS Lambda |
| 25 | `qry-party-routing-resolve` | **Query** | Party Routing Profile | Party Directory Entry | Go Lambda, DynamoDB DAX cluster | AWS Lambda |
| 26 | `prj-party-routing-directory` | **Projection** | Party Routing Profile | Party Directory Entry | Lambda DynamoDB Streams | AWS Lambda |
| 27 | `plug-directory-federation-bridge` | **Plug for Integration** | Party Routing Profile | Party Directory Entry | Node | AWS Lambda |
| 28 | `alm-party-routing-lookup-failures` | **Alarms** | Party Routing Profile | Party Directory Entry | AWS Lambda, Node.js | Amazon CloudWatch Alarms |
| 29 | `cmd-customer-onboarding-initiate` | **Command** | Customer Offer & Onboarding | Customer Onboarding Procedure | TypeScript Lambda | AWS Lambda |
| 30 | `cmd-customer-onboarding-biometrics` | **Command** | Customer Offer & Onboarding | Customer Onboarding Procedure | Python Lambda | AWS Lambda |
| 31 | `qry-customer-onboarding-progress` | **Query** | Customer Offer & Onboarding | Customer Onboarding Procedure | Node | AWS Lambda |
| 32 | `prj-customer-onboarding-funnel` | **Projection** | Customer Offer & Onboarding | Customer Onboarding Procedure | EventBridge Pipes | AWS Lambda |
| 33 | `sfn-customer-onboarding-saga` | **Step Function** | Customer Offer & Onboarding | Customer Onboarding Procedure | AWS Lambda, Node.js | AWS Step Functions |
| 34 | `plug-reniec-biometrics-gateway` | **Plug for Integration** | Customer Offer & Onboarding | Customer Onboarding Procedure | Java Lambda | AWS Lambda |
| 35 | `plug-experian-credit-score` | **Plug for Integration** | Customer Offer & Onboarding | Customer Onboarding Procedure | Python Lambda | AWS Lambda |
| 36 | `alm-onboarding-kyc-drop-rate` | **Alarms** | Customer Offer & Onboarding | Customer Onboarding Procedure | AWS Lambda, Node.js | Amazon CloudWatch Alarms |
| 37 | `cmd-customer-agreement-sign` | **Command** | Customer Agreement & Contract | Customer Agreement Specification | Node | AWS Lambda |
| 38 | `cmd-customer-agreement-amend` | **Command** | Customer Agreement & Contract | Customer Agreement Specification | TypeScript Lambda | AWS Lambda |
| 39 | `qry-customer-agreement-fetch` | **Query** | Customer Agreement & Contract | Customer Agreement Specification | Node | AWS Lambda |
| 40 | `prj-customer-agreement-indexer` | **Projection** | Customer Agreement & Contract | Customer Agreement Specification | Lambda | AWS Lambda |
| 41 | `plug-docusign-legal-trust-bridge` | **Plug for Integration** | Customer Agreement & Contract | Customer Agreement Specification | TypeScript Lambda | AWS Lambda |
| 42 | `alm-agreement-compliance-gaps` | **Alarms** | Customer Agreement & Contract | Customer Agreement Specification | AWS Lambda, Node.js | Amazon CloudWatch Alarms |
| 43 | `cmd-position-keeping-reserve` | **Command** | Position Keeping & Balances | Position Keeping Ledger Log | Go Lambda | AWS Lambda |
| 44 | `cmd-position-keeping-release` | **Command** | Position Keeping & Balances | Position Keeping Ledger Log | Go Lambda | AWS Lambda |
| 45 | `qry-position-keeping-realtime-balance` | **Query** | Position Keeping & Balances | Position Keeping Ledger Log | Rust Lambda, Redis / DynamoDB DAX | AWS Lambda |
| 46 | `qry-position-keeping-movements` | **Query** | Position Keeping & Balances | Position Keeping Ledger Log | Node | AWS Lambda |
| 47 | `prj-position-keeping-ledger-view` | **Projection** | Position Keeping & Balances | Position Keeping Ledger Log | Lambda | AWS Lambda |
| 48 | `prj-position-keeping-audit-balance` | **Projection** | Position Keeping & Balances | Position Keeping Ledger Log | Python Lambda | AWS Lambda |
| 49 | `plug-atm-switch-pos-gateway` | **Plug for Integration** | Position Keeping & Balances | Position Keeping Ledger Log | C++/Rust ECS Fargate | Amazon ECS Fargate |
| 50 | `alm-position-keeping-balance-discrepancy` | **Alarms** | Position Keeping & Balances | Position Keeping Ledger Log | AWS Lambda, Node.js | Amazon CloudWatch Alarms |
| 51 | `cmd-financial-accounting-voucher` | **Command** | Financial Accounting & General Ledger | Financial Accounting Journal | TypeScript Lambda | AWS Lambda |
| 52 | `qry-financial-accounting-trail` | **Query** | Financial Accounting & General Ledger | Financial Accounting Journal | Node | AWS Lambda |
| 53 | `prj-financial-accounting-journal` | **Projection** | Financial Accounting & General Ledger | Financial Accounting Journal | Lambda EventBridge | AWS Lambda |
| 54 | `prj-financial-accounting-eod-balance` | **Projection** | Financial Accounting & General Ledger | Financial Accounting Journal | Python Lambda | AWS Lambda |
| 55 | `sfn-financial-accounting-eod-reconciliation` | **Step Function** | Financial Accounting & General Ledger | Financial Accounting Journal | AWS Lambda, Node.js | AWS Step Functions |
| 56 | `plug-sap-erp-general-ledger-adapter` | **Plug for Integration** | Financial Accounting & General Ledger | Financial Accounting Journal | Java ECS | Amazon ECS Fargate |
| 57 | `alm-general-ledger-unbalanced-voucher` | **Alarms** | Financial Accounting & General Ledger | Financial Accounting Journal | AWS Lambda, Node.js | Amazon CloudWatch Alarms |
| 58 | `cmd-collateral-allocation-pledge` | **Command** | Collateral Allocation & Guarantees | Collateral Asset Allocation | Node | AWS Lambda |
| 59 | `cmd-collateral-allocation-release` | **Command** | Collateral Allocation & Guarantees | Collateral Asset Allocation | TypeScript Lambda | AWS Lambda |
| 60 | `qry-collateral-allocation-status` | **Query** | Collateral Allocation & Guarantees | Collateral Asset Allocation | Node | AWS Lambda |
| 61 | `prj-collateral-allocation-exposure` | **Projection** | Collateral Allocation & Guarantees | Collateral Asset Allocation | Lambda | AWS Lambda |
| 62 | `alm-collateral-under-coverage-warning` | **Alarms** | Collateral Allocation & Guarantees | Collateral Asset Allocation | AWS Lambda, Node.js | Amazon CloudWatch Alarms |
| 63 | `cmd-fraud-detection-evaluate-tx` | **Command** | Fraud Detection & Risk Scoring | Fraud Evaluation Assessment | Go/C++ Lambda, <40ms SLA | AWS Lambda |
| 64 | `cmd-fraud-detection-lockout` | **Command** | Fraud Detection & Risk Scoring | Fraud Evaluation Assessment | Node | AWS Lambda |
| 65 | `qry-fraud-detection-risk-profile` | **Query** | Fraud Detection & Risk Scoring | Fraud Evaluation Assessment | Python Lambda | AWS Lambda |
| 66 | `prj-fraud-detection-blacklists` | **Projection** | Fraud Detection & Risk Scoring | Fraud Evaluation Assessment | Lambda | AWS Lambda |
| 67 | `sfn-fraud-suspicious-alert-investigation` | **Step Function** | Fraud Detection & Risk Scoring | Fraud Evaluation Assessment | AWS Lambda, Node.js | AWS Step Functions |
| 68 | `plug-device-fingerprint-threatmetrix` | **Plug for Integration** | Fraud Detection & Risk Scoring | Fraud Evaluation Assessment | Node | AWS Lambda |
| 69 | `plug-biocatch-behavioral-engine` | **Plug for Integration** | Fraud Detection & Risk Scoring | Fraud Evaluation Assessment | TypeScript Lambda | AWS Lambda |
| 70 | `alm-fraud-high-risk-spike-alarm` | **Alarms** | Fraud Detection & Risk Scoring | Fraud Evaluation Assessment | AWS Lambda, Node.js | Amazon CloudWatch Alarms |
| 71 | `cmd-customer-alert-dispatch` | **Command** | Customer Alert & Notification | Customer Notification Campaign | Node | AWS Lambda |
| 72 | `qry-customer-alert-delivery-status` | **Query** | Customer Alert & Notification | Customer Notification Campaign | TypeScript Lambda | AWS Lambda |
| 73 | `prj-customer-alert-audit-log` | **Projection** | Customer Alert & Notification | Customer Notification Campaign | Lambda | AWS Lambda |
| 74 | `plug-fcm-apns-push-gateway` | **Plug for Integration** | Customer Alert & Notification | Customer Notification Campaign | Go Lambda | AWS Lambda |
| 75 | `plug-twilio-infobip-sms-gateway` | **Plug for Integration** | Customer Alert & Notification | Customer Notification Campaign | Node | AWS Lambda |
| 76 | `cmd-audit-log-immutable-record` | **Command** | Audit, Logging & Regulatory Compliance | Audit Regulatory Record | Rust Lambda | AWS Lambda |
| 77 | `qry-audit-log-trace-inspector` | **Query** | Audit, Logging & Regulatory Compliance | Audit Regulatory Record | Python Lambda, OpenSearch | AWS Lambda |
| 78 | `prj-audit-log-compliance-views` | **Projection** | Audit, Logging & Regulatory Compliance | Audit Regulatory Record | Lambda | AWS Lambda |
| 79 | `plug-sbs-regulatory-reporting-export` | **Plug for Integration** | Audit, Logging & Regulatory Compliance | Audit Regulatory Record | Python ECS | Amazon ECS Fargate |
| 80 | `alm-audit-tampering-security-alarm` | **Alarms** | Audit, Logging & Regulatory Compliance | Audit Regulatory Record | AWS Lambda, Node.js | Amazon CloudWatch Alarms |

## End-to-End Flows Summary

| Flow ID | Flow Name | Primary Domain | Total Steps |
| :--- | :--- | :--- | :--- |
| **FLOW-01** | Direct Digital Account Opening & KYC | Customer Offer & Onboarding | 6 steps |
| **FLOW-02** | Outbound Instant P2P Transfer (Yape/Plin) | Payment Execution | 7 steps |
| **FLOW-03** | Inbound Clearing Payment (CCE / ACH) | Payment Execution | 5 steps |
| **FLOW-04** | Debit Card Transaction Authorization Hold | Position Keeping & Balances | 4 steps |
| **FLOW-05** | Hold Settlement & Financial Clearing | Current Account | 3 steps |
| **FLOW-06** | Real-Time Balance & Mini-Statement Inquiry | Position Keeping & Balances | 2 steps |
| **FLOW-07** | Scheduled Direct Debit Service Billing | Current Account | 3 steps |
| **FLOW-08** | Overdraft Line Auto-Trigger & Coverage | Current Account | 3 steps |
| **FLOW-09** | Real-Time Transaction Fraud Evaluation (<50ms) | Fraud Detection & Risk Scoring | 3 steps |
| **FLOW-10** | High-Risk Account Preventative Freeze | Fraud Detection & Risk Scoring | 3 steps |
| **FLOW-11** | Customer Contact Preference & Alias Update | Party Routing Profile | 3 steps |
| **FLOW-12** | Daily Interest Accrual Calculation | Current Account | 2 steps |
| **FLOW-13** | End-of-Day (EOD) Ledger Reconciliation | Financial Accounting & General Ledger | 3 steps |
| **FLOW-14** | General Ledger Journal Accounting Posting | Financial Accounting & General Ledger | 2 steps |
| **FLOW-15** | Multi-Channel Transaction Alert Notification | Customer Alert & Notification | 3 steps |
| **FLOW-16** | Account Maintenance Fee Assessment | Current Account | 3 steps |
| **FLOW-17** | Digital Terms & Conditions Legal Consent | Customer Agreement & Contract | 3 steps |
| **FLOW-18** | Mainframe Host Realtime & Batch Sync | Current Account | 2 steps |
| **FLOW-19** | Regulatory AML & UIF Suspicious Report | Audit, Logging & Regulatory Compliance | 2 steps |
| **FLOW-20** | Distributed Transfer Saga Compensation | Payment Execution | 4 steps |
