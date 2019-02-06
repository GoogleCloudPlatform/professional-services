output "presto_worker_ip_op" {
  description = "IP address of Presto worker"
  value       = "${google_compute_instance.presto-worker.*.network_interface.0.network_ip}"
}

output "presto_worker_id_op" {
  description = "Instance Id of Presto worker"
  value       = "${google_compute_instance.presto-worker.*.instance_id}"
}
