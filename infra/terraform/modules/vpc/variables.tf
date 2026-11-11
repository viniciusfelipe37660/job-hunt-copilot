variable "name" {
  type        = string
  description = "Prefix used to name all resources created by this module."
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC."
  default     = "10.0.0.0/16"
}
