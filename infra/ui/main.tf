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

locals {
  static_file_origin_id = "UIStaticAssetOrigin"
}

data "aws_cloudfront_cache_policy" "managed_caching_optimized_cache_policy" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "managed_cors_s3origin_cache_policy" {
  name = "Managed-CORS-S3Origin"
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

resource "aws_cloudfront_origin_access_control" "static_file_origin_access_control" {
  name                              = "static_file_origin_access_control-${terraform.workspace}"
  description                       = ""
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "static_file_distribution" {
  enabled = true
  origin {
    domain_name              = aws_s3_bucket.static_file_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.static_file_origin_access_control.id
    origin_id                = local.static_file_origin_id
  }

  default_root_object = "index.html"
  default_cache_behavior {
    allowed_methods          = ["GET", "HEAD"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = local.static_file_origin_id
    viewer_protocol_policy   = "redirect-to-https"
    cache_policy_id          = data.aws_cloudfront_cache_policy.managed_caching_optimized_cache_policy.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.managed_cors_s3origin_cache_policy.id
  }

  price_class = "PriceClass_100"
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {

      locations        = []
      restriction_type = "none"
    }
  }
}

output "static_file_bucket_name" {
  value = aws_s3_bucket.static_file_bucket.id
}
