#!/usr/bin/env python3

#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

"""
This tool checks each GCP project in your GCP Organization
for the existence of API keys. Each key is compared
to a custom rotation period (defaults to 90).

The output consists of two groupings of API keys:

- One group are keys with rotation periods older than
the approved rotation period.
- The second group are keys with rotation periods under
the approved rotation period.
"""


import subprocess
import requests # pylint: disable=import-error
import googleapiclient.discovery # pylint: disable=import-error
from datetime import datetime, timedelta
from dateutil import parser as date_parser # pylint: disable=import-error
from google.api_core import exceptions # pylint: disable=import-error
from googleapiclient.discovery_cache.base import Cache # pylint: disable=import-error
import logging
import sys
import argparse
from dataclasses import dataclass
from dataclasses_json import dataclass_json # pylint: disable=import-error


def x_days_ago(rotation_period):
    """
    Get the date x days ago to use for our comparison.

    Args:

    rotation_period - The rotation period in days (default is 90)
    """

    rotation_days = rotation_period
    today = datetime.now()

    # Find the date x days ago
    rotation_date = today - timedelta(days=rotation_days)
    logging.info("%s days ago was %s \n", rotation_days, rotation_date)

    return rotation_date


def create_project_list(service):
    """
    Get our project list from GCP.

    Args:

    service - A resource manager service created via create_service() function
    """

    logging.info(
        "Getting GCP project list. This may take a minute.. \n")

    # Collect all the projects
    projects = []

    # Paginate through the list of all available projects
    request = service.projects().list()
    while request is not None:
        response = request.execute(num_retries=3)
        projects.extend(response.get("projects", []))
        request = service.projects().list_next(request, response)

    return projects


def key_analysis(projects, rotation_period):
    """
    Performs our rotation analysis on the available API keys.

    Args:

    projects - A list of GCP projects and their metadata
    rotation_period - The rotation period in days (default is 90)
    """

    logging.info(
        "Grabbing keys and performing analysis for a rotation periods of %s days.. \n", rotation_period) # pylint: disable = line-too-long

    # Get the date x (default 90) days ago
    rotation_date = x_days_ago(rotation_period)

    # Generates an access token
    # for our API requests
    access_token = create_token()

    # This variable is used to hold our keys depending on their creation date
    keys_needing_rotation=[]
    keys_not_needing_rotation=[]

    # For each project, extract the project ID
    for project in projects:
        project_id = project["projectId"]
        try:
            # Use the project ID and access token to find
            # the API keys for each project
            apikeys = requests.get(
                f"https://apikeys.googleapis.com/v1/projects/{project_id}/apiKeys/", # pylint: disable = line-too-long
                params={"access_token": access_token}
                ).json()
        except exceptions.PermissionDenied:
            continue
        # If API keys exist, proceed
        if "keys" in apikeys:
            # Access our nested keys
            # so we can iterate through the list
            apikeys = apikeys["keys"]
            # For each key in our dictionaries
            # (API keys are dictionaries)
            for apikey in apikeys:
                # Google removed the "createdBy" field
                # so only legacy keys have it
                if "createdBy" in apikey:
                    # Create our API key object
                    # if it has "createdBy"
                    key_object = ApiKey(
                        apikey["keyId"],
                        apikey["displayName"],
                        apikey["createdBy"],
                        apikey["createTime"],
                        project_id)
                else:
                    # Create our API key object
                    # if it does NOT have "createdBy"
                    key_object = ApiKey(
                        apikey["keyId"],
                        apikey["displayName"],
                        "None",
                        apikey["createTime"],
                        project_id)

                # We need to convert
                # our creation time for comparison
                converted_creation_date = time_convert(key_object)

                # Extract API Key ID for logging
                key_id = key_object.key_id

                # If our key is older than x days (default 90)
                # based on our compare_dates function
                # add api key to appropriate variable container
                logging.info("Checking API key: %s creation date.. \n", key_id)
                # Convert to JSON for logging
                key_object_json = key_object.to_json()
                if compare_dates(converted_creation_date, rotation_date):
                    keys_needing_rotation.append(key_object_json)
                else:
                    keys_not_needing_rotation.append(key_object_json)

    # Format our API keys
    keys_needing_rotation = "\n".join(keys_needing_rotation)
    keys_not_needing_rotation = "\n".join(keys_not_needing_rotation)

    # Once analysis is complete for all keys,
    # log results
    if keys_needing_rotation:
        logging.warning(
            "Found API keys older than %s days. Please rotate: \n%s \n", rotation_period, keys_needing_rotation) # pylint: disable = line-too-long

    if keys_not_needing_rotation:
        logging.info(
            "The following API key(s) are not older than %s days: \n%s", rotation_period, keys_not_needing_rotation) # pylint: disable = line-too-long


