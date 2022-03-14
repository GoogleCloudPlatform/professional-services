# Python Script  - Deploy a Google Cloud DataStream 
## Prerequisites
1. Enable the Datastream API.
2. Make sure that you have the Datastream Admin role assigned to your user account.
3. Allowlist these IPs to your MySQL DB as per your selected region, refer https://cloud.google.com/datastream/docs/ip-allowlists-and-regions
4. Create a user in MySQL DB with SLAVE, SELECT, RELOAD, REPLICATION CLIENT, LOCK TABLES, EXECUTE permissions
```text
CREATE USER 'datastream'@'%' IDENTIFIED BY 'anypassword';
GRANT REPLICATION SLAVE, SELECT, RELOAD, REPLICATION CLIENT, LOCK TABLES, EXECUTE ON *.* TO 'datastream'@'%';
FLUSH PRIVILEGES;
```
5. Create a bucket in Google Cloud Storage where you want to store streamed data.
6. Install required python modules
```commandline
pip3 install -r requirements.txt
```
## Usage and Options

```text
Usage: create_connection_profiles_and_datastream.py [options]

This script will be used to create datastream from Cloud SQL(MySQL) to Cloud
Storage

Options:
  -h, --help            show this help message and exit
  --project_id=PROJECT_ID
                        Specify GCP project id
  --location=LOCATION   Specify GCP location, example us-central1
  --source_profile_name=SOURCE_PROFILE_NAME
                        Enter source connection profile name
  --source_profile_id=SOURCE_PROFILE_ID
                        Enter source connection profile id
  --source_db_hostname=SOURCE_DB_HOSTNAME
                        Enter source database hostname/public-ip
  --source_db_port=SOURCE_DB_PORT
                        Enter source database port name as integer, example
                        3306
  --source_db_username=SOURCE_DB_USERNAME
                        Enter DB username who has REPLICATION SLAVE, SELECT,
                        RELOAD, REPLICATION CLIENT, LOCK TABLES, EXECUTE
                        access
  --destination_profile_name=DESTINATION_PROFILE_NAME
                        Enter destination connection profile name
  --destination_profile_id=DESTINATION_PROFILE_ID
                        Enter destination connection profile id
  --storage_bucket_name=STORAGE_BUCKET_NAME
                        Enter storage bucket name where stream data will be
                        stored
  --storage_bucket_prefix=STORAGE_BUCKET_PREFIX
                        Enter storage bucket prefix
  --stream_id=STREAM_ID
                        Enter Stream ID
  --stream_name=STREAM_NAME
                        Enter Stream name
```

## How to run

### Example
```commandline
python3 create_connection_profiles_and_datastream.py --project_id "testproj" --location "us-central1" --source_profile_name "test-source-name" --source_profile_id "test-source-id" --source_db_hostname "test-db" --source_db_hostname "1.2.3.4" --source_db_port 3306 --source_db_username "datastream" --destination_profile_name "test-destination-name" --destination_profile_id "test-destination-id" --storage_bucket_name "data-stream-bucket" --storage_bucket_prefix "/" --stream_id "test-stream-id" --stream_name "test-stream-name"
```


# Author

Arun Singh