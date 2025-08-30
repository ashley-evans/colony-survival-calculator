terraform {
  backend "s3" {
    key                  = "colony-survival-calculator/api/terraform.tfstate"
    workspace_key_prefix = ""
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }

    mongodbatlas = {
      source = "mongodb/mongodbatlas"
    }
  }


  required_version = ">= 1.10.5"
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

resource "aws_s3_object" "items_json_seed" {
  bucket = aws_s3_bucket.api_bucket.id

  key    = "${local.seed_file_key_prefix}items.json"
  source = "${var.src_folder}/json/items.json"

  etag = filemd5("${var.src_folder}/json/items.json")

  depends_on = [aws_s3_bucket_notification.seed_notification, aws_lambda_function.add_item_lambda]
}

data "mongodbatlas_roles_org_id" "main" {}

resource "mongodbatlas_project" "main" {
  name   = "${local.mongodb_org_prefix}${terraform.workspace}"
  org_id = data.mongodbatlas_roles_org_id.main.org_id
}

resource "mongodbatlas_advanced_cluster" "main" {
  project_id   = mongodbatlas_project.main.id
  name         = "${local.resource_prefix}cluster"
  cluster_type = "REPLICASET"

  replication_specs {
    region_configs {
      region_name           = replace(upper(var.region), "-", "_")
      provider_name         = "TENANT"
      backing_provider_name = "AWS"
      priority              = 7

      electable_specs {
        instance_size = "M0"
      }
    }
  }
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
}

