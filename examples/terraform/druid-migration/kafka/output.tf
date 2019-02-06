output "kafka_ip" {
  description = "Comma separated Kafka node IP in a cluster"
  value       = "${join(",", google_compute_instance.kafka.*.network_interface.0.network_ip)}"
}

output "kafka_ip_list" {
  description = "Comma separated Kafka node IP in a cluster"
  value       = "${google_compute_instance.kafka.*.network_interface.0.network_ip}"
}
