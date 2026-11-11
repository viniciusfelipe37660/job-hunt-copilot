terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment once a real state bucket exists and you're ready to apply against
  # a live AWS account. Until then, state stays local (and nothing is applied).
  # backend "s3" {
  #   bucket = "job-hunt-copilot-tfstate"
  #   key    = "prod/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}
