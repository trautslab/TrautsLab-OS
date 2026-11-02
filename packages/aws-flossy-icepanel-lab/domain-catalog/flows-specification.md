# 🔄 Core Banking End-to-End Flows Specification

This document catalogues the **20 canonical End-to-End business flows** operating across the 11 BIAN Service Domains and 80 squad repositories.

---

| Flow ID | Flow Name | Primary Domain | Secondary Domains Involved | Key Archetypes Exercised |
| :--- | :--- | :--- | :--- | :--- |
| **FLOW-01** | Direct Digital Account Opening & KYC | Customer Offer & Onboarding | Agreement, Current Account, Party Profile, Audit | Step Function, Plug, Command, Projection |
| **FLOW-02** | Outbound Instant P2P Transfer (Yape/Plin) | Payment Execution | Position Keeping, Current Account, Fraud, Notification | Step Function, Command, EventBridge, Plug |
| **FLOW-03** | Inbound Clearing Payment (CCE / ACH) | Payment Execution | Party Routing Profile, Current Account, Position Keeping | Plug, Command, Projection, EventBridge |
| **FLOW-04** | Debit Card Transaction Authorization Hold | Position Keeping & Balances | Current Account, Fraud Detection, Alarms | Command, Plug, Alarms |
| **FLOW-05** | Hold Settlement & Financial Clearing | Current Account | Position Keeping, Financial Accounting, Audit | Command, Projection, EventBridge |
| **FLOW-06** | Real-Time Balance & Mini-Statement Inquiry | Position Keeping & Balances | Current Account, Party Routing Profile | Query, Projection |
| **FLOW-07** | Scheduled Direct Debit Service Billing | Current Account | Payment Execution, Financial Accounting | Step Function, Command, EventBridge |
| **FLOW-08** | Overdraft Line Auto-Trigger & Coverage | Current Account | Collateral Allocation, Position Keeping | Command, Step Function, Projection |
| **FLOW-09** | Real-Time Transaction Fraud Evaluation (<50ms)| Fraud Detection & Risk Scoring| Payment Execution, Alarms | Plug, Command, Alarms |
| **FLOW-10** | High-Risk Account Preventative Freeze | Fraud Detection & Risk Scoring| Current Account, Notification, Audit | Command, Plug, Projection, Alarms |
| **FLOW-11** | Customer Contact Preference & Alias Update | Party Routing Profile | Customer Agreement, Notification | Command, Projection, EventBridge |
| **FLOW-12** | Daily Interest Accrual Calculation | Current Account | Position Keeping, Financial Accounting | Command, Projection, Plug |
| **FLOW-13** | End-of-Day (EOD) Ledger Reconciliation | Financial Accounting & GL | Current Account, Position Keeping, Alarms | Step Function, Projection, Alarms, Plug |
| **FLOW-14** | General Ledger Journal Accounting Posting | Financial Accounting & GL | Current Account, Payment Execution | Projection, Plug, EventBridge |
| **FLOW-15** | Multi-Channel Transaction Alert Notification | Customer Alert & Notification| Payment Execution, Current Account | Plug, Projection, EventBridge |
| **FLOW-16** | Account Maintenance Fee Assessment | Current Account | Customer Agreement, Financial Accounting | Command, Step Function, Projection |
| **FLOW-17** | Digital Terms & Conditions Legal Consent | Customer Agreement & Contract| Party Routing Profile, Audit | Command, Projection, Audit |
| **FLOW-18** | Mainframe Host Realtime & Batch Sync | Current Account | Financial Accounting, Audit | Plug, Projection, Alarms |
| **FLOW-19** | Regulatory AML & UIF Suspicious Report | Audit & Compliance | Fraud Detection, Payment Execution | Projection, Plug, Alarms |
| **FLOW-20** | Distributed Transfer Saga Compensation | Payment Execution | Position Keeping, Current Account, Alarms | Step Function, Command, Alarms |

