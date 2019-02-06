output "bucket_url" {
  description = "Bucket URL"
  value       = "${module.cloudsql.bucket_url}"
}

output "sql_ip" {
  description = "IP address of the node"
  value       = "${module.cloudsql.instance_address}"
}

output "sql_name" {
  description = "SQL instance name"
  value       = "${module.cloudsql.instance_name}"
}

output "sql_password_op" {
  description = "SQL instance random generated password"
  value       = "${module.cloudsql.sql_password}"
}

output "private_network" {
  description = "URL of alloted private network for service VPC peering"
  value       = "${module.cloudsql.private_network_url}"
}

output "druid_overlord_console" {
  description = "Console of Overlord node"
  value       = "http://${module.druid_overlord.instance_ip}:8090"
}

output "druid_coordinator_console" {
  description = "Console of Coordinator node"
  value       = "http://${module.druid_coordinator.instance_ip}:8081"
}

//To get a full output of other resources uncomment below section
/*
output "kafka_cluster_ip" {
  description = "IP address of Kafka cluster node"
  value       = "${module.kafka.kafka_ip_list}"
}

output "zookeeper_cluster_ip" {
  description = "IP address of Zookeeper cluster node"
  value       = "${module.zookeeper.zookeeper_ip_list}"
}

output "druid_historical" {
  description = "IP address of Historical node"
  value       = "${module.druid_historical.druid_historical}"
}

output "druid_broker" {
  description = "IP address of Broker node"
  value       = "${module.druid_broker.druid_broker}"
}

output "druid_middlemanager" {
  description = "IP address of MiddleManager node"
  value       = "${module.druid_middlemanager.druid_middlemanager}"
}

output "druid_overlord" {
  description = "IP address of Overlord node"
  value       = "${module.druid_overlord.druid_overlord}"
}

output "druid_coordinator" {
  description = "IP address of Coordinator node"
  value       = "${module.druid_coordinator.druid_coordinator}"
}
*/