resource "aws_iam_role_policy_attachment" "add_item_lambda_execution_attachment" {
  role       = aws_iam_role.add_item_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "add_item_lambda_policy_attachment" {
  role       = aws_iam_role.add_item_lambda.name
  policy_arn = aws_iam_policy.add_item_lambda.arn
}

resource "aws_lambda_function" "add_item_lambda" {
  function_name = "${local.resource_prefix}add-item-${terraform.workspace}"

  s3_bucket = aws_s3_bucket.api_bucket.id
  s3_key    = aws_s3_object.add_item_lambda.key

  runtime       = var.runtime
  handler       = "index.handler"
  architectures = local.architectures
  timeout       = 10
  memory_size   = 256

  source_code_hash = data.archive_file.add_item_lambda.output_base64sha256

  role = aws_iam_role.add_item_lambda.arn

  environment {
    variables = {
      ITEM_SEED_KEY        = "${local.seed_file_key_prefix}items.json"
      DATABASE_NAME        = local.mongodb_database_name
      ITEM_COLLECTION_NAME = local.mongodb_item_collection_name
      MONGO_DB_URI         = mongodbatlas_advanced_cluster.main.connection_strings.0.standard_srv
    }
  }

  depends_on = [mongodbatlas_project_ip_access_list.main]
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
}

resource "aws_iam_role_policy_attachment" "query_item_lambda_execution_attachment" {
  role       = aws_iam_role.query_item_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
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
      MONGO_DB_URI         = mongodbatlas_advanced_cluster.main.connection_strings.0.standard_srv
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
}

resource "aws_iam_role_policy_attachment" "query_item_lambda_access_policy_attachment" {
  role       = aws_iam_role.query_item_lambda_access.name
  policy_arn = aws_iam_policy.query_item_lambda_access.arn
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
}

resource "aws_iam_role_policy_attachment" "query_requirements_lambda_execution_attachment" {
  role       = aws_iam_role.query_requirements_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "query_requirements_lambda" {
  function_name = "${local.resource_prefix}query-requirements-${terraform.workspace}"

  s3_bucket = aws_s3_bucket.api_bucket.id
  s3_key    = aws_s3_object.query_requirements_lambda.key

  runtime       = var.runtime
  handler       = "index.handler"
  architectures = local.architectures
  memory_size   = 1536

  source_code_hash = data.archive_file.query_requirements_lambda.output_base64sha256

  role = aws_iam_role.query_requirements_lambda.arn

  environment {
    variables = {
      DATABASE_NAME        = local.mongodb_database_name
      ITEM_COLLECTION_NAME = local.mongodb_item_collection_name
      MONGO_DB_URI         = mongodbatlas_advanced_cluster.main.connection_strings.0.standard_srv
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
}

resource "aws_iam_role_policy_attachment" "query_requirements_lambda_access_policy_attachment" {
  role       = aws_iam_role.query_requirements_lambda_access.name
  policy_arn = aws_iam_policy.query_requirements_lambda_access.arn
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

data "archive_file" "query_output_lambda" {
  type = "zip"

  source_dir  = "${var.dist_folder}/functions/query-output/dist"
  output_path = "${var.dist_folder}/functions/query-output/query-output.zip"
}

resource "aws_s3_object" "query_output_lambda" {
  bucket = aws_s3_bucket.api_bucket.id

  key    = "query-output.zip"
  source = data.archive_file.query_output_lambda.output_path

  etag = filemd5(data.archive_file.query_output_lambda.output_path)
}

resource "aws_iam_role" "query_output_lambda" {
  assume_role_policy = data.aws_iam_policy_document.lambda_policy_document.json
}

resource "aws_iam_role_policy_attachment" "query_output_lambda_execution_attachment" {
  role       = aws_iam_role.query_output_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "query_output_lambda" {
  function_name = "${local.resource_prefix}query-output-${terraform.workspace}"

  s3_bucket = aws_s3_bucket.api_bucket.id
  s3_key    = aws_s3_object.query_output_lambda.key

  runtime       = var.runtime
  handler       = "index.handler"
  architectures = local.architectures

  source_code_hash = data.archive_file.query_output_lambda.output_base64sha256

  role = aws_iam_role.query_output_lambda.arn

  environment {
    variables = {
      DATABASE_NAME        = local.mongodb_database_name
      ITEM_COLLECTION_NAME = local.mongodb_item_collection_name
      MONGO_DB_URI         = mongodbatlas_advanced_cluster.main.connection_strings.0.standard_srv
    }
  }
}

resource "mongodbatlas_database_user" "query_output_lambda" {
  username           = aws_iam_role.query_output_lambda.arn
  project_id         = mongodbatlas_project.main.id
  auth_database_name = "$external"
  aws_iam_type       = "ROLE"

  roles {
    role_name       = "read"
    database_name   = local.mongodb_database_name
    collection_name = local.mongodb_item_collection_name
  }
}

resource "aws_iam_policy" "query_output_lambda_access" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["lambda:InvokeFunction"]
        Effect   = "Allow"
        Resource = aws_lambda_function.query_output_lambda.arn
      }
    ]
  })
}

resource "aws_iam_role" "query_output_lambda_access" {
  assume_role_policy = data.aws_iam_policy_document.appsync_policy_document.json
}

resource "aws_iam_role_policy_attachment" "query_output_lambda_access_policy_attachment" {
  role       = aws_iam_role.query_output_lambda_access.name
  policy_arn = aws_iam_policy.query_output_lambda_access.arn
}

resource "aws_appsync_datasource" "query_output_lambda" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "${replace(local.resource_prefix, "-", "_")}query_output_lambda_datasource_${terraform.workspace}"
  service_role_arn = aws_iam_role.query_output_lambda_access.arn
  type             = "AWS_LAMBDA"

  lambda_config {
    function_arn = aws_lambda_function.query_output_lambda.arn
  }
}

resource "aws_appsync_resolver" "output" {
  api_id      = aws_appsync_graphql_api.main.id
  data_source = aws_appsync_datasource.query_output_lambda.name
  type        = "Query"
  field       = "output"
}

data "archive_file" "query_distinct_item_names_lambda" {
  type = "zip"

  source_dir  = "${var.dist_folder}/functions/query-distinct-item-names/dist"
  output_path = "${var.dist_folder}/functions/query-distinct-item-names/query-distinct-item-names.zip"
}

resource "aws_s3_object" "query_distinct_item_names_lambda" {
  bucket = aws_s3_bucket.api_bucket.id

  key    = "query-distinct-item-names.zip"
  source = data.archive_file.query_distinct_item_names_lambda.output_path

  etag = filemd5(data.archive_file.query_distinct_item_names_lambda.output_path)
}

