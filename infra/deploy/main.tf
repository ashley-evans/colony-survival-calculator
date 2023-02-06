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

data "aws_iam_policy_document" "deploy_policy_document" {
  statement {
    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]
    effect = "Allow"
    principals {
      type        = "Federated"
      identifiers = [var.gha_oidc_provider_arn]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_organization}/${var.repository_name}:*"]
    }
  }
}

resource "aws_iam_policy" "remote_state_read_write_policy" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "s3:ListBucket"
        Effect   = "Allow"
        Resource = var.remote_state_bucket_arn
      },
      {
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Effect   = "Allow"
        Resource = "${var.remote_state_bucket_arn}/*"
      },
      {
        Action = [
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ],
        Effect   = "Allow"
        Resource = var.remote_state_table_arn
      }
    ]
  })
}

resource "aws_iam_role" "ui_deploy_role" {
  assume_role_policy = data.aws_iam_policy_document.deploy_policy_document.json
  managed_policy_arns = [
    aws_iam_policy.remote_state_read_write_policy.arn,
    aws_iam_policy.ui_deploy_policy.arn
  ]
}

resource "aws_iam_policy" "ui_deploy_policy" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "route53:*"
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

output "ui_deploy_role_arn" {
  value = aws_iam_role.ui_deploy_role.arn
}
