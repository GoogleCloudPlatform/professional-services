output "master_name_op" {
  description = "List of dataproc master instances name"
  value       = "${google_dataproc_cluster.ephemeral-dataproc.cluster_config.0.master_config.0.instance_names.0}"
}

output "worker_name_op" {
  description = "List of dataproc worker instances name"
  value       = "${google_dataproc_cluster.ephemeral-dataproc.cluster_config.0.worker_config.0.instance_names.0}"
}