resource "aws_iam_role" "query_distinct_item_names_lambda" {
  assume_role_policy = data.aws_iam_policy_document.lambda_policy_document.json
}

resource "aws_iam_role_policy_attachment" "query_distinct_item_names_lambda_execution_attachment" {
  role       = aws_iam_role.query_distinct_item_names_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "query_distinct_item_names_lambda" {
  function_name = "${local.resource_prefix}query-distinct-item-names-${terraform.workspace}"

  s3_bucket = aws_s3_bucket.api_bucket.id
  s3_key    = aws_s3_object.query_distinct_item_names_lambda.key

  runtime       = var.runtime
  handler       = "index.handler"
  architectures = local.architectures

  source_code_hash = data.archive_file.query_distinct_item_names_lambda.output_base64sha256

  role = aws_iam_role.query_distinct_item_names_lambda.arn

  environment {
    variables = {
      DATABASE_NAME        = local.mongodb_database_name
      ITEM_COLLECTION_NAME = local.mongodb_item_collection_name
      MONGO_DB_URI         = mongodbatlas_advanced_cluster.main.connection_strings.0.standard_srv
    }
  }
}

resource "mongodbatlas_database_user" "query_distinct_item_names_lambda" {
  username           = aws_iam_role.query_distinct_item_names_lambda.arn
  project_id         = mongodbatlas_project.main.id
  auth_database_name = "$external"
  aws_iam_type       = "ROLE"

  roles {
    role_name       = "read"
    database_name   = local.mongodb_database_name
    collection_name = local.mongodb_item_collection_name
  }
}

resource "aws_iam_policy" "query_distinct_item_names_lambda_access" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["lambda:InvokeFunction"]
        Effect   = "Allow"
        Resource = aws_lambda_function.query_distinct_item_names_lambda.arn
      }
    ]
  })
}

resource "aws_iam_role" "query_distinct_item_names_lambda_access" {
  assume_role_policy = data.aws_iam_policy_document.appsync_policy_document.json
}

resource "aws_iam_role_policy_attachment" "query_distinct_item_names_lambda_access_policy_attachment" {
  role       = aws_iam_role.query_distinct_item_names_lambda_access.name
  policy_arn = aws_iam_policy.query_distinct_item_names_lambda_access.arn
}

resource "aws_appsync_datasource" "query_distinct_item_names_lambda" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "${replace(local.resource_prefix, "-", "_")}query_distinct_item_names_lambda_datasource_${terraform.workspace}"
  service_role_arn = aws_iam_role.query_distinct_item_names_lambda_access.arn
  type             = "AWS_LAMBDA"

  lambda_config {
    function_arn = aws_lambda_function.query_distinct_item_names_lambda.arn
  }
}

resource "aws_appsync_resolver" "distinctItemNames" {
  api_id      = aws_appsync_graphql_api.main.id
  data_source = aws_appsync_datasource.query_distinct_item_names_lambda.name
  type        = "Query"
  field       = "distinctItemNames"
}

resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${local.resource_prefix}identity-pool-${terraform.workspace}"
  allow_unauthenticated_identities = true
}

resource "aws_iam_policy" "unauthenticated_api_access" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action   = ["appsync:GraphQL"]
        Effect   = "Allow"
        Resource = "${aws_appsync_graphql_api.main.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role" "unauthenticated_api_access" {
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = ["sts:AssumeRoleWithWebIdentity"]
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "unauthenticated_api_access_policy_attachment" {
  role       = aws_iam_role.unauthenticated_api_access.name
  policy_arn = aws_iam_policy.unauthenticated_api_access.arn
}

resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "unauthenticated" = aws_iam_role.unauthenticated_api_access.arn
  }
}

output "identity_pool_id" {
  value = aws_cognito_identity_pool.main.id
}

output "graphql_api_url" {
  value = aws_appsync_graphql_api.main.uris["GRAPHQL"]
}