def create_token():
    """
    As of March 2021, Google has released a SDK for API keys
    but the SDK is in a private alpha and not accessible for
    public usage. You can view the SDK here:
    https://cloud.google.com/sdk/gcloud/reference/alpha/services/api-keys

    Therefore, we must use the requests library and make API calls
    with a bearer token until the SDK is usable by the public.
    """
    access_token = subprocess.run(
        "gcloud auth print-access-token",
        shell=True,
        check=True,
        stdout=subprocess.PIPE,
        universal_newlines=True)
    token = access_token.stdout

    return token


def compare_dates(converted_creation_date, rotation_date):
    """
    Compares createTime date to x (default 90) days ago.

    Args:

    converted_creation_date - The datatime formatted creation date of our API key.
    rotation_date - datetime formatted "rotation_period" days ago (default 90).
                    Example: 2020-09-18 13:38:52.943663
    """

    # If the createTime value for our key
    # is over x days (default 90)
    # Return true to key_analysis function
    if converted_creation_date < rotation_date:
        return True
    else:
        return False


def create_service():
    """
    Creates the GCP Cloud Resource Service.
    """
    return googleapiclient.discovery.build(
        "cloudresourcemanager",
        "v1",
        cache=MemoryCache())


def time_convert(key_object):
    """
    Grab the date by getting all values before the "T"
    Example value: 2021-03-15T15:24:39.553722
    We would get "2021-03-15"

    Args:

    key_object - The API key class object
    """
    # Extract our creation time from our API key
    create_time = key_object.create_time

    # Grab our date
    date_create = create_time.split("T")[0]

    # Convert time to datatime format for comparison
    converted_create_time = date_parser.parse(date_create)

    return converted_create_time


@dataclass_json
@dataclass
class ApiKey:
    """
    GCP API key class used throughout this script.

    Args:

    key_id - The API key ID
    display_name - The API key display name
    created_by - The user who created the API key (deprecated)
    create_time - The creation date/time of the API key
    project_id - The GCP project where the APi key lives
    """
    key_id: str
    display_name: str
    created_by: str
    create_time: str
    project_id: str


class MemoryCache(Cache):
    """
    File-based cache to resolve GCP noisey log entries.
    """
    _CACHE = {}

    def get(self, url):
        return MemoryCache._CACHE.get(url)

    def set(self, url, content):
        MemoryCache._CACHE[url] = content


def main(args):
    """
    Central logic, kicks off other functions.

    Args:

    args - The arguments (or defaults) passed in on the CLI
    """

    # Create our rotation_period variable that
    # is equal to the argument "rotation_period"
    rotation_period = args.rotation_period

    # Create our resource manager service
    service = create_service()

    # Get all available GCP projects
    # based on user's permissions
    project_list = create_project_list(service)

    # Perform our key analysis
    key_analysis(project_list, rotation_period)


if __name__ == "__main__":
    # Configure our logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO)

    # Creates our argument parser
    parser = argparse.ArgumentParser(
        description="Find API keys in your GCP \
        org and check for keys older \
        than \"rotation_period\".")

    # Add the rotation period in days to the command line
    parser.add_argument(
        "rotation_period",
        type=int,
        nargs="?",
        default="90",
        help="The rotation period (in days) \
        to check your API keys against. \
        Default is 90 days.")

    # Parse our arguments
    args = parser.parse_args()

    main(args)
