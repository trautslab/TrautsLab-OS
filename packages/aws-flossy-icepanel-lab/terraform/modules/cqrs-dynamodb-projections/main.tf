variable "environment" { type = string }

resource "aws_dynamodb_table" "accounts_master" {
  name         = "core-accounts-master-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "accountId"

  attribute {
    name = "accountId"
    type = "S"
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = {
    Archetype   = "Command"
    BIANDomain  = "Current Account"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "positions_ledger" {
  name         = "core-positions-ledger-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "accountId"
  range_key    = "currency"

  attribute {
    name = "accountId"
    type = "S"
  }

  attribute {
    name = "currency"
    type = "S"
  }

  tags = {
    Archetype   = "Projection"
    BIANDomain  = "Position Keeping & Balances"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "transactions_history" {
  name         = "core-transactions-history-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "accountId"
  range_key    = "transactionTimestamp"

  attribute {
    name = "accountId"
    type = "S"
  }

  attribute {
    name = "transactionTimestamp"
    type = "N"
  }

  tags = {
    Archetype   = "Query"
    BIANDomain  = "Current Account"
    Environment = var.environment
  }
}

output "accounts_table_name" {
  value = aws_dynamodb_table.accounts_master.name
}

output "accounts_table_arn" {
  value = aws_dynamodb_table.accounts_master.arn
}

