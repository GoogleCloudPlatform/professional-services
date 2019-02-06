# Launch Presto on Compute Engine using Terraform

Terraform script to launch Presto on Compute Engine instances with Cloud 
Dataproc as the Hive backend. Dataproc uses Cloud SQL as the Hive metastore and 
Cloud Storage as the Hive warehouse.

# Architectural Diagram

![Alt text](presto_workflow.png?raw=true)

# Setup the environment
1. Clone the repository.
```
git clone <repo_link>
cd presto_terraform/
```
2. [Create a service account](https://cloud.google.com/iam/docs/creating-managing-service-accounts#creating_a_service_account) and grant the following roles to the service account by following these [instructions](https://cloud.google.com/iam/docs/granting-roles-to-service-accounts#granting_access_to_a_service_account_for_a_resource).
	1. Service Networking Admin - roles/servicenetworking.networksAdmin
	2. Service Account User - roles/iam.serviceAccountUser
    3. Compute Admin - roles/compute.admin
    4. Compute Security Admin - roles/compute.securityAdmin
    5. Storage Admin - roles/storage.admin
    6. Cloud SQL Admin - roles/cloudsql.admin
    7. Dataproc Editor - roles/dataproc.editor
    

3. [Download](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#creating_service_account_keys) the service account key file to the root directory and replace the placeholder `KEY_FILE_NAME` with your json key file name in [provider_config.tf](provider_config.tf).
	
### Input variables

- `project` (required): GCP Project ID.
- `region` (optional): The region to create the resources in. Defaults to `us-central1`.
- `zone` (optional): The region to create the resources in. Defaults to `us-central1-a`.
- `bucket_name` (required): Name of the GCS bucket to act as the Hive warehouse.
- `cloud_sql_instance_name` (required): Name of the Cloud SQL instance to act as the Hive metastore.
- `tier` (optional): The machine tier for Cloud SQL instance. Defaults to `db-f1-micro`.
- `activation_policy` (optional): This specifies when the instance should be active. Can be either `ALWAYS`, `NEVER` or `ON_DEMAND`. Defaults to `ALWAYS`.
- `cloud_sql_disk_size` (optional): The size of the disk attached to the Cloud SQL instance, in GB. Defaults to `10` GB.
- `cloud_sql_disk_type` (optional): The type of the disk attached to the Cloud SQL instance: `PD_SSD` or `PD_HDD`.  Defaults to `PD_SSD`.
- `network` (optional): VPC network to be used for resource creation. Defaults to `default`.
- `private_ip_name` (optional): VPC private network name to be created for Cloud SQL vpc peering. Defaults to `presto-private-network`.
- `dataproc_cluster_name` (required): Dataproc cluster name.
- `dataproc_master_count` (optional): Number of Dataproc master nodes to be created. Defaults to `1`.
- `dataproc_master_machine_type` (optional): Machine type for the Dataproc master instance. Defaults to `n1-standard-1`. 
- `dataproc_master_boot_disk_size_gb` (optional): Boot disk size of the Dataproc master instance. Defaults to `15` GB.
- `dataproc_worker_count` (optional): Number of workers for the Dataproc cluster. Defaults to `2`.
- `dataproc_worker_machine_type` (optional): Machine type for the Dataproc worker instance. Defaults to `n1-standard-1`. 
- `dataproc_worker_boot_disk_size_gb` (optional): Boot disk size of the Dataproc worker instance. Defaults to `15` GB.
- `presto_cluster_name` (required): Identifier to be used for the Presto cluster. Master name ends with `-m` and worker names end with `-w-<ID>`.
- `presto_cluster_image` (optional): The project/image to use for the Presto master and workers. Defaults to `ubuntu-os-cloud/ubuntu-1604-lts`.
- `presto_master_machine_type` (optional): Machine type for the Presto master instance. Defaults to `n1-standard-1`.
- `presto_master_boot_disk_size_gb` (optional): Boot disk size of the Presto master instance. Defaults to `15` GB.
- `presto_worker_count` (optional): Number of workers for the Presto cluster. Defaults to `2`.
- `presto_worker_machine_type` (optional): Machine type for the Presto worker instance. Defaults to `n1-standard-1`.
- `presto_worker_boot_disk_size_gb` (optional): Boot disk size of the Presto worker instance. Defaults to `15` GB.
- `dataproc_ip` (readonly): This variable is used internally to send the Dataproc IP addresss to the shell script [presto.sh](presto.sh).


# Output variables

- `bucket_url`: The base URL of the Hive warehouse bucket, in the format `gs://<bucket-name>`.
- `sql_ip`: The IPv4 address assigned to the Cloud SQL Hive metastore instance.
- `private_network`: The URI of the private network created.
- `dataproc_master_name`: Name of the Dataproc master node.
- `presto_master_ip_op`: The internal ip address of the Presto master instance.
- `presto_worker_ip_op`: The internal ip addresses of the Presto worker instances.


# Resources created

- `google_compute_instance.presto-master`: Compute Engine VM instance to act as Presto coordinator.
- `google_compute_instance.presto-worker`: Compute Engine VM instance to act as Presto worker.
- `google_compute_firewall.presto-firewall`: Firewall rule to allow Presto VM instances with network tag `presto-service-discovery` to communicate internally via port 8080.
- `google_dataproc_cluster.dataproc-backend`: Dataproc cluster for Hive backend.
- `google_storage_bucket.hive-warehouse-dir`: Hive warehousing bucket and also served as staging bucket for the Dataproc cluster.
- `google_sql_database_instance.hive-metastore-instance`: Cloud SQL database instance with private network, acts as Hive metastore.
- `google_sql_user.root-user`: `root` user for the Cloud SQL database instance with empty password.
- `google_compute_global_address.private_ip_alloc`: Internal private network of prefix length of 20 from the network provided for VPC peering with Service Networking API.
- `google_service_networking_connection.googleservice`: It applies `servicenetworking.googleapis.com` service on provided internal network for Google's private services to communicate privately. It is used to access Cloud SQL with private IP address from the Dataproc cluster.


# Set Presto configuration parameters

Depending on the machine type you choose for Presto VM instances, set the 
JVM memory parameter in `configure_jvm` function and Presto configuration 
parameters in the `configure_master` and `configure_worker` functions with 
appropriate values in [presto.sh](presto.sh).


# Run terraform

Set the required input variables in [input.tfvars](input.tfvars) and 
the optional input variables in [variables.tf](variables.tf).
```
terraform init
terraform apply -var-file=input.tfvars
```

To see the output again, execute the following command from the `presto_terraform` folder.
```
terraform output
```

# Testing

Through the console, identify the Presto master instance using the internal IP 
address from the terraform output and SSH into it. Launch Presto by running the 
following command.
```
/usr/bin/presto --catalog hive
```
Run the command below in Presto shell to list down all the nodes and see if 
they are active.
```
presto> select * from system.runtime.nodes;
```

# Connecting with UI
Presto is configured to run on port 8080 on the Presto master node (though you 
can change this in the script). To connect to the Presto web interface, 
you will need to create an SSH tunnel and use a SOCKS 5 Proxy as described 
in the [documentation](https://cloud.google.com/dataproc/docs/concepts/accessing/cluster-web-interfaces#top_of_page).