output "bucket_url" {
  description = "The bucket url"
  value       = "${google_storage_bucket.staging-bucket.url}"
}

output "private_network_url" {
  description = "URL of private network created for VPC peering with service networking"
  value       = "${google_compute_global_address.private_ip_alloc.self_link}"
}

output "instance_name" {
  description = "The name of the database instance"
  value       = "${google_sql_database_instance.cloudsql.name}"
}

output "instance_address" {
  description = "The IPv4 address of the master database instnace"
  value       = "${google_sql_database_instance.cloudsql.ip_address.0.ip_address}"
}

output "instance_address_time_to_retire" {
  description = "The time the master instance IP address will be reitred. RFC 3339 format."
  value       = "${google_sql_database_instance.cloudsql.ip_address.0.time_to_retire}"
}

output "self_link" {
  description = "Self link to the master instance"
  value       = "${google_sql_database_instance.cloudsql.self_link}"
}

output "sql_password" {
  description = "SQL password"
  sensitive   = true
  value       = "${random_string.password.result}"
}
