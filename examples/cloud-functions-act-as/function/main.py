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
Entry point to the Sample function
"""
import logging
import os
import sys

from googleapiclient import discovery
import google.oauth2.credentials
import functions_framework

from google.cloud import secretmanager

_logger = logging.getLogger(__name__)
_logger.setLevel(logging.DEBUG)


def list_instances(project_id: str, zone: str, access_token: str = None):
    """
    List all instances in the given zone in the specified project.

    Args:
        project_id: project ID or project number of the Cloud project you want to use.
        zone: name of the zone you want to use. For example: “us-west3-b”
        access_token: (Optional) access token to use to authenticate to the Compute Engine API
    Returns:
        An iterable collection of Instance objects.
    """

    print(
        f"Calling Google Compute Engine API in project: { project_id }, zone: { zone }"
    )

    if access_token:
        creds = google.oauth2.credentials.Credentials(access_token)
        service = discovery.build('compute', 'v1', credentials=creds)
        print("With OAuth2 Credentials")
    else:
        service = discovery.build('compute', 'v1')
        print("Default Application Credentials")

    request = service.instances().list(project=project_id, zone=zone)
    instances = []
    while request is not None:
        response = request.execute()

        for instance in response['items']:
            print(instance['name'])
            instances.append(instance['name'])

        request = service.instances().list_next(previous_request=request,
                                                previous_response=response)
    return ", ".join(instances)

@functions_framework.http
def main(request):
    """
    Cloud Function entry point
    """
    request_json = request.get_json()
    gcp_project = os.environ.get('GCP_PROJECT', '')
    gcp_zone = os.environ.get('GCP_ZONE', '')

    try:
        access_token = None

        if request_json and 'access_token' in request_json:
            access_token = request_json['access_token']

        if request_json and 'secret_resource' in request_json:

            secret_resource = request_json['secret_resource']
            print(f"Retrieving access token from secret { secret_resource }")

            sm_client = secretmanager.SecretManagerServiceClient()
            response = sm_client.access_secret_version(name=secret_resource)
            access_token = response.payload.data.decode("UTF-8")

            res = list_instances(gcp_project, gcp_zone, access_token)

            sm_client.destroy_secret_version(name=secret_resource)

            return res

        return list_instances(gcp_project, gcp_zone, access_token)

    except Exception as exp:
        err_msg = f"Error: { exp }"
        print(err_msg)
        return err_msg


# def main():
#     """
#     Main function when called from the command line
#     """
#     access_token = None
#     if len(sys.argv) > 1:
#         access_token = sys.argv[1]
#     print(f"Access Token: { access_token }")

#     gcp_project = os.environ.get('GCP_PROJECT', '')
#     gcp_zone = os.environ.get('GCP_ZONE', '')
#     try:
#         list_instances(gcp_project, gcp_zone, access_token)
#     except Exception as exp:
#         print(f"Error: { exp }")


# if __name__ == '__main__':
#     main()
