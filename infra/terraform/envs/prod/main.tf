module "vpc" {
  source = "../../modules/vpc"
  name   = var.project_name
}

module "alb" {
  source            = "../../modules/alb"
  name              = var.project_name
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
}

module "ecr" {
  source = "../../modules/ecr"
}

# The ECS task definitions below reference Secrets Manager ARNs (module.secrets)
# and the RDS instance (module.rds) references the ECS security group
# (module.ecs.app_security_group_id). This is not a circular module dependency:
# Terraform resolves it at the resource level — the security group resource has
# no dependency on secrets/rds, only the task definition resources do, so the
# real build order is vpc/alb/ecr -> ecs(security group) -> rds -> secrets ->
# ecs(task definitions).
module "ecs" {
  source                 = "../../modules/ecs"
  name                    = var.project_name
  aws_region              = var.aws_region
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  alb_security_group_id   = module.alb.security_group_id
  secret_arns = [
    module.secrets.database_url_arn,
    module.secrets.clerk_secret_key_arn,
    module.secrets.anthropic_api_key_arn,
  ]

  services = {
    api = {
      image            = "${module.ecr.repository_urls["job-hunt-api"]}:latest"
      container_port   = 3001
      cpu              = 256
      memory           = 512
      desired_count    = 1
      target_group_arn = module.alb.api_target_group_arn
      environment = {
        PORT            = "3001"
        WEB_APP_URL     = "https://${module.alb.dns_name}"
        ANTHROPIC_MODEL = "claude-sonnet-5"
      }
      secrets = {
        DATABASE_URL      = module.secrets.database_url_arn
        CLERK_SECRET_KEY  = module.secrets.clerk_secret_key_arn
        ANTHROPIC_API_KEY = module.secrets.anthropic_api_key_arn
      }
    }
    # NEXT_PUBLIC_* values are baked into the Next.js build at image-build time
    # (see infra/docker/web.Dockerfile build args) — changing them here does
    # NOT change the running container; the image must be rebuilt.
    web = {
      image            = "${module.ecr.repository_urls["job-hunt-web"]}:latest"
      container_port   = 3000
      cpu              = 256
      memory           = 512
      desired_count    = 1
      target_group_arn = module.alb.web_target_group_arn
      environment = {}
      secrets = {
        CLERK_SECRET_KEY = module.secrets.clerk_secret_key_arn
      }
    }
  }
}

module "rds" {
  source                 = "../../modules/rds"
  name                    = var.project_name
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  app_security_group_id   = module.ecs.app_security_group_id
  db_username             = var.db_username
  db_password             = var.db_password
}

module "secrets" {
  source            = "../../modules/secrets"
  name              = var.project_name
  database_url      = "postgresql://${var.db_username}:${var.db_password}@${module.rds.endpoint}/${module.rds.db_name}?schema=public"
  clerk_secret_key  = var.clerk_secret_key
  anthropic_api_key = var.anthropic_api_key
}
