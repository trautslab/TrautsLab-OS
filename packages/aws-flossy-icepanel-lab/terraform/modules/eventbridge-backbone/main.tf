variable "environment" { type = string }

resource "aws_cloudwatch_event_bus" "core_banking" {
  name = "core-banking-eventbus-${var.environment}"
  tags = {
    Domain      = "Enterprise Backbone"
    Environment = var.environment
    Standard    = "BIAN-v10"
  }
}

resource "aws_cloudwatch_event_rule" "payment_events" {
  name           = "rule-payment-lifecycle-${var.environment}"
  description    = "Routes payment initiation, authorization, settlement and failure events"
  event_bus_name = aws_cloudwatch_event_bus.core_banking.name

  event_pattern = jsonencode({
    source      = ["core.payment-execution"],
    detail-type = ["PaymentInitiatedEvent.v1", "PaymentCompletedEvent.v1", "PaymentFailedEvent.v1"]
  })
}

resource "aws_cloudwatch_event_rule" "account_events" {
  name           = "rule-account-lifecycle-${var.environment}"
  description    = "Routes account opening, status change, and balance hold events"
  event_bus_name = aws_cloudwatch_event_bus.core_banking.name

  event_pattern = jsonencode({
    source      = ["core.current-account", "core.position-keeping"],
    detail-type = ["AccountOpenedEvent.v1", "AccountStateChangedEvent.v1", "BalanceReservedEvent.v1"]
  })
}

output "eventbus_arn" {
  value = aws_cloudwatch_event_bus.core_banking.arn
}

output "eventbus_name" {
  value = aws_cloudwatch_event_bus.core_banking.name
}

