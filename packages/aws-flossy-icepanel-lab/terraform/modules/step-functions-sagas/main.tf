variable "environment" { type = string }
variable "eventbus_arn" { type = string }

resource "aws_iam_role" "sfn_execution_role" {
  name = "role-sfn-transfer-saga-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "states.amazonaws.com"
      }
    }]
  })
}

resource "aws_sfn_state_machine" "transfer_saga" {
  name     = "sfn-payment-instant-transfer-saga-${var.environment}"
  role_arn = aws_iam_role.sfn_execution_role.arn

  definition = jsonencode({
    Comment = "Distributed Instant Transfer Saga (FLOW-02 & FLOW-20) with automated compensation"
    StartAt = "ReserveSourceBalance"
    States = {
      ReserveSourceBalance = {
        Type = "Pass"
        Result = { status = "BALANCE_RESERVED", holdId = "HOLD-98231" }
        ResultPath = "$.holdResult"
        Next = "EvaluateFraudScore"
      }
      EvaluateFraudScore = {
        Type = "Choice"
        Choices = [
          {
            Variable = "$.fraudRiskScore"
            NumericGreaterThan = 85
            Next = "CompensateCancelHold"
          }
        ]
        Default = "CreditTargetAccount"
      }
      CreditTargetAccount = {
        Type = "Pass"
        Result = { status = "TARGET_CREDITED" }
        ResultPath = "$.creditResult"
        Next = "ReleaseHoldAndCommit"
      }
      ReleaseHoldAndCommit = {
        Type = "Pass"
        Result = { status = "COMPLETED" }
        End = true
      }
      CompensateCancelHold = {
        Type = "Pass"
        Result = { status = "COMPENSATED_HOLD_RELEASED" }
        End = true
      }
    }
  })

  tags = {
    FlowId      = "FLOW-02"
    Archetype   = "Step Function"
    BIANDomain  = "Payment Execution"
    Environment = var.environment
  }
}

output "transfer_saga_arn" {
  value = aws_sfn_state_machine.transfer_saga.arn
}

output "transfer_saga_name" {
  value = aws_sfn_state_machine.transfer_saga.name
}

