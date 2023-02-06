terraform {
  backend "s3" {
    key                  = "ui/terraform.tfstate"
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

resource "aws_s3_bucket" "static_file_bucket" {
  bucket = "colony-survival-calculator-tf-static-file-bucket-${terraform.workspace}"
}

resource "aws_s3_bucket_public_access_block" "static_file_bucket_public_access_block" {
  bucket = aws_s3_bucket.static_file_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_acl" "static_file_bucket_acl" {
  bucket = aws_s3_bucket.static_file_bucket.id

  acl = "private"
}

output "static_file_bucket_name" {
  value = aws_s3_bucket.static_file_bucket.id
}
