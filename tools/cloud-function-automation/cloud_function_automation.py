#!/usr/bin/env python3

# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Usage: python3 cloud_function_automation.py

This script will be used to workflow/pipeline where user can
route filtered logs to pubsub and trigger cloud function
based on pub/sub events.

resource => log sink => pub/sub => cloud function

Please update all config variables in variables.py file.
"""

import time
import json
from getpass import getpass
from google.api_core.exceptions import AlreadyExists
import requests
from google.cloud import pubsub_v1, logging, functions_v1
from variables import PROJECT_ID, PUBSUB_TOPIC_NAME, SINK_NAME, \
    LOG_SINK_FILTER, CLOUD_FUNCTION_CONFIG, PROJECT_NUMBER, ACTION


def enable_required_service_apis(project_num, token):
    """
    This function will be used to enable all services required in this script.
    :param project_num: Google Cloud project number mentioned in variables.py.
    :param token: Google Cloud auth token.
    :return: True or False.
    """
    url = f"https://serviceusage.googleapis.com/v1/projects/{project_num}/services:batchEnable"

    payload = json.dumps({
        "serviceIds": [
            "pubsub.googleapis.com",
            "cloudfunctions.googleapis.com",
            "logging.googleapis.com"
        ]
    })
    headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }
    try:
        response = requests.request("POST", url, headers=headers, data=payload)
    except requests.exceptions.Timeout as exc:
        raise SystemExit(f"Timeout Error while calling enable service API - {exc}")
    except requests.exceptions.TooManyRedirects as exc:
        raise SystemExit(f"TooManyRedirects Error while calling enable service API - {exc}")
    except requests.exceptions.RequestException as exc:
        raise SystemExit(f"RequestException while calling enable service API - {exc}")

    if response.status_code == 200:
        services_enabled = True
    else:
        services_enabled = False

    return services_enabled


def create_pubsub_topic(project_id, pubsub_topic_name):
    """
    This function will be used to create pubsub topic if not already present.
    :param project_id: Google Cloud project id mentioned in variables.py.
    :param pubsub_topic_name: Google Cloud Pub/Sub topic name mentioned in variables.py.
    :return: True or False.
    """
    publisher = pubsub_v1.PublisherClient()
    full_topic_name = f'projects/{project_id}/topics/{pubsub_topic_name}'
    try:
        publisher.create_topic(name=full_topic_name)
        print(f"PubSub Topic {full_topic_name} has been created")
        created_pubsub_topic = True
    except AlreadyExists:
        print(f"{full_topic_name} already exists.")
        created_pubsub_topic = False
    return created_pubsub_topic


def create_sink(sink_name, full_topic_name, log_sink_filter):
    """
    This function will be used to create Log Sink from Log Router.
    :param sink_name: Log Sink name mentioned in variables.py.
    :param full_topic_name: Pub/Sub topic associated with log sink.
    :param log_sink_filter: log sink filer mentioned in variables.py.
    :return: True or False.
    """
    logging_client = logging.Client()
    destination = f"pubsub.googleapis.com/{full_topic_name}"
    sink = logging_client.sink(sink_name, filter_=log_sink_filter, destination=destination)
    if sink.exists():
        print(f"Log Router Sink {sink.name} already exists.")
        created_sink = False
    else:
        sink.create()
        print(f"Log Router Sink {sink.name} has been created")
        created_sink = True
    return created_sink


def create_cloud_function(function_config, project_id, full_topic_name):
    """
    This function will be used to create and deploy cloud function.
    :param function_config: dictionary containing cloud function configurations
    mentioned in variables.py.
    :param project_id: Google Cloud project id mentioned in variables.py.
    :param full_topic_name: Pub/Sub topic associated with Cloud function.
    :return:
    """
    function_zip_file_path = function_config["CLOUD_FUNCTION_ZIP_FILE_PATH"]
    function_location = function_config["CLOUD_FUNCTION_LOCATION"]
    function_name = function_config["CLOUD_FUNCTION_NAME"]
    function_runtime = function_config["CLOUD_FUNCTION_RUNTIME"]
    full_location = f"projects/{project_id}/locations/{function_location}"

    # Create a client
    client = functions_v1.CloudFunctionsServiceClient()

    # Initialize request argument(s)
    function = functions_v1.CloudFunction()
    function.source_archive_url = function_zip_file_path
    function.name = f"projects/{project_id}/locations/{function_location}/functions/{function_name}"
    function.event_trigger = {"event_type": "google.pubsub.topic.publish",
                              "resource": full_topic_name, "service": "pubsub.googleapis.com"}
    function.runtime = function_runtime

    request = functions_v1.CreateFunctionRequest(
        location=full_location,
        function=function
    )

    # Make the request
    operation = client.create_function(request=request)

    print("Waiting for operation to complete...")

    response = operation.result()

    # Handle the response
    print(response)
    print(f"Cloud function {function_name} has been created")


def delete_cloud_pubsub_topic(project_id, topic_id):
    """
    This function will be used to delete Cloud Pub/Sub Topic if exist as per variables.py.
    :param project_id: Google Cloud project id mentioned in variables.py.
    :param topic_id: Pub/Sub topic associated with Cloud function.
    :return:
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)
    publisher.delete_topic(request={"topic": topic_path})
    print(f"Topic deleted: {topic_path}")


