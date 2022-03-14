#!/usr/bin/python3

"""
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
"""
from getpass import getpass
import json
import optparse
import sys
import time
import requests


def create_source_connection_profile(profile_name, profile_id, db_hostname,
                                     db_port, db_username, db_password,
                                     token, project, location):
    url = f"https://datastream.googleapis.com/v1/projects/{project}/" \
          f"locations/{location}/connectionProfiles" \
          f"?connectionProfileId={profile_id}"

    payload = json.dumps({
        "displayName": profile_name,
        "mysqlProfile": {
            "hostname": db_hostname,
            "port": db_port,
            "username": db_username,
            "password": db_password
        },
        "staticServiceIpConnectivity": {}
    })
    headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)
    if response.status_code == 200:
        print(f"Source connection profile {profile_name} created successfully")
        return True
    elif response.status_code == 409:
        print(f"Source connection profile {profile_name} already exist")
        return True
    else:
        print(f"Issue while creating source connection profile: {response.text}")
        return False


def create_destination_connection_profile(project, location, d_profile_name,
                                          d_profile_id, bucket_name,
                                          bucket_prefix, token):
    url = f"https://datastream.clients6.google.com/v1alpha1/" \
          f"projects/{project}/locations/{location}" \
          f"/connectionProfiles?connectionProfileId={d_profile_id}"

    payload = json.dumps({
        "displayName": d_profile_name,
        "gcsProfile": {
            "bucketName": bucket_name,
            "rootPath": bucket_prefix
        }
    })
    headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    if response.status_code == 200:
        print(f"Destination connection profile {d_profile_id} created successfully")
        return True
    elif response.status_code == 409:
        print(f"Destination connection profile {d_profile_id} already exist")
        return True
    else:
        print(f"Issue while creating destination connection profile: {response.text}")
        return False


def create_stream(project, location, stream_id, name, source_connection_id,
                  destination_connection_id, token):
    url = f"https://datastream.clients6.google.com/v1alpha1/projects/{project}/" \
          f"locations/{location}/streams?streamId={stream_id}"
    source_connection_path = f"projects/{project}/locations/{location}/" \
                             f"connectionProfiles/{source_connection_id}"
    destination_connection_path = f"projects/{project}/locations/{location}/" \
                                  f"connectionProfiles/{destination_connection_id}"

    payload = json.dumps({
        "displayName": name,
        "sourceConfig": {
            "sourceConnectionProfileName": source_connection_path,
            "mysqlSourceConfig": {
                "allowlist": {
                    "mysqlDatabases": []
                },
                "rejectlist": {
                    "mysqlDatabases": []
                }
            }
        },
        "destinationConfig": {
            "destinationConnectionProfileName": destination_connection_path,
            "gcsDestinationConfig": {
                "path": "",
                "avroFileFormat": {}
            }
        },
        "backfillAll": {
            "mysqlExcludedObjects": {}
        }
    })
    headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    if response.status_code == 200:
        print(f"Stream {name} created successfully")
        return True
    elif response.status_code == 409:
        print(f"Stream {name} already exist")
        return True
    else:
        print(f"Issue while creating stream: {response.text}")
        return False


def start_stream(project, location, stream_id, token, name):
    url = f"https://datastream.googleapis.com/v1/" \
          f"projects/{project}/locations/{location}/streams/{stream_id}?" \
          "updateMask=state"

    payload = json.dumps({
        "state": "RUNNING"
    })
    headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }

    response = requests.request("PATCH", url, headers=headers, data=payload)

    if response.status_code == 200:
        print(f"Stream {name} started successfully")
        return True
    else:
        print(f"Issue while starting stream: {response.text}")
        return False


def main(args):
    parser = optparse.OptionParser(description="This script will be used to create datastream "
                                               "from Cloud SQL(MySQL) to Cloud Storage")
    parser.add_option('--project_id', help="Specify GCP project id")
    parser.add_option('--location', help="Specify GCP location, example us-central1")
    parser.add_option('--source_profile_name', help="Enter source connection profile name")
    parser.add_option('--source_profile_id', help="Enter source connection profile id")
    parser.add_option('--source_db_hostname', help="Enter source database hostname/public-ip")
    parser.add_option('--source_db_port', help="Enter source database port name as "
                                               "integer, example 3306")
    parser.add_option('--source_db_username', help="Enter DB username who has "
                                                   "REPLICATION SLAVE, SELECT, "
                                                   "RELOAD, REPLICATION CLIENT, "
                                                   "LOCK TABLES, EXECUTE access")
    parser.add_option('--destination_profile_name', help="Enter destination "
                                                         "connection profile name")
    parser.add_option('--destination_profile_id', help="Enter destination connection "
                                                       "profile id")
    parser.add_option('--storage_bucket_name', help="Enter storage bucket name where "
                                                    "stream data will be stored")
    parser.add_option('--storage_bucket_prefix', help="Enter storage bucket prefix")
    parser.add_option('--stream_id', help="Enter Stream ID")
    parser.add_option('--stream_name', help="Enter Stream name")

    options, remaining_args = parser.parse_args(args)

    if options.project_id:
        project_id = options.project_id
    else:
        raise Exception('Invalid or missing --project_id option')

    if options.location:
        location = options.location
    else:
        raise Exception('Invalid or missing --location option')

    if options.source_profile_name:
        source_profile_name = options.source_profile_name
    else:
        raise Exception('Invalid or missing --source_profile_name option')

    if options.source_profile_id:
        source_profile_id = options.source_profile_id
    else:
        raise Exception('Invalid or missing --source_profile_id option')

    if options.source_db_hostname:
        source_db_hostname = options.source_db_hostname
    else:
        raise Exception('Invalid or missing --source_db_hostname option')

    if options.source_db_port:
        source_db_port = options.source_db_port
    else:
        raise Exception('Invalid or missing --source_db_port option')

    if options.source_db_username:
        source_db_username = options.source_db_username
    else:
        raise Exception('Invalid or missing --source_db_username option')

    if options.destination_profile_name:
        destination_profile_name = options.destination_profile_name
    else:
        raise Exception('Invalid or missing --destination_profile_name option')

    if options.destination_profile_id:
        destination_profile_id = options.destination_profile_id
    else:
        raise Exception('Invalid or missing --destination_profile_id option')

    if options.storage_bucket_name:
        storage_bucket_name = options.storage_bucket_name
    else:
        raise Exception('Invalid or missing --storage_bucket_name option')

    if options.storage_bucket_prefix:
        storage_bucket_prefix = options.storage_bucket_prefix
    else:
        raise Exception('Invalid or missing --storage_bucket_prefix option')

    if options.stream_id:
        stream_id = options.stream_id
    else:
        raise Exception('Invalid or missing --stream_id option')

    if options.stream_name:
        stream_name = options.stream_name
    else:
        raise Exception('Invalid or missing --stream_name option')

    auth_token = getpass('Enter auth_token, you can generate auth token by '
                         'running gcloud config set project <project_id> && '
                         'gcloud auth print-access-token: ')

    source_db_password = getpass('Enter Source DB Password: ')

    auth_token = "Bearer " + auth_token

    source_connection_profile_status = create_source_connection_profile(source_profile_name,
                                                                        source_profile_id,
                                                                        source_db_hostname,
                                                                        int(source_db_port),
                                                                        source_db_username,
                                                                        source_db_password,
                                                                        auth_token,
                                                                        project_id, location)
    if source_connection_profile_status:
        destination_connection_profile_status = create_destination_connection_profile\
            (project_id, location, destination_profile_name, destination_profile_id,
             storage_bucket_name, storage_bucket_prefix, auth_token)
        if destination_connection_profile_status:
            create_stream_status = create_stream(project_id, location,
                                                 stream_id, stream_name,
                                                 source_profile_id,
                                                 destination_profile_id,
                                                 auth_token)
            if create_stream_status:
                time.sleep(60)
                start_stream_status = start_stream(project_id, location,
                                                   stream_id, auth_token,
                                                   stream_name)
                if start_stream_status:
                    print("Process Completed!")
                else:
                    sys.exit(1)
        else:
            sys.exit(1)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main(sys.argv[1:])
