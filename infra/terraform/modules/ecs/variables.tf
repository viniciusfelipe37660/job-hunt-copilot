variable "name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "secret_arns" {
  type        = list(string)
  description = "ARNs the execution role is allowed to read (union across all services)."
  default     = []
}

variable "services" {
  description = "Map of service name => config. See envs/prod/main.tf for the api/web entries."
  type = map(object({
    image            = string
    container_port   = number
    cpu              = number
    memory           = number
    desired_count    = number
    target_group_arn = string
    environment      = map(string)
    secrets          = map(string) # env var name => Secrets Manager ARN
  }))
}
