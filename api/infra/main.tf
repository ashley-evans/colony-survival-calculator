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

locals {
  resource_prefix = "colony-survival-calculator-tf-"
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "${local.resource_prefix}lambda-bucket-${terraform.workspace}"
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

data "archive_file" "add_item_lambda_archive" {
  type = "zip"

  source_dir  = "${var.dist_folder}/functions/add-item/dist"
  output_path = "${var.dist_folder}/functions/add-item/add-item.zip"
}

resource "aws_s3_object" "add_item_lambda_dist" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "add-item.zip"
  source = data.archive_file.add_item_lambda_archive.output_path

  etag = filemd5(data.archive_file.add_item_lambda_archive.output_path)
}

data "aws_iam_policy_document" "lambda_policy_document" {
  statement {
    actions = [
      "sts:AssumeRole"
    ]
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "add_item_lambda_role" {
  assume_role_policy = data.aws_iam_policy_document.lambda_policy_document.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]
}

resource "aws_lambda_function" "add_item_lambda" {
  function_name = "${local.resource_prefix}add-item-${terraform.workspace}"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.add_item_lambda_dist.key

  runtime = var.runtime
  handler = "main.handler"

  source_code_hash = data.archive_file.add_item_lambda_archive.output_base64sha256

  role = aws_iam_role.add_item_lambda_role.arn
}
