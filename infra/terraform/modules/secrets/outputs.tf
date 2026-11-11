output "database_url_arn" {
  value = aws_secretsmanager_secret.database_url.arn
}

output "clerk_secret_key_arn" {
  value = aws_secretsmanager_secret.clerk_secret_key.arn
}

output "anthropic_api_key_arn" {
  value = aws_secretsmanager_secret.anthropic_api_key.arn
}
