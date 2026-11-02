output "floci_endpoint" {
  value       = var.floci_endpoint
  description = "Floci Local AWS Endpoint"
}

output "eventbus_arn" {
  value       = module.eventbridge_backbone.eventbus_arn
  description = "ARN of the core banking domain event bus"
}

output "accounts_table_name" {
  value       = module.cqrs_dynamodb_projections.accounts_table_name
  description = "DynamoDB master accounts write table"
}

output "transfer_saga_arn" {
  value       = module.step_functions_sagas.transfer_saga_arn
  description = "Step Function Instant Transfer Saga ARN"
}

output "payment_dlq_url" {
  value       = module.integration_plugins.payment_dlq_url
  description = "Payment Ingress Dead Letter Queue URL"
}

output "critical_alarm_arn" {
  value       = module.alarms_observability.dlq_alarm_arn
  description = "CloudWatch Metric Alarm for DLQ Backlog"
}

