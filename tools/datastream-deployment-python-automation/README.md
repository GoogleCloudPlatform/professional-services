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

1. Update variables.py with configuration parameters, configuration parameters are explained below
```text

 PROJECT_ID = Specify GCP project id
 LOCATION = Specify GCP location, example us-central1
 source_database_type = Add type of source database, should be 
                        either mysql or oracle
 source_profile_connection_type = Enter source profile connection type
                                    should be either staticServiceIpConnectivity
                                    or privateConnectivity
 source_profile_name = Enter source connection profile name
 source_profile_id = Enter source connection profile id
 source_db_hostname = Enter source database hostname/public-ip
 source_db_port = Enter source database port name as integer, example 3306
 source_db_username = Enter DB username who has REPLICATION SLAVE, SELECT,
                        RELOAD, REPLICATION CLIENT, LOCK TABLES, EXECUTE
                        access
 private_conn_display_name = Enter private connection display name
 private_conn_id = Enter private connection id
 vpc_path = Enter path of VPC where source DB is
 subnet_range = Provide a subnet range for peering
 private_source_profile_name = Enter source connection profile name
 private_source_profile_id = Enter source connection profile id
 private_source_db_hostname = Enter source database hostname/public-ip
 private_source_db_port = Enter source database port name as integer, example 1521
 private_source_db_username = Enter DB username
 private_source_db_service = Enter Oracle DB SID
 destination_profile_name = Enter destination connection profile name
 destination_profile_id = Enter destination connection profile id
 storage_bucket_name = Enter storage bucket name where stream data will be
                        stored
 storage_bucket_prefix = Enter storage bucket prefix
 stream_id = Enter Stream ID
 stream_name = Enter Stream name
```

## How to run

### Example
```commandline
python3 create_connection_profiles_and_datastream.py
```


# Author

Arun Singh