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

    * iam.serviceAccountUser

    * roles/compute.admin

    * roles/compute.securityAdmin

    * roles/storage.admin

    * roles/cloudsql.admin

    * roles/dataproc.editor

## Required Inputs

The following input variables are required:

## Optional Inputs

The following input variables are optional (have default values):

### activation\_policy

Description: This specifies when the instance should be active. Can be either `ALWAYS`, `NEVER` or `ON_DEMAND`.

Type: `string`

Default: `"ALWAYS"`

### broker\_node\_count

Description: Number of Broker node of druid to be created.

Type: `string`

Default: `"2"`

### broker\_node\_name

Description: Name of the Broker node

Type: `string`

Default: `"\u003cbroker_node_name\u003e"`

### bucket\_name

Description: Name for the bucket to be created, it will be used for storing the initialization script, dataproc logs and hadoop configuration files.

Type: `string`

Default: `"\u003cbucket_name\u003e"`

### cloud\_sql\_instance\_name

Description: Name of the CloudSQL resource to be created.

Type: `string`

Default: `"\u003csql_instance_name\u003e"`

### coordinator\_node\_count

Description: Number of Cordinator node of druid to be created.

Type: `string`

Default: `"1"`

### coordinator\_node\_name

Description: Name of the Coordinator node

Type: `string`

Default: `"\u003ccoordinator_node_name\u003e"`

### database\_version

Description: The version of of the database. For example, `MYSQL_5_6` or `POSTGRES_9_6`.

Type: `string`

Default: `"MYSQL_5_7"`

### dataproc\_cluster\_name

Description: Cluster name for dataproc.

Type: `string`

Default: `"\u003cdataproc_cluster_name\u003e"`

### dataproc\_master\_boot\_disk\_size\_gb

Description: Size of the disk for dataproc master node.

Type: `string`

Default: `"200"`

### dataproc\_master\_count

Description: Number of dataproc master node to be created.

Type: `string`

Default: `"1"`

### dataproc\_master\_machine\_type

Description: Machine type for dataproc master node.

Type: `string`

Default: `"n1-standard-8"`

### dataproc\_worker\_boot\_disk\_size\_gb

Description: Size of the disk for dataproc worker node.

Type: `string`

Default: `"500"`

### dataproc\_worker\_count

Description: Number of dataproc worker node to be created.

Type: `string`

Default: `"6"`

### dataproc\_worker\_machine\_type

Description: Machine type for dataproc worker node.

Type: `string`

Default: `"n1-standard-32"`

### db\_name

Description: Name of the default database to create

Type: `string`

Default: `"druid"`

### disk\_size

Description: Second generation only. The size of data disk, in GB. Size of a running instance cannot be reduced but can be increased.

Type: `string`

Default: `"10"`

### disk\_type

Description: Second generation only. The type of data disk: `PD_SSD` or `PD_HDD`.

Type: `string`

Default: `"PD_SSD"`

### druid\_broker\_disk

Description: Operating System for Druid Broker node.

Type: `string`

Default: `"ubuntu-os-cloud/ubuntu-1604-lts"`

### druid\_broker\_disk\_size

Description: Disk size for Druid Broker node.

Type: `string`

Default: `"200"`

### druid\_broker\_machine\_type

Description: Machine type for Druid Broker node.

Type: `string`

Default: `"n1-standard-8"`

### druid\_conf\_path

Description: Path for configuration to be stored in all the druid nodes.

Type: `string`

Default: `"/opt/druid/druid-0.13.0/conf/druid/_common/common.runtime.properties"`

### druid\_coordinator\_disk

Description: Operating System for Druid Coordinator node.

Type: `string`

Default: `"ubuntu-os-cloud/ubuntu-1604-lts"`

### druid\_coordinator\_disk\_size

Description: Disk size for Druid Coordinator node.

Type: `string`

Default: `"200"`

### druid\_coordinator\_machine\_type

Description: Machine type for Druid Coordinator node.

Type: `string`

Default: `"n1-standard-2"`

### druid\_historical\_disk

Description: Operating System for Druid Historical node.

Type: `string`

Default: `"ubuntu-os-cloud/ubuntu-1604-lts"`

### druid\_historical\_disk\_size

Description: Disk size for Druid Historical node.

Type: `string`

Default: `"200"`

### druid\_historical\_machine\_type

Description: Machine type for Druid Historical node.

Type: `string`

Default: `"n1-standard-8"`

### druid\_middlemanager\_disk

Description: Operating System for Druid Middlemanager node.

Type: `string`

Default: `"ubuntu-os-cloud/ubuntu-1604-lts"`

### druid\_middlemanager\_disk\_size

Description: Disk size for Druid Middlemanager node.

Type: `string`

