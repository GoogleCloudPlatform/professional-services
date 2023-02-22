output "cluster_name" {
  description = "Cluster where resources are created. (Data)"
  value       = data.google_container_cluster.my_cluster.name
}

output "gitlab_cluster_agent" {
  description = "Gitlab cluster agent details."
  value = {
    id   = gitlab_cluster_agent.this.agent_id
    name = gitlab_cluster_agent.this.name
  }
}

output "gitlab_cluster_agent_token" {
  description = "Gitlab cluster agent token (sensitive)"
  value       = gitlab_cluster_agent_token.this.token
  sensitive   = true
}

output "gitlab_repository_file" {
  description = "Gitlab repository file details"
  value = {
    path    = gitlab_repository_file.agent_config.file_path
    project = gitlab_repository_file.agent_config.project
    content = gitlab_repository_file.agent_config.content
  }
}

output "kubernetes_namespace_gitlab" {
  description = "Namepace where gitlab agent is deployed"
  value       = kubernetes_namespace_v1.gitlab.id
}

output "kubernetes_namespace_product" {
  description = "Namespace where product containers are deployed"
  value       = kubernetes_namespace.product.id
}

output "kubernetes_service_account_gitlab" {
  description = "Service account that updates product pods on behalf of KAS agent"
  value       = kubernetes_service_account_v1.gitlab.id
}