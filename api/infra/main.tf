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

    mongodbatlas = {
      source = "mongodb/mongodbatlas"
    }
  }


  required_version = ">= 1.3.7"
}

provider "aws" {
  region = var.region
}

provider "mongodbatlas" {
  public_key  = var.mongodb_public_key
  private_key = var.mongodb_private_key
}

locals {
  resource_prefix              = "colony-survival-calculator-tf-"
  architectures                = ["arm64"]
  seed_file_key_prefix         = "seeds/"
  mongodb_org_prefix           = "colony-survival-calculator-db-"
  mongodb_database_name        = "main_db"
  mongodb_item_collection_name = "items"
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

resource "aws_s3_object" "items_json_seed" {
  bucket = aws_s3_bucket.api_bucket.id

  key    = "${local.seed_file_key_prefix}items.json"
  source = "${var.src_folder}/json/items.json"

  etag = filemd5("${var.src_folder}/json/items.json")

  depends_on = [aws_s3_bucket_notification.seed_notification]
}

data "mongodbatlas_roles_org_id" "main" {}

resource "mongodbatlas_project" "main" {
  name   = "${local.mongodb_org_prefix}${terraform.workspace}"
  org_id = data.mongodbatlas_roles_org_id.main.org_id
}

resource "mongodbatlas_serverless_instance" "main" {
  project_id = mongodbatlas_project.main.id
  name       = "${local.resource_prefix}db-instance"

  provider_settings_backing_provider_name = "AWS"
  provider_settings_provider_name         = "SERVERLESS"
  provider_settings_region_name           = replace(upper(var.region), "-", "_")
}

resource "mongodbatlas_project_ip_access_list" "main" {
  project_id = mongodbatlas_project.main.id
  cidr_block = "0.0.0.0/0"
}

resource "aws_appsync_graphql_api" "main" {
  name                = "${local.resource_prefix}api-${terraform.workspace}"
  authentication_type = "AWS_IAM"

  schema = file("${var.src_folder}/graphql/schema.graphql")
}

data "aws_iam_policy_document" "appsync_policy_document" {
  statement {
    actions = [
      "sts:AssumeRole"
    ]
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["appsync.amazonaws.com"]
    }
  }
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
      ITEM_SEED_KEY        = "${local.seed_file_key_prefix}items.json"
      DATABASE_NAME        = local.mongodb_database_name
      ITEM_COLLECTION_NAME = local.mongodb_item_collection_name
      MONGO_DB_URI         = mongodbatlas_serverless_instance.main.connection_strings_standard_srv
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

resource "mongodbatlas_database_user" "add_item_lambda" {
  username           = aws_iam_role.add_item_lambda.arn
  project_id         = mongodbatlas_project.main.id
  auth_database_name = "$external"
  aws_iam_type       = "ROLE"

  roles {
    role_name       = "readWrite"
    database_name   = local.mongodb_database_name
    collection_name = local.mongodb_item_collection_name
  }
}

data "archive_file" "query_item_lambda" {
  type = "zip"

  source_dir  = "${var.dist_folder}/functions/query-item/dist"
  output_path = "${var.dist_folder}/functions/query-item/query-item.zip"
}

resource "aws_s3_object" "query_item_lambda" {
  bucket = aws_s3_bucket.api_bucket.id

  key    = "query-item.zip"
  source = data.archive_file.query_item_lambda.output_path

  etag = filemd5(data.archive_file.query_item_lambda.output_path)
}

resource "aws_iam_role" "query_item_lambda" {
  assume_role_policy = data.aws_iam_policy_document.lambda_policy_document.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]
}

resource "aws_lambda_function" "query_item_lambda" {
  function_name = "${local.resource_prefix}query-item-${terraform.workspace}"

  s3_bucket = aws_s3_bucket.api_bucket.id
  s3_key    = aws_s3_object.query_item_lambda.key

  runtime       = var.runtime
  handler       = "index.handler"
  architectures = local.architectures

  source_code_hash = data.archive_file.query_item_lambda.output_base64sha256

  role = aws_iam_role.query_item_lambda.arn

  environment {
    variables = {
      DATABASE_NAME        = local.mongodb_database_name
      ITEM_COLLECTION_NAME = local.mongodb_item_collection_name
      MONGO_DB_URI         = mongodbatlas_serverless_instance.main.connection_strings_standard_srv
    }
  }
}

resource "mongodbatlas_database_user" "query_item_lambda" {
  username           = aws_iam_role.query_item_lambda.arn
  project_id         = mongodbatlas_project.main.id
  auth_database_name = "$external"
  aws_iam_type       = "ROLE"

  roles {
    role_name       = "read"
    database_name   = local.mongodb_database_name
    collection_name = local.mongodb_item_collection_name
  }
}

resource "aws_iam_policy" "query_item_lambda_access" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["lambda:InvokeFunction"]
        Effect   = "Allow"
        Resource = aws_lambda_function.query_item_lambda.arn
      }
    ]
  })
}

resource "aws_iam_role" "query_item_lambda_access" {
  assume_role_policy = data.aws_iam_policy_document.appsync_policy_document.json
  managed_policy_arns = [
    aws_iam_policy.query_item_lambda_access.arn,
  ]
}

resource "aws_appsync_datasource" "query_item_lambda" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "${replace(local.resource_prefix, "-", "_")}query_item_lambda_datasource_${terraform.workspace}"
  service_role_arn = aws_iam_role.query_item_lambda_access.arn
  type             = "AWS_LAMBDA"

  lambda_config {
    function_arn = aws_lambda_function.query_item_lambda.arn
  }
}

resource "aws_appsync_resolver" "item" {
  api_id      = aws_appsync_graphql_api.main.id
  data_source = aws_appsync_datasource.query_item_lambda.name
  type        = "Query"
  field       = "item"
}

data "archive_file" "query_requirements_lambda" {
  type = "zip"

  source_dir  = "${var.dist_folder}/functions/query-requirements/dist"
  output_path = "${var.dist_folder}/functions/query-requirements/query-requirements.zip"
}

resource "aws_s3_object" "query_requirements_lambda" {
  bucket = aws_s3_bucket.api_bucket.id

  key    = "query-requirements.zip"
  source = data.archive_file.query_requirements_lambda.output_path

  etag = filemd5(data.archive_file.query_requirements_lambda.output_path)
}

resource "aws_iam_role" "query_requirements_lambda" {
  assume_role_policy = data.aws_iam_policy_document.lambda_policy_document.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]
}

resource "aws_lambda_function" "query_requirements_lambda" {
  function_name = "${local.resource_prefix}query-requirements-${terraform.workspace}"

  s3_bucket = aws_s3_bucket.api_bucket.id
  s3_key    = aws_s3_object.query_requirements_lambda.key

  runtime       = var.runtime
  handler       = "index.handler"
  architectures = local.architectures

  source_code_hash = data.archive_file.query_requirements_lambda.output_base64sha256

  role = aws_iam_role.query_requirements_lambda.arn

  environment {
    variables = {
      DATABASE_NAME        = local.mongodb_database_name
      ITEM_COLLECTION_NAME = local.mongodb_item_collection_name
      MONGO_DB_URI         = mongodbatlas_serverless_instance.main.connection_strings_standard_srv
    }
  }
}

resource "mongodbatlas_database_user" "query_requirements_lambda" {
  username           = aws_iam_role.query_requirements_lambda.arn
  project_id         = mongodbatlas_project.main.id
  auth_database_name = "$external"
  aws_iam_type       = "ROLE"

  roles {
    role_name       = "read"
    database_name   = local.mongodb_database_name
    collection_name = local.mongodb_item_collection_name
  }
}

resource "aws_iam_policy" "query_requirements_lambda_access" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["lambda:InvokeFunction"]
        Effect   = "Allow"
        Resource = aws_lambda_function.query_requirements_lambda.arn
      }
    ]
  })
}

resource "aws_iam_role" "query_requirements_lambda_access" {
  assume_role_policy = data.aws_iam_policy_document.appsync_policy_document.json
  managed_policy_arns = [
    aws_iam_policy.query_requirements_lambda_access.arn,
  ]
}

resource "aws_appsync_datasource" "query_requirements_lambda" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "${replace(local.resource_prefix, "-", "_")}query_requirements_lambda_datasource_${terraform.workspace}"
  service_role_arn = aws_iam_role.query_requirements_lambda_access.arn
  type             = "AWS_LAMBDA"

  lambda_config {
    function_arn = aws_lambda_function.query_requirements_lambda.arn
  }
}

resource "aws_appsync_resolver" "requirement" {
  api_id      = aws_appsync_graphql_api.main.id
  data_source = aws_appsync_datasource.query_requirements_lambda.name
  type        = "Query"
  field       = "requirement"
}
