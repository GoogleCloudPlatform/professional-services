# Migrate Hive tables to BigQuery

This framework migrates data from Hive to BigQuery using Cloud SQL to keep track of the migration progress. This is designed in such a way that it can handle migrating data both in an incremental fashion or bulk load at once. Bulk loading is when data under the Hive table is stable and all the data can be migrated at once. Incremental load is when data is continuously appending to the existing Hive table and there is a need to migrate the incremental data only from the subsequent runs of migration.
By default, this framework is expected to run on a source Hive cluster.

# Architectural Diagram
Cloud SQL keeps track of the
1. data in the source Hive table
2. files which are copied from the Hive cluster to Cloud Storage
3. files which are loaded from Cloud Storage into BigQuery

![Alt text](architectural_diagram.png?raw=true)

# Before you begin
1. Install gcloud SDK on the source Hive cluster by following these [instructions](https://cloud.google.com/sdk/install).
2. [Create a service account](https://cloud.google.com/iam/docs/creating-managing-service-accounts#creating_a_service_account) and grant the following roles to the service account by following these [instructions](https://cloud.google.com/iam/docs/granting-roles-to-service-accounts#granting_access_to_a_service_account_for_a_resource)
	1. Google Cloud Storage - storage.admin
	2. BigQuery - bigquery.dataEditor and bigquery.jobUser
	3. Cloud SQL - cloudsql.admin
3. [Download](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#creating_service_account_keys) the service account key file and set up the environment variable by following these [instructions](https://cloud.google.com/docs/authentication/getting-started#setting_the_environment_variable). 

	```
	export GOOGLE_APPLICATION_CREDENTIALS="[PATH_TO_KEY_FILE]"
	```
Note: Saving credentials in environment variables is convenient, but not secure - consider a more secure solution such as [Cloud KMS](https://cloud.google.com/kms/) to help keep secrets safe.

# Usage

1. Clone the repo.
```
git clone https://github.com/GoogleCloudPlatform/professional-services.git
cd professional-services/
git checkout feature/hive-bigquery
cd tools/hive-bigquery/
```
2. Install prerequisites such as python, pip, virtualenv and Cloud SQL proxy.
```
sudo sh prerequisites/prerequisites.sh
```
3. Activate the virtual environment.
```
virtualenv env
source env/bin/activate
pip install -r prerequisites/requirements.txt
```
4. [optional] Use an existing Cloud SQL instance for tracking the progress of 
migration or launch a new one. Run the below command to create an instance.
Set the root password when the script prompts for it. 
This will output the connection name of the instance which is of use in the 
next steps.
```
sh prerequisites/create_sql_instance.sh <INSTANCE_NAME> <DATABASE_NAME> <OPTIONAL_GCP_REGION>
```
5. Start the Cloud SQL proxy by providing the instance connection name obtained 
from the previous step and a TCP port (generally 3306 is used) on which the 
connection will be established.
```
/usr/local/bin/cloud_sql_proxy -instances=<INSTANCE_CONNECTION_NAME>=tcp:<PORT> &
```
6. Verify you are able to connect to the Cloud SQL database by running the 
command below. Provide the port which you used in the previous step and password 
for the root user that you have set in step 4.
```
mysql -h 127.0.0.1 -P <PORT> -u root -p
```

7. Usage
```
usage: hive_to_bigquery.py [-h] [--hive-server-host HIVE_SERVER_HOST]
                           [--hive-server-port HIVE_SERVER_PORT]
                           [--hive-server-username HIVE_SERVER_USERNAME]
                           --hive-database HIVE_DATABASE --hive-table
                           HIVE_TABLE --project-id PROJECT_ID --bq-dataset-id
                           BQ_DATASET_ID [--bq-table BQ_TABLE]
                           --bq-table-write-mode {overwrite,create,append}
                           --gcs-bucket-name GCS_BUCKET_NAME
                           [--incremental-col INCREMENTAL_COL]
                           [--use-clustering {False,True}]
                           --tracking-database-host TRACKING_DATABASE_HOST
                           [--tracking-database-port TRACKING_DATABASE_PORT]
                           [--tracking-database-user TRACKING_DATABASE_USER]
                           --tracking-database-db-name
                           TRACKING_DATABASE_DB_NAME

Framework to migrate Hive tables to BigQuery which uses Cloud SQL to keep
track of the migration progress.

optional arguments:
  -h, --help            show this help message and exit

required arguments:
  --hive-database HIVE_DATABASE
                        Hive database name
  --hive-table HIVE_TABLE
                        Hive table name
  --project-id PROJECT_ID
                        GCP Project ID
  --bq-dataset-id BQ_DATASET_ID
                        Existing BigQuery dataset ID
  --bq-table-write-mode {overwrite,create,append}
                        BigQuery table write mode. Use overwrite to overwrite
                        the previous runs of migration. Use create if you are
                        migrating for the first time. Use append to append to
                        the existing BigQuery table
  --gcs-bucket-name GCS_BUCKET_NAME
                        Existing GCS Bucket name. Provide either
                        gs://BUCKET_NAME or BUCKET_NAME. Hive data will be
                        copied to thisbucket and then loaded into BigQuery
  --tracking-database-db-name TRACKING_DATABASE_DB_NAME
                        Cloud SQL Tracking db name.Ensure you provide the same
                        db name if you have migrated previously

optional arguments:
  --hive-server-host HIVE_SERVER_HOST
                        Hive server IP address or hostname, defaults to
                        localhost
  --hive-server-port HIVE_SERVER_PORT
                        Hive server port, defaults to 10000
  --hive-server-username HIVE_SERVER_USERNAME
                        Hive username, defaults to None
  --bq-table BQ_TABLE   BigQuery table name
  --incremental-col INCREMENTAL_COL
                        Provide the incremental column name if present in the
                        Hive table
  --use-clustering {False,True}
                        Boolean to indicate whether to use clustering in
                        BigQuery if supported
  --tracking-database-host TRACKING_DATABASE_HOST
                        Cloud SQL Tracking database host address,
                        defaults to localhost
  --tracking-database-port TRACKING_DATABASE_PORT
                        Port which you used for running cloud sql proxy,
                        defaults to 3306
  --tracking-database-user TRACKING_DATABASE_USER
                        Cloud SQL Tracking database user name, defaults to
                        root
```
7. Run [hive_to_bigquery.py](hive_to_bigquery.py).
 ```
 python hive_to_bigquery.py \
 --hive-server-host <OPTIONAL_HIVE_SERVER_HOSTNAME> \
 --hive-server-port <OPTIONAL_HIVE_SERVER_PORT> \
 --hive-server-username <OPTIONAL_HIVE_SERVER_USER> \
 --hive-database <HIVE_DB_NAME> \
 --hive-table <HIVE_TABLE_NAME> \
 --project-id <GCP_PROJECT_ID> \
 --bq-dataset-id <BQ_DATASET_ID> \
 --bq-table <OPTIONAL_BQ_TABLE_NAME> \
 --bq-table-write-mode [create|append|overwrite] \
 --gcs-bucket-name <GCS_BUCKET_NAME> \
 --incremental-col <OPTIONAL_INCREMENTAL_COLUMN_NAME> \
 --use-clustering [False|True] \
 --tracking-database-host <TRACKING_DATABASE_HOST> \
 --tracking-database-port <OPTIONAL_TRACKING_DATABASE_PORT> \
 --tracking-database-user <OPTIONAL_TRACKING_DATABASE_USER> \
 --tracking-database-db-name <TRACKING_DB_NAME>
```

# Test Run
It is recommended to perform a test run before actually migrating your Hive table. To do so, you can use the [generate_data.py](test/generate_data.py) to randomly generate data (with specified size) and use [create_hive_tables.sql](test/create_hive_tables.sql) to create Hive tables in the default database on the source Hive cluster, both non partitioned and partitioned in different formats.

Run the command below to generate ~50GB of data.
```
python test/generate_data.py 50
```
Launch script to create Hive tables.
```
hive -f tools/create_hive_tables.sql
```
Migrate the created Hive tables by running [hive_to_bigquery.py](hive_to_bigquery.py) with appropriate arguments.