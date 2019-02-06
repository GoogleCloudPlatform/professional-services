output "bucket_url" {
  description = "Bucket URL"
  value       = "${module.cloudsql.bucket_url}"
}

output "sql_ip" {
  description = "IP address of the node"
  value       = "${module.cloudsql.instance_address}"
}

output "private_network" {
  description = "URL of alloted private network for service VPC peering"
  value       = "${module.cloudsql.private_network_url}"
}

output "dataproc_master_name" {
  description = "Dataproc master name"
  value       = "${module.dataproc.master_name_op}"
}

output "presto_master_ip_op" {
  description = "IP address of Presto master"
  value       = "${module.presto_master.presto_master_ip_op}"
}

output "presto_worker_ip_op" {
  description = "IP address of Presto master"
  value       = "${module.presto_worker.presto_worker_ip_op}"
}
