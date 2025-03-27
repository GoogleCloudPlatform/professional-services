# -----------------------------------------------------------------------------
# Outputs - Export important information
# -----------------------------------------------------------------------------

output "locust_master_web_ip" {
  description = "The IP address of the Locust master web LoadBalancer"
  value       = kubernetes_service.locust_master_web.status[0].load_balancer[0].ingress[0].ip
}

output "locust_master_svc_name" {
  description = "The name of the Locust master service"
  value       = kubernetes_service.locust_master_web.metadata[0].name
}

output "locust_master_node_name" {
  description = "The name of the Locust master node"
  value       = kubernetes_service.locust_master.metadata[0].name
}

output "gke_cluster_name" {
  description = "The name of the deployed GKE cluster"
  value       = google_container_cluster.ltf_autopilot_cluster.name
}

output "locust_namespace" {
  description = "The Kubernetes namespace where Locust resources are deployed"
  value       = kubernetes_namespace.locust_namespace.metadata[0].name
}

