# Migrate Hive tables to BigQuery

This framework migrates data from Hive to BigQuery using Cloud SQL to keep track of the migration progress. This is designed in such a way that it can handle migrating data both in an incremental fashion or bulk load at once. Bulk loading is when data under the Hive table is stable and all the data can be migrated at once. Incremental load is when data is continuously appending to the existing Hive table and there is a need to migrate the incremental data only from the subsequent runs of migration.
By default, this framework is expected to run on a source Hive cluster.

# Architectural Diagram
Cloud SQL keeps track of the
1. data in the source Hive table.
2. files which are copied from the Hive cluster to Cloud Storage.
3. files which are loaded from Cloud Storage into BigQuery.

![Alt text](architectural_diagram.png?raw=true)

# Before you begin
1. Install gcloud SDK on the source Hive cluster by following these [instructions](https://cloud.google.com/sdk/install).
2. [Create a service account](https://cloud.google.com/iam/docs/creating-managing-service-accounts#creating_a_service_account) and grant the following roles to the service account by following these [instructions](https://cloud.google.com/iam/docs/granting-roles-to-service-accounts#granting_access_to_a_service_account_for_a_resource).
	1. Google Cloud Storage - storage.admin
	2. BigQuery - bigquery.dataEditor and bigquery.jobUser
	3. Cloud SQL - cloudsql.admin
	4. Cloud KMS - cloudkms.cryptoKeyEncrypterDecrypter
3. [Download](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#creating_service_account_keys) the service account key file and set up the environment variable by following these [instructions](https://cloud.google.com/docs/authentication/getting-started#setting_the_environment_variable).

	```
	export GOOGLE_APPLICATION_CREDENTIALS="[PATH_TO_KEY_FILE]"
	```
Note: Saving credentials in environment variables is convenient, but not secure - consider a more secure solution such as [Cloud KMS](https://cloud.google.com/kms/) to help keep secrets safe.

# Store Hive password using Cloud KMS
1. Create a Cloud KMS key ring and a key. Refer the
[documentation](https://cloud.google.com/kms/docs/creating-keys#top_of_page) for more instructions.
```
# Create a key ring
gcloud kms keyrings create [KEYRING_NAME] --location [LOCATION]
# Create a key
gcloud kms keys create [KEY_NAME] --location [LOCATION] \
  --keyring [KEYRING_NAME] --purpose encryption
```

2. On your local machine, create the file, for example, `password.txt`, that
contains the password.
3. Encrypt the file `password.txt` using the key and key ring that has been created.
```
gcloud kms encrypt \
  --location=[LOCATION]  \
  --keyring=[KEY_RING] \
  --key=[KEY] \
  --plaintext-file=password.txt \
  --ciphertext-file=password.txt.enc
```
4. Upload the encrypted file, `password.txt.enc`, to the GCS bucket. Note this
file location, which will be provided later as an input to the migration tool.
```
gsutil cp password.txt.enc gs://<BUCKET_NAME>/<OBJECT_PATH>
```
5. Delete the plaintext `password.txt` file from the local machine.
# Usage

1. Clone the repo.
```
git clone https://github.com/GoogleCloudPlatform/professional-services.git
cd professional-services/tools/hive-bigquery/
```
2. Install prerequisites such as python3, pip3, virtualenv and Cloud SQL proxy.
```
sudo bash prerequisites/prerequisites.sh
```
3. Activate the virtual environment.
```
virtualenv env
source env/bin/activate
pip3 install .
```
4.
The command below creates a Cloud SQL MySQL database instance and a database for
storing the tracking information. If you want to use an existing instance, create the
required database separately.

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
mysql -h 127.0.0.1 -u root -P <PORT> -p
```
7. Create the tracking_table_info metatable in your MySQL database by importing
the [prerequisites/tracking_table.sql](prerequisites/tracking_table.sql) file.
This table will contain information about the migrated Hive tables and their properties.
```
mysql -h 127.0.0.1 -u root -P <PORT> <DATABASE_NAME> -p < prerequisites/tracking_table.sql
```

8. Usage
```
usage: python3 -m hive_to_bigquery [-h] --config-file CONFIG_FILE

Framework to migrate Hive tables to BigQuery which uses Cloud SQL to keep
track of the migration progress.

optional arguments:
  -h, --help            show this help message and exit

required arguments:
  --config-file CONFIG_FILE
                        Input configurations JSON file.
```
9. Run [hive_to_bigquery](hive_to_bigquery/__main__.py).
 ```
 python3 -m hive_to_bigquery \
 --config-file <CONFIG_FILE>
```

# Test Run
It is recommended to perform a test run before actually migrating your Hive
table. To do so, you can use the [generate_data.py](test/generate_data.py) to
randomly generate data (with specified size) and use
[create_hive_tables.sql](test/create_hive_tables.sql) to create Hive tables in
the default database on the source Hive cluster, both non partitioned and
partitioned in different formats.

On the Hive cluster, run the command below to generate ~1GB of data.
```
python3 tests/generate_data.py --size-in-gb 1
```
Run the command below to create Hive tables on the Hive cluster.
```
hive -f tests/create_hive_tables.sql
```
The config file `test_config.json` can be used to migrate the Hive table
`text_nonpartitioned` which has an incremental column `int_column`. Replace the
other parameters with appropriate values. Run the command below to migrate
this table.
```
python3 -m hive_to_bigquery --config-file test_config.json
```
