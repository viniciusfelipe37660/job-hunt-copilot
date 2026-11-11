variable "name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "app_security_group_id" {
  type        = string
  description = "Security group of the ECS tasks allowed to reach Postgres."
}

variable "db_name" {
  type    = string
  default = "jobhunt"
}

variable "db_username" {
  type    = string
  default = "jobhunt"
}

variable "db_password" {
  type        = string
  description = "Master password — pass via TF_VAR_db_password, never commit a real value."
  sensitive   = true
}
