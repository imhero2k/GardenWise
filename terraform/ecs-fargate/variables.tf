variable "aws_region" {
  description = "AWS region used in the KodeKloud playground."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short lowercase prefix for all AWS resources and the private DNS namespace."
  type        = string
  default     = "prediction-lab"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,22}$", var.project_name))
    error_message = "Use 3-23 lowercase letters, digits and hyphens, starting with a letter."
  }
}

variable "deploy_services" {
  description = "Create the 3 ECS services (images must be accessible via GHCR)."
  type        = bool
  default     = false
}

variable "execution_role_arn" {
  description = "Optional existing ECS task execution IAM role ARN, for restricted playgrounds. If null, Terraform creates a role. The caller still needs iam:PassRole."
  type        = string
  default     = null
}

variable "backend_database_url_secret_arn" {
  description = "Optional Secrets Manager secret ARN injected into the backend as DATABASE_URL."
  type        = string
  default     = null
  nullable    = true
}