Default: `"200"`

### druid\_middlemanager\_machine\_type

Description: Machine type for Druid Middlemanager node.

Type: `string`

Default: `"n1-standard-8"`

### druid\_overlord\_disk

Description: Operating System for Druid Overlord node.

Type: `string`

Default: `"ubuntu-os-cloud/ubuntu-1604-lts"`

### druid\_overlord\_disk\_size

Description: Disk size for Druid Overlord node.

Type: `string`

Default: `"200"`

### druid\_overlord\_machine\_type

Description: Machine type for Druid Overlord node.

Type: `string`

Default: `"n1-standard-2"`

### druid\_router\_disk

Description: Operating System for Druid Router node.

Type: `string`

Default: `"ubuntu-os-cloud/ubuntu-1604-lts"`

### druid\_router\_disk\_size

Description: Disk size for Druid Overlord node.

Type: `string`

Default: `"200"`

### druid\_router\_machine\_type

Description: Machine type for Druid Router node.

Type: `string`

Default: `"n1-standard-8"`

### historical\_node\_count

Description: Number of Historical node to be created.

Type: `string`

Default: `"2"`

### historical\_node\_name

Description: Name of the Historical node

Type: `string`

Default: `"\u003chistorical_name\u003e"`

### kafka\_disk

Description: Kafka Operating System.

Type: `string`

Default: `"ubuntu-os-cloud/ubuntu-1604-lts"`

### kafka\_machine\_type

Description: Kafka cluster machine type.

Type: `string`

Default: `"n1-standard-1"`

### kafka\_name

Description: Name for kafka nodes

Type: `string`

Default: `"\u003ckafka_node_name\u003e"`

### master\_instance\_name

Description: The name of the master instance to replicate

Type: `string`

Default: `"sql-master-instance-druid-0.13"`

### middlemanager\_node\_count

Description: Number of Middlemanager node to be created.

Type: `string`

Default: `"1"`

### middlemanager\_node\_name

Description: Name of the Middlemanager node

Type: `string`

Default: `"\u003cmiddlemanager_node_name\u003e"`

### mod\_startup\_script

Description: This variable is used internally.

Type: `string`

Default: `"default"`

### network

Description: VPC network to be used for cloudsql vpc peering.

Type: `string`

Default: `"default"`

### overlord\_node\_count

Description: Number of Overlord node of druid to be created.

Type: `string`

Default: `"1"`

### overlord\_node\_name

Description: Name of the Overlord node

Type: `string`

Default: `"\u003coverlord_node_name\u003e"`

### private\_ip\_name

Description: VPC private network name to be created for cloudsql vpc peering.

Type: `string`

Default: `"druid-private-network"`

### project

Description: Project in which resources should be created.

Type: `string`

Default: `"\u003cproject_id\u003e"`

### region

Description: Region in which following resources should be created.

Type: `string`

Default: `"us-central1"`

### router\_node\_count

Description: Number of Overlord node of druid to be created.

Type: `string`

Default: `"1"`

### router\_node\_name

Description: Name of the Historical node

Type: `string`

Default: `"\u003crouter_node_name\u003e"`

### tier

Description: The machine tier (First Generation) or type (Second Generation). See this page for supported tiers and pricing: https://cloud.google.com/sql/pricing

Type: `string`

Default: `"db-f1-micro"`

### user\_host

Description: The host for the default user

Type: `string`

Default: `"%"`

### user\_name

Description: The name of the default user

Type: `string`

Default: `"druid"`

### zone

Description: Zone in the region for the resources to be created.

Type: `string`

Default: `"us-central1-a"`

### zookeeper\_disk

Description: Zookeeper Operating System.

Type: `string`

Default: `"ubuntu-os-cloud/ubuntu-1604-lts"`

### zookeeper\_ip\_list

Description: This variable is used internally for storing the list of Zookeeper clusters IP Address

Type: `list`

Default: `<list>`

### zookeeper\_ip\_ls

Description: This variable is used for Kafka to store zookeeper clusters IP address

Type: `list`

Default: `<list>`

### zookeeper\_machine\_type

Description: Zookeeper cluster machine type.

Type: `string`

Default: `"n1-standard-1"`

### zookeeper\_name

Description: Name for zookeeper nodes

Type: `string`

Default: `"\u003czookeeper_node\u003e"`

## Outputs

The following outputs are exported:

### bucket\_url

Description: Bucket URL

### druid\_coordinator\_console

Description: Console of Coordinator node

### druid\_overlord\_console

Description: Console of Overlord node

### private\_network

Description: URL of alloted private network for service VPC peering

### sql\_ip

Description: IP address of the node

### sql\_name

Description: SQL instance name

### sql\_password\_op

Description: SQL instance random generated password

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
