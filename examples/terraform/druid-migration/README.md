# Launch Druid on Compute Engine using Terraform

This can be used to provision Druid Cluster on GCP using Terraform

## Resources to launch

* CloudSQL Instance
 
* Dataproc Cluster
 
* Zookeeper Cluster
    
* Kafka Cluster
    
* Druid Cluster


## Architectural diagram
![Druid Architecture](https://storage.googleapis.com/pso-druid-migration/Druidarchitecture.png "Logo Title Text 1")

## setup the environment

1. Clone the repository.
```
git clone <repo_link>
cd druid_terraform/
```
2. [Create a service account](https://cloud.google.com/iam/docs/creating-managing-service-accounts#creating_a_service_account) and grant the following roles to the service account by following these [instructions](https://cloud.google.com/iam/docs/granting-roles-to-service-accounts#granting_access_to_a_service_account_for_a_resource)

    * Service networking admin
 
    *  iam.serviceAccountUser
 
    * roles/compute.admin
    
    * roles/compute.securityAdmin
    
    * roles/storage.admin
    
    * roles/cloudsql.admin
 
    * roles/dataproc.editor
    
	
## Input variables

Below are the variables which we are using while deploying the infrastructure using terraform.

- `project` (required): GCP Project ID.

- `region` (required): The region to create the resources in. Defaults to `us-central1`.

- `zone` (required): The region to create the resources in. Defaults to `us-central1-a`.

- `bucket_name` (required): Name of the GCS bucket to store configuration files and act as Druid metastore.

- `cloud_sql_instance_name` (required): Name of the Cloud SQL instance to act as Druid metastore.

- `database_version` (required): The version of of the database. Defaults to `MYSQL_5_7`.

- `master_instance_name` (required): The name of the master instance to create. Defaults to `sql-master-instance`.

- `tier` (required): The machine tier. Default is `db-f1-micro`.

- `db_name` (required): Name of the default database to create. Defaults to `druid`.

- `user_name` (required): The name of the default user. Defaults to `druid`.

- `user_host` (required): The host for the default user. Defaults to `%`.

- `activation_policy` (required): This specifies when the instance should be active. Can be either `ALWAYS`, `NEVER` or `ON_DEMAND`. Defaults to `ALWAYS`.

- `disk_size` (required): The size of data disk, in GB. Defaults to `10` GB.

- `disk_type` (required): The type of data disk: `PD_SSD` or `PD_HDD`. Defaults to `PD_SSD`.

- `network` (required): VPC network to be used for resource creation. Defaults to `default`.

- `private_ip_name` (required): VPC private network name to be created for Cloud SQL vpc peering. Defaults to `druid-private-network`.

- `dataproc_cluster_name` (required): Dataproc cluster name.

- `dataproc_master_count` (required): Number of dataproc master node to be created. Defaults to `1`.

- `dataproc_master_machine_type` (required): Machine type for the Dataproc master instance. Defaults to `n1-standard-1`. 

- `dataproc_master_boot_disk_size_gb` (required): Boot disk size of the Dataproc master instance. Defaults to `15` GB.

- `dataproc_worker_count` (required): Number of workers for the Dataproc cluster. Defaults to `2`.

- `dataproc_worker_machine_type` (required): Machine type for the Dataproc worker instance. Defaults to `n1-standard-1`.

- `dataproc_worker_boot_disk_size_gb` (required): Boot disk size of the Dataproc worker instance. Defaults to `15` GB.

- `mod_startup_script` (readonly): This variable is used internally to store the rendered shell script.

- `druid_conf_path` (required): Path for the common.runtime.properties to be stored in all of the druid nodes. Defaults to `/opt/druid/druid-0.12.3/conf/druid/_common/common.runtime.properties`.

- `zookeeper_name` (required): Name for zookeeper nodes, based on the count, index increases in instance name `-1`.

- `zookeeper_machine_type` (required): Machine type for Zookeeper cluster. Defaults to `n1-standard-1`.

- `zookeeper_disk` (required): Base image to be used for Zookeeper. Defaults to `ubuntu-os-cloud/ubuntu-1604-lts`.

- `zookeeper_ip_list` (readonly): This variable is used internally for storing the list of Zookeeper clusters IP Address.

- `zookeeper_ip_ls` (readonly): This variable is used internally for storing the list of Zookeeper clusters IP Address.

- `kafka_machine_type` (required): Machine type for Kafka cluster. Defaults to `n1-standard-1`.

- `kafka_name` (required): Name for kafka nodes, based on the count, index increases in instance name `-1`.

- `kafka_disk` (required): Base image to be used for Kafka. Defaults to `ubuntu-os-cloud/ubuntu-1604-lts`.

- `historical_node_name` (required): Name of the Historical node, based on the count, index increases in instance name `-1`.

- `historical_node_count` (required): Number of the Historical node to be created. Defaults to `1`.

- `druid_historical_disk_size` (required): Boot disk size of the Historical instance. Defaults to `200`GB.

- `druid_historical_machine_type` (required): Machine type for the Historical instance. Defaults to `n1-standard-32`.

- `druid_historical_disk` (required): Base image to be used for the Historical node. Defaults to `ubuntu-os-cloud/ubuntu-1604-lts`.

- `middlemanager_node_name` (required): Name of the MiddleManager node, based on the count, index increases in instance name `-1`.

- `middlemanager_node_count` (required): Number of the MiddleManager node to be created. Defaults to `1`.

- `druid_middlemanager_disk_size` (required): Boot disk size of the MiddleManager instance. Defaults to `200`GB.

- `druid_middlemanager_machine_type` (required): Machine type for the MiddleManager instance. Defaults to `n1-standard-32`.

- `druid_middlemanager_disk` (required): Base image to be used for the MiddleManager node. Defaults to `ubuntu-os-cloud/ubuntu-1604-lts`.

- `coordinator_node_name` (required): Name of the Coordinator node, based on the count, index increases in instance name `-1`.

- `coordinator_node_count` (required): Number of the Coordinator node to be created. Defaults to `1`.

- `druid_coordinator_disk_size` (required): Boot disk size of the Coordinator instance. Defaults to `200`GB.

- `druid_coordinator_machine_type` (required): Machine type for the Coordinator instance. Defaults to `n1-standard-2`.

- `druid_coordinator_disk` (required): Base image to be used for the Coordinator node. Defaults to `ubuntu-os-cloud/ubuntu-1604-lts`.

- `broker_node_name` (required): Name of the Broker node, based on the count, index increases in instance name `-1`.

- `broker_node_count` (required): Number of the Broker node to be created. Defaults to `1`.

- `druid_broker_disk_size` (required): Boot disk size of the Broker instance. Defaults to `200`GB.

- `druid_broker_machine_type` (required): Machine type for the Broker instance. Defaults to `n1-standard-32`.

- `druid_broker_disk` (required): Base image to be used for the Broker node. Defaults to `ubuntu-os-cloud/ubuntu-1604-lts`.

- `overlord_node_name` (required): Name of the Overlord node, based on the count, index increases in instance name `-1`.

- `overlord_node_count` (required): Number of the Overlord node to be created. Defaults to `1`.

- `druid_overlord_disk_size` (required): Boot disk size of the Overlord instance. Defaults to `200`GB.

- `druid_overlord_machine_type` (required): Machine type for the Overlord instance. Defaults to `n1-standard-2`.

- `druid_overlord_disk` (required): Base image to be used for the Overlord node. Defaults to `ubuntu-os-cloud/ubuntu-1604-lts`

- `router_node_name` (required): Name of the Router node, based on the count, index increases in instance name `-1`.

- `router_node_count` (required): Number of the Router node to be created. Defaults to `1`.

- `druid_router_disk_size` (required): Boot disk size of the Router instance. Defaults to `200`GB.

- `druid_router_machine_type` (required): Machine type for the Router instance. Defaults to `n1-standard-32`.

- `druid_router_disk` (required): Base image to be used for the Router node. Defaults to `ubuntu-os-cloud/ubuntu-1604-lts`.


## Run terraform

### Prerequisites 

* Terraform v0.11.11

* Modify fields with ‘< >’ in variables.tf with suitable input for the cluster

* Upload the Service Account key file  on terraform machine, the service account should have Project editor role, and Service Networking admin role.

* The path to the service account key file must be edited in the ‘provider_config.tf’ file for Terraform to use it

* Configured gcloud cli with the necessary service account which has editor access, and service network admin role for the project.

* Configuration of ‘google-beta’ provider of terraform, those must be configured before running as some of the Google Cloud features which are being used for the resources are in beta version. To follow a step by step guide to configure ‘google-beta’ provider, refer official terraform git repository.

Due to the dependency of components on each other, the execution takes place in three phases and below are the sequences to execute:

```
terraform apply -target=module.cloudsql
terraform apply -target=module.dataproc
terraform apply

```
