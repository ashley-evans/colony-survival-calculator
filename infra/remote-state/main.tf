terraform {
  backend "s3" {
    key                  = "remote-state/terraform.tfstate"
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

resource "aws_s3_bucket" "remote_state_bucket" {
  bucket = var.bucket
}

resource "aws_s3_bucket_public_access_block" "remote_state_bucket_public_access_block" {
  bucket = aws_s3_bucket.remote_state_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_acl" "remote_state_bucket_acl" {
  bucket = aws_s3_bucket.remote_state_bucket.id

  acl = "private"
}

resource "aws_s3_bucket_versioning" "remote_state_bucket_versioning" {
  bucket = aws_s3_bucket.remote_state_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "remote_state_table" {
  name = var.dynamodb_table

  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
}