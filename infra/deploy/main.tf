terraform {
  backend "s3" {
    key                  = "deployment/colony-survival-calculator/terraform.tfstate"
    workspace_key_prefix = ""
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }


  required_version = ">= 1.10.5"
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

resource "aws_iam_policy" "ui_deploy_policy" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["route53:*", "cloudfront:*", "acm:*"]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_policy" "api_deploy_policy" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["cognito-identity:*"]
        Effect   = "Allow"
        Resource = "arn:aws:cognito-identity:*"
      }
    ]
  })
}

resource "aws_iam_role" "deploy_role" {
  assume_role_policy = data.aws_iam_policy_document.deploy_policy_document.json
  managed_policy_arns = [
    var.remote_state_read_write_policy_arn,
    aws_iam_policy.ui_deploy_policy.arn,
    aws_iam_policy.api_deploy_policy.arn,
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
    "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
    "arn:aws:iam::aws:policy/IAMFullAccess",
    "arn:aws:iam::aws:policy/AWSAppSyncAdministrator"
  ]
}

output "deploy_role_arn" {
  value = aws_iam_role.deploy_role.arn
}