def delete_cloud_log_sink(sink_name):
    """
    This function will be used to delete GCP Log Sink.
    :param sink_name: Log Sink name.
    :return:
    """
    logging_client = logging.Client()
    sink = logging_client.sink(sink_name)
    sink.delete()
    print("Deleted sink {}".format(sink.name))


def delete_cloud_function(project_id, function_config):
    """
    This function will be used to delete GCP Cloud Function.
    :param project_id: Google Cloud project id mentioned in variables.py.
    :param function_config: ictionary containing cloud function configurations
    mentioned in variables.py.
    :return:
    """
    function_location = function_config["CLOUD_FUNCTION_LOCATION"]
    function_name = function_config["CLOUD_FUNCTION_NAME"]
    full_function_name = f"projects/{project_id}/locations/{function_location}/functions/{function_name}"
    client = functions_v1.CloudFunctionsServiceClient()

    request = functions_v1.DeleteFunctionRequest(
        name=full_function_name
    )

    # Make the request
    operation = client.delete_function(request=request)
    print(f"Cloud function {function_name} deleted")

    response = operation.result()
    print(response)


def main():
    """
    This is the main function.
    :return:
    """
    auth_token = getpass('Enter auth_token, you can generate auth token by '
                         'running gcloud config set project <project_id> && '
                         'gcloud auth print-access-token: ')

    auth_token = "Bearer " + auth_token

    if ACTION == "CREATE":
        services_enabled_status = enable_required_service_apis(PROJECT_NUMBER, auth_token)
        if services_enabled_status:
            time.sleep(10)
            full_topic_name = f'projects/{PROJECT_ID}/topics/{PUBSUB_TOPIC_NAME}'
            created_pubsub_topic = create_pubsub_topic(PROJECT_ID, PUBSUB_TOPIC_NAME)
            if created_pubsub_topic:
                time.sleep(10)
                created_sink = create_sink(SINK_NAME, full_topic_name, LOG_SINK_FILTER)
                if created_sink:
                    time.sleep(10)
                    create_cloud_function(CLOUD_FUNCTION_CONFIG, PROJECT_ID, full_topic_name)
    elif ACTION == "DELETE":
        to_be_deleted = input("Do you really want to delete, enter yes or no: ")
        if to_be_deleted == "yes":
            delete_cloud_pubsub_topic(PROJECT_ID, PUBSUB_TOPIC_NAME)
            delete_cloud_log_sink(SINK_NAME)
            delete_cloud_function(PROJECT_ID, CLOUD_FUNCTION_CONFIG)
        elif to_be_deleted == "no":
            print("Exiting, since user entered no")
        else:
            print("please enter either yes or no")


if __name__ == '__main__':
    main()
