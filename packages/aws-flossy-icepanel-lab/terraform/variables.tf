variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Target AWS Region"
}

variable "environment" {
  type        = string
  default     = "local"
  description = "Target environment stage (local, dev, qa, prod)"
}

variable "floci_endpoint" {
  type        = string
  default     = "http://localhost:4566"
  description = "Floci / Flossy local AWS emulator endpoint URL"
}

