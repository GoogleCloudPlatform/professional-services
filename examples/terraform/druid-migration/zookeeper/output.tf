output "zookeeper_ip_list" {
  description = "List of zookeeper cluster"
  value       = "${google_compute_instance.zookeeper.*.network_interface.0.network_ip}"
}
