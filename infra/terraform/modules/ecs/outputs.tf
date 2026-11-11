output "app_security_group_id" {
  value = aws_security_group.app.id
}

output "cluster_name" {
  value = aws_ecs_cluster.this.name
}
