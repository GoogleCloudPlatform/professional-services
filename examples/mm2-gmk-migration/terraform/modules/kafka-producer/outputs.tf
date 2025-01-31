output "project_name" {
  value       = var.project_id
  description = "project name"
}

output "kafka_producer_instance" {
  value       = google_compute_instance.kafka-producer.name
  description = "Kafka producer instance id"
}