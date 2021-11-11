# Testing GCS Connector for Dataproc

The Google Cloud Storage connector for Hadoop (HCFS) enables running [Apache Hadoop](http://hadoop.apache.org/) or [Apache Spark](http://spark.apache.org/) jobs directly on data in [GCS](https://cloud.google.com/storage) by implementing the Hadoop FileSystem interface. The connector is developed as an [open source project](https://github.com/GoogleCloudDataproc/hadoop-connectors) and comes preinstalled on Cloud Dataproc clusters.
To install a released version of the connector see the [installing instructions](https://github.com/GoogleCloudDataproc/hadoop-connectors/blob/master/gcs/INSTALL.md).

In some cases we want to test features that have not been released but are in the master branch (or a development branch if you are preparing a PR).
The script `build_gcs_connector.sh` will use the steps below to install the GCS Connector for Dataproc for testing purposes from the source code.

### Building the GCS connector for Dataproc on GCP

The script `build_gcs_connector.sh` will install the GCS Connector on a Dataproc cluster on GCP using Terraform. Before running this script, you will need to update the environment variables at the top of the script as shown below:

```bash
PROJECT_ID=gcs-connector
REGION=us-central1
NETWORK_NAME=dataingestion-net
DATAPROC_CLUSTER_NAME=dataproc-cluster
DATAPROC_SUBNET=dataproc-subnet
HADOOP_VERSION=hadoop2-2.2.0
```

You will also need to update the `HADOOP_VERSION` variable at the top of `connectors.sh`, the initialization script for the Dataproc cluster, as shown below:

```bash
HADOOP_VERSION=hadoop2-2.2.0
```

Finally, for testing, you will need to update the two environment variables at the top of `test_gcs_connector.sh` as shown below:

```bash
export YOUR_BUCKET=output-examples
export YOUR_CLUSTER=dataproc-cluster
```

Once all of the above variables are updated, the main script `build_gcs_connector.sh` will build the GCS connector JAR file, upload it to a GCS bucket, create a Dataproc cluster using the GCS connector, and then test the Dataproc cluster. To do this, run:

```bash
./build_gcs_connector.sh
```

The steps below outline the process executed by the script:

### 1. Clone the Hadoop connectors

Clone the Hadoop connector locally from the [GoogleCloudDataproc/hadoop-connectors](https://github.com/GoogleCloudDataproc/hadoop-connectors/blob/master/gcs/README.md) GitHub.

### 2. Build the shaded JAR file and upload to GCS

Build the JAR file by running the following commands from the main directory `hadoop-connectors/` of the cloned project:

```bash
# with Hadoop 2 and YARN support:
./mvnw -P hadoop2 clean package
# with Hadoop 3 and YARN support:
./mvnw -P hadoop3 clean package
```

In order to verify test coverage for specific Hadoop version, run the following commands from the main directory `hadoop-connectors/`:

```bash
# with Hadoop 2 and YARN support:
./mvnw -P hadoop2 -P coverage clean verify
# with Hadoop 3 and YARN support:
./mvnw -P hadoop3 -P coverage clean verify
```

The connector JAR file will be found in `hadoop-connectors/gcs/target/`.  In order for the connector to work, use the `-shaded.jar` as it contains all the dependencies.

Terraform will create a GCS bucket and upload this JAR to the bucket at `gs://gcs-connector-init_actions/gcs-connector-${HADOOP_VERSION}-shaded.jar` so the Dataproc cluster will be able to access it.

### 3. Provide the Dataproc initialization script (with Terraform)

When creating the [Google Cloud Dataproc](https://cloud.google.com/dataproc) cluster, you can specify the [inititalization action](https://cloud.google.com/dataproc/docs/concepts/configuring-clusters/init-actions) to install the specified version of the [GCS connector](https://github.com/GoogleCloudDataproc/hadoop-connectors/blob/master/gcs/README.md) on the cluster. The initalization actions for updating the GCS connector for Dataproc is based off of the `connectors.sh` script from the [GoogleCloudDataproc/initalization-actions](https://github.com/GoogleCloudDataproc/initialization-actions/tree/master/connectors) GitHub repository.

The `connectors.sh` file in this repository will be the initialization script for the Dataproc cluster. Terraform will rename this script to `dataproc-init-script.sh` before uploading it to the `gs://gcs-connector-init_actions/` GCS bucket. It will then specify `dataproc-init-script.sh` as an initialization action for the Dataproc cluster.

### 4. Run Terraform

From the main directory of this project `gcs-connector-poc/`, the script will run the following commands to build the Dataproc cluster using the GCS connector.

```bash
cd terraform
terraform init
terraform apply
```

### 6. Test the Dataproc cluster

The script `test_gcs_connector.sh` will test the GCS Connector on your Dataproc cluster. This script will create a table `Names` in [HDFS](https://hadoop.apache.org/docs/r1.2.1/hdfs_design.html#Introduction), load data from a public GCS directory into the table, and then write the data from the `Names` table into a new table in the specified bucked (`$YOUR_BUCKET`) in GCS. If the GCS Connector is set up correctly, the job will succeed and the list of sample names from the public directory will be printed.
