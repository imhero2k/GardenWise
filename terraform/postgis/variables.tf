variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "name" {
  type    = string
  default = "gardenwise-db"
}
variable "vpc_id" {
  type        = string
  description = "Existing ECS VPC ID. This module does not create another VPC."
}
variable "backend_security_group_id" {
  type        = string
  description = "Security group attached to the backend ECS tasks, in this VPC."
}
variable "public_subnet_id" {
  type        = string
  description = "Existing subnet with a route to an internet gateway; used only for the temporary loader."
}
variable "database_subnet_cidrs" {
  type    = list(string)
  default = ["10.42.20.0/24", "10.42.21.0/24"]
  validation {
    condition     = length(var.database_subnet_cidrs) == 2 && length(distinct(var.database_subnet_cidrs)) == 2 && alltrue([for c in var.database_subnet_cidrs : can(cidrnetmask(c))])
    error_message = "Provide two distinct, valid IPv4 CIDRs within the VPC that do not overlap any existing subnet."
  }
}
variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}
variable "postgres_major_version" {
  type    = string
  default = "17"
}
variable "create_loader" {
  type        = bool
  default     = true
  description = "Set false and apply after importing to remove only the loader and its generated IAM resources."
}
variable "loader_instance_profile_name" {
  type        = string
  default     = null
  description = "Existing EC2 instance profile with AmazonSSMManagedInstanceCore-equivalent permissions. Null creates one."
}
variable "loader_instance_type" {
  type    = string
  default = "t3.micro"
}
variable "deletion_protection" {
  type    = bool
  default = true
}
variable "skip_final_snapshot" {
  type        = bool
  default     = false
  description = "False preserves a final snapshot if RDS is deliberately destroyed."
}
variable "final_snapshot_identifier" {
  type        = string
  default     = "gardenwise-db-final"
  description = "Change to a unique value before each deliberate RDS deletion."
}
