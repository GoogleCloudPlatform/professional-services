output "project_number" {
  value = var.project_number
  description = "GCP Project number to parametereize GitHub workflow"
}

output "location" {
  value = var.location
  description = "Location variable to parametereize GitHub workflow"
}

output "wi_pool_id" {
  value = google_iam_workload_identity_pool.wi-pool.workload_identity_pool_id
  description = "Workload Identity Pool ID to parametereize GitHub workflow"
}