output "project_name" {
  value       = var.project_id
  description = "project name"
}

output "managed_kafka_name" {
  value       = google_managed_kafka_cluster.cluster.cluster_id
  description = "Name of google managed kafka cluster"
}

output "kafka_topic_name" {
  value       = google_managed_kafka_topic.example-topic.topic_id
  description = "Kafka Topic ID"
}