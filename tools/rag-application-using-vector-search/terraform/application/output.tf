
output "backend_service_uri" {
  description = "URI of backend cloud run service"
  value       = google_cloud_run_v2_service.backend_service.uri
}

output "frontend_service_uri" {
  description = "URI of frontend cloud run service"
  value       = google_cloud_run_v2_service.frontend_service.uri
}

output "lro_database_id" {
  description = "Database ID for the Firestore setup to track pending and failed LROs"
  value       = google_firestore_database.lro_status_database.id
}

output "import_result_sink" {
  description = "The URL of the GCS bucket where RAG Engine will store import result files."
  value       = google_storage_bucket.rag_import_result_sink.url
}
