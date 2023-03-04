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
  resource_prefix      = "colony-survival-calculator-tf-"
  architectures        = ["arm64"]
  seed_file_key_prefix = "seeds/"
}

resource "aws_s3_bucket" "api_bucket" {
  bucket = "${local.resource_prefix}api-bucket-${terraform.workspace}"
}

resource "aws_s3_bucket_public_access_block" "lambda_bucket_public_access_block" {
  bucket = aws_s3_bucket.api_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_acl" "lambda_bucket_acl" {
  bucket = aws_s3_bucket.api_bucket.id

  acl = "private"
}

data "archive_file" "add_item_lambda" {
  type = "zip"

  source_dir  = "${var.dist_folder}/functions/add-item/dist"
  output_path = "${var.dist_folder}/functions/add-item/add-item.zip"
}

resource "aws_s3_object" "add_item_lambda" {
  bucket = aws_s3_bucket.api_bucket.id

  key    = "add-item.zip"
  source = data.archive_file.add_item_lambda.output_path

  etag = filemd5(data.archive_file.add_item_lambda.output_path)
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

resource "aws_iam_policy" "add_item_lambda" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["s3:GetObject"]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.api_bucket.arn}/${local.seed_file_key_prefix}*"
      }
    ]
  })
}

resource "aws_iam_role" "add_item_lambda" {
  assume_role_policy = data.aws_iam_policy_document.lambda_policy_document.json
  managed_policy_arns = [
    aws_iam_policy.add_item_lambda.arn,
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]
}

resource "aws_lambda_function" "add_item_lambda" {
  function_name = "${local.resource_prefix}add-item-${terraform.workspace}"

  s3_bucket = aws_s3_bucket.api_bucket.id
  s3_key    = aws_s3_object.add_item_lambda.key

  runtime       = var.runtime
  handler       = "index.handler"
  architectures = local.architectures

  source_code_hash = data.archive_file.add_item_lambda.output_base64sha256

  role = aws_iam_role.add_item_lambda.arn

  environment {
    variables = {
      ITEM_SEED_KEY = "${local.seed_file_key_prefix}items.json"
    }
  }
}

resource "aws_lambda_permission" "allow_api_bucket_seed_execution" {
  action     = "lambda:InvokeFunction"
  principal  = "s3.amazonaws.com"
  source_arn = aws_s3_bucket.api_bucket.arn

  function_name = aws_lambda_function.add_item_lambda.arn
}

resource "aws_s3_bucket_notification" "seed_notification" {
  bucket = aws_s3_bucket.api_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.add_item_lambda.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = local.seed_file_key_prefix
    filter_suffix       = ".json"
  }

  depends_on = [aws_lambda_permission.allow_api_bucket_seed_execution]
}

resource "aws_s3_object" "items_json_seed" {
  bucket = aws_s3_bucket.api_bucket.id

  key    = "${local.seed_file_key_prefix}items.json"
  source = "${var.src_folder}/json/items.json"

  etag = filemd5("${var.src_folder}/json/items.json")

  depends_on = [aws_s3_bucket_notification.seed_notification]
}
