# Frontend hosting decision

The Next.js app runs as a second ECS Fargate service (defined in the `ecs` module,
behind the same ALB as the API) rather than as a static export on S3 + CloudFront.

**Why**: this project's frontend uses the App Router with Server Components and
Clerk's server-side auth helpers (`auth()` in Server Components, calling the API
with a server-obtained token). A static export would mean giving up SSR and
dynamic rendering entirely — defeating the reason App Router was chosen. Running
it as a container keeps the IaC simpler (one `ecs` module handles both services)
and is honest about what Next.js actually needs to run.

## Alternative: S3 + CloudFront (not wired in)

If the app were ever converted to a fully static export (no SSR, no server-side
Clerk calls), the cheaper path would look like this:

```hcl
# resource "aws_s3_bucket" "frontend" {
#   bucket = "${var.name}-web-static"
# }
#
# resource "aws_cloudfront_distribution" "frontend" {
#   origin {
#     domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
#     origin_id   = "s3-frontend"
#     s3_origin_config {
#       origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
#     }
#   }
#   enabled             = true
#   default_root_object = "index.html"
#   default_cache_behavior {
#     target_origin_id       = "s3-frontend"
#     viewer_protocol_policy = "redirect-to-https"
#     allowed_methods        = ["GET", "HEAD"]
#     cached_methods          = ["GET", "HEAD"]
#     forwarded_values {
#       query_string = false
#       cookies { forward = "none" }
#     }
#   }
#   restrictions {
#     geo_restriction { restriction_type = "none" }
#   }
#   viewer_certificate {
#     cloudfront_default_certificate = true
#   }
# }
```

This module intentionally contains no executable `.tf` files — it exists to
document the trade-off, not to be applied.
