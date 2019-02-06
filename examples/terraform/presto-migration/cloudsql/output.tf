output "bucket_url" {
  description = "The bucket url"
  value       = "${google_storage_bucket.hive-warehouse-dir.url}"
}

output "private_network_url" {
  description = "URL of private network created for VPC peering with service networking"
  value       = "${google_compute_global_address.private_ip_alloc.self_link}"
}

output "sql_db_instance_name_op" {
  description = "The name of the database instance"
  value       = "${google_sql_database_instance.hive-metastore-instance.name}"
}

output "instance_address" {
  description = "The IPv4 address of the master database instnace"
  value       = "${google_sql_database_instance.hive-metastore-instance.ip_address.0.ip_address}"
}
