variable "environment" { type = string }
variable "dlq_name" { type = string }
variable "sfn_name" { type = string }

resource "aws_sns_topic" "banking_alarms" {
  name = "banking-critical-alarms-${var.environment}"
  tags = {
    Archetype   = "Alarms"
    Environment = var.environment
  }
}

# Metric Alarm: DLQ Backlog Depth > 0 messages
resource "aws_cloudwatch_metric_alarm" "dlq_depth_alarm" {
  alarm_name          = "alm-payment-execution-dlq-monitor-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Triggers immediately if any payment lands in the Dead Letter Queue"
  alarm_actions       = [aws_sns_topic.banking_alarms.arn]

  dimensions = {
    QueueName = var.dlq_name
  }

  tags = {
    Archetype   = "Alarms"
    BIANDomain  = "Payment Execution"
    Environment = var.environment
  }
}

# Metric Alarm: Step Function Execution Failures
resource "aws_cloudwatch_metric_alarm" "sfn_failed_executions" {
  alarm_name          = "alm-payment-saga-execution-failures-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Triggers when any Step Function transfer saga execution fails"
  alarm_actions       = [aws_sns_topic.banking_alarms.arn]

  dimensions = {
    StateMachineArn = var.sfn_name
  }

  tags = {
    Archetype   = "Alarms"
    BIANDomain  = "Payment Execution"
    Environment = var.environment
  }
}

output "dlq_alarm_arn" {
  value = aws_cloudwatch_metric_alarm.dlq_depth_alarm.arn
}

