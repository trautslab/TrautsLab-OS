variable "environment" { type = string }

# Dead Letter Queue for Ingress Payment Failures
resource "aws_sqs_queue" "payment_dlq" {
  name                      = "payment-ingress-dlq-${var.environment}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Archetype   = "Plug for Integration"
    BIANDomain  = "Payment Execution"
    Environment = var.environment
  }
}

# Main Ingress Queue with Redrive Policy
resource "aws_sqs_queue" "payment_ingress" {
  name                      = "payment-cce-ingress-queue-${var.environment}"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 86400
  visibility_timeout_seconds = 30

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payment_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Archetype   = "Plug for Integration"
    BIANDomain  = "Payment Execution"
    Environment = var.environment
  }
}

# S3 Bucket for Statements & Mainframe Batch Archiving
resource "aws_s3_bucket" "statements_archive" {
  bucket = "core-banking-statements-${var.environment}-archive"

  tags = {
    Archetype   = "Plug for Integration"
    BIANDomain  = "Current Account"
    Environment = var.environment
  }
}

output "payment_ingress_url" {
  value = aws_sqs_queue.payment_ingress.id
}

output "payment_dlq_url" {
  value = aws_sqs_queue.payment_dlq.id
}

output "payment_dlq_name" {
  value = aws_sqs_queue.payment_dlq.name
}

