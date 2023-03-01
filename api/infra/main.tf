terraform {
  backend "s3" {
    key                  = "api/terraform.tfstate"
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

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "colony-survival-calculator-tf-lambda-bucket-${terraform.workspace}"
}

resource "aws_s3_bucket_public_access_block" "lambda_bucket_public_access_block" {
  bucket = aws_s3_bucket.lambda_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_acl" "lambda_bucket_acl" {
  bucket = aws_s3_bucket.lambda_bucket.id

  acl = "private"
}

data "archive_file" "add_item_lambda" {
  type = "zip"

  source_dir = "${var.dist_folder}/functions/add-item/dist"
  output_path = "${var.dist_folder}/functions/add-item/add-item.zip"
}

resource "aws_s3_object" "add_item_lambda_dist" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "add-item.zip"
  source = data.archive_file.add_item_lambda.output_path

  etag = filemd5(data.archive_file.add_item_lambda.output_path)
}
