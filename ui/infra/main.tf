terraform {
  backend "s3" {
    key                  = "colony-survival-calculator/ui/terraform.tfstate"
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

provider "aws" {
  alias  = "certificate_region"
  region = var.certificate_region
}

locals {
  uk_domain_name                         = "factorycalculator.co.uk"
  com_domain_name                        = "factorycalculator.com"
  static_file_origin_id                  = "UIStaticAssetOrigin"
  cloudfront_distribution_hosted_zone_id = "Z2FDTNDATAQYW2"
  root_object                            = "index.html"
}

data "aws_cloudfront_cache_policy" "managed_caching_optimized_cache_policy" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "managed_cors_s3origin_cache_policy" {
  name = "Managed-CORS-S3Origin"
}

resource "aws_route53_zone" "uk_hosted_zone" {
  count = terraform.workspace == "prod" ? 1 : 0
  name  = local.uk_domain_name
}

resource "aws_route53_zone" "com_hosted_zone" {
  count = terraform.workspace == "prod" ? 1 : 0
  name  = local.com_domain_name
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

  default_root_object = local.root_object
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
    acm_certificate_arn            = terraform.workspace == "prod" ? aws_acm_certificate.site_certificate[0].arn : null
    minimum_protocol_version       = terraform.workspace == "prod" ? "TLSv1.2_2018" : null
    ssl_support_method             = terraform.workspace == "prod" ? "sni-only" : null
    cloudfront_default_certificate = terraform.workspace != "prod"
  }

  restrictions {
    geo_restriction {

      locations        = []
      restriction_type = "none"
    }
  }

  aliases = terraform.workspace == "prod" ? [local.com_domain_name, local.uk_domain_name] : null
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/${local.root_object}"
  }
}

data "aws_iam_policy_document" "static_file_bucket_cloudfront_access_policy" {
  statement {
    actions = [
      "s3:GetObject*"
    ]
    resources = [
      "${aws_s3_bucket.static_file_bucket.arn}/*",
    ]
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values = [
        aws_cloudfront_distribution.static_file_distribution.arn
      ]
    }
  }
}

resource "aws_s3_bucket_policy" "static_file_bucket_policy" {
  bucket = aws_s3_bucket.static_file_bucket.id
  policy = data.aws_iam_policy_document.static_file_bucket_cloudfront_access_policy.json
}

resource "aws_acm_certificate" "site_certificate" {
  count                     = terraform.workspace == "prod" ? 1 : 0
  provider                  = aws.certificate_region
  domain_name               = local.com_domain_name
  subject_alternative_names = [local.uk_domain_name]
  validation_method         = "DNS"
}

resource "aws_route53_record" "uk_hosted_zone_certificate_validation_records" {
  for_each = {
    for dvo in(terraform.workspace == "prod" ? aws_acm_certificate.site_certificate[0].domain_validation_options : []) : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.uk_hosted_zone[0].zone_id
}

resource "aws_route53_record" "com_hosted_zone_certificate_validation_records" {
  for_each = {
    for dvo in(terraform.workspace == "prod" ? aws_acm_certificate.site_certificate[0].domain_validation_options : []) : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.com_hosted_zone[0].zone_id
}

resource "aws_route53_record" "uk_hosted_zone_alias_record" {
  count   = terraform.workspace == "prod" ? 1 : 0
  zone_id = aws_route53_zone.uk_hosted_zone[0].zone_id
  name    = local.uk_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.static_file_distribution.domain_name
    zone_id                = local.cloudfront_distribution_hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "com_hosted_zone_alias_record" {
  count   = terraform.workspace == "prod" ? 1 : 0
  zone_id = aws_route53_zone.com_hosted_zone[0].zone_id
  name    = local.com_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.static_file_distribution.domain_name
    zone_id                = local.cloudfront_distribution_hosted_zone_id
    evaluate_target_health = true
  }
}

output "static_file_bucket_name" {
  value = aws_s3_bucket.static_file_bucket.id
}

output "static_file_distribution_domain_name" {
  value = terraform.workspace == "prod" ? null : aws_cloudfront_distribution.static_file_distribution.domain_name
}

output "static_file_distribution_id" {
  value = aws_cloudfront_distribution.static_file_distribution.id
}
