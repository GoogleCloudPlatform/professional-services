output "presto_master_ip_op" {
  description = "IP address of Presto master"
  value       = "${google_compute_instance.presto-master.0.network_interface.0.network_ip}"
}

output "presto_master_id_op" {
  description = "Instance Id of Presto master"
  value       = "${google_compute_instance.presto-master.instance_id}"
}
