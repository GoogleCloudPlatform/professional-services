output "featurestore" {
  description = "Feature Store"
  value = google_vertex_ai_featurestore.featurestore
}

output "entities" {
  value = local.entities
}