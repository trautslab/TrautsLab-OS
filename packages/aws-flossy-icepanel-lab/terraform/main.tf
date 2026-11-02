terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region                      = var.aws_region
  access_key                  = "mock_access_key"
  secret_key                  = "mock_secret_key"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  endpoints {
    eventbridge    = var.floci_endpoint
    stepfunctions  = var.floci_endpoint
    dynamodb       = var.floci_endpoint
    sqs            = var.floci_endpoint
    sns            = var.floci_endpoint
    s3             = var.floci_endpoint
    cloudwatch     = var.floci_endpoint
    logs           = var.floci_endpoint
    iam            = var.floci_endpoint
  }
}

# 1. Domain Event Bus Backbone & Routing Rules
module "eventbridge_backbone" {
  source = "./modules/eventbridge-backbone"
  environment = var.environment
}

# 2. CQRS DynamoDB Master Write & Stream Projections
module "cqrs_dynamodb_projections" {
  source = "./modules/cqrs-dynamodb-projections"
  environment = var.environment
}

# 3. Integration Plugins (Ingress Queues & Mainframe Sync)
module "integration_plugins" {
  source = "./modules/integration-plugins"
  environment = var.environment
}

# 4. Step Functions Sagas (Distributed Money Transfer Saga)
module "step_functions_sagas" {
  source = "./modules/step-functions-sagas"
  environment = var.environment
  eventbus_arn = module.eventbridge_backbone.eventbus_arn
}

# 5. CloudWatch Alarms & Observability
module "alarms_observability" {
  source = "./modules/alarms-observability"
  environment = var.environment
  dlq_name    = module.integration_plugins.payment_dlq_name
  sfn_name    = module.step_functions_sagas.transfer_saga_name
}

