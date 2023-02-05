terraform {
  backend "s3" {
    key                  = "deploy/terraform.tfstate"
    workspace_key_prefix = ""
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }


  required_version = ">= 1.3.7"
}

provider "aws" {
  region = var.region
}

resource "aws_route53_zone" "uk_hosted_zone" {
  count = terraform.workspace == "prod" ? 1 : 0
  name  = "factorycalculator.co.uk"
}

resource "aws_route53_zone" "com_hosted_zone" {
  count = terraform.workspace == "prod" ? 1 : 0
  name  = "factorycalculator.com"
}
