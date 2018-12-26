# Migrate Hive tables to BigQuery

Framework to migrate Hive tables to BigQuery which uses Cloud SQL to keep track of the migration progress.

# Before you begin
1. Install gcloud SDK on the source cluster by following these [instructions](https://cloud.google.com/sdk/install).
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

1. Clone the repo
```
git clone https://github.com/pkattamuri/professional-services.git
cd professional-services/
git checkout feature/hive-bigquery
cd tools/hive-bigquery/
```
2. Install prerequisites such as python, pip, virtualenv and Cloud SQL proxy
```
sh prerequisites.sh
```
3. Activate the virtual environment
```
virtualenv env
source env/bin/activate
pip install -r requirements.txt
```
4. [optional] Use an existing Cloud SQL instance for tracking the progress of migration or launch a new one. Run the below command to create an instance. This will output the connection name of the instance which is of use in the next steps.
```
sh create_sql_instance.sh <INSTANCE_NAME> <DATABASE_NAME>
```
5. Start the Cloud SQL proxy and establish a connection to the Cloud SQL instance
```
./cloud_sql_proxy -instances=<INSTANCE_CONNECTION_NAME>=tcp:<PORT>
```
6. Run hive_to_bigquery.py
 ```
 # Refer init_script.py for arguments descriptions
 python hive_to_bigquery.py \
 --hive-server-host <HIVE_SERVER_HOSTNAME> \
 --hive-server-port <HIVE_SERVER_PORT> \
 --hive-server-username <HIVE_SERVER_USER> \
 --hive-database <HIVE_DB_NAME> \
 --hive-table <HIVE_TABLE_NAME> \
 --project-id <GCP_PROJECT_ID> \
 --bq-dataset-id <BQ_DATASET_ID> \
 --bq-table <BQ_TABLE_NAME> \
 --bq-table-write-mode [create|append|overwrite] \
 --gcs-bucket-name <GCS_BUCKET_NAME> \
 --incremental-col <INCREMENTAL_COLUMN_NAME> \
 --use-clustering [False|True] \
 --tracking-database-host <TRACKING_DATABASE_HOST> \
 --tracking-database-port <TRACKING_DATABASE_PORT> \
 --tracking-database-user <TRACKING_DATABASE_USER> \
 --tracking-database-db-name <TRACKING_DB_NAME>
```
