# Copyright 2022 Google LLC All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from googleapiclient import discovery
from oauth2client.client import GoogleCredentials
from airflow.exceptions import AirflowException
import time


def invoke_sts_job(sts_id,project):

    """
    This function synchronously invokes a transfer service job.
    Args:
        sts_id (str): the id of your transfer service job provided after the sts creation
        project (str): the id of your project 
    """
    credentials = GoogleCredentials.get_application_default()
    service = discovery.build('storagetransfer', 'v1', credentials=credentials)

    project_id = {"projectId": project}

    run_request = service.transferJobs().run(jobName=sts_id, body=project_id)
    response = run_request.execute()

    status = service.transferOperations().get(name=response.get("name")).execute().get("metadata").get("status")
    while status != "SUCCESS":
        time.sleep(2)
        status = service.transferOperations().get(name=response.get("name")).execute().get("metadata").get("status")
        print(status)
        if status in ("FAILED", "ABORTED", "PAUSED"):
            raise AirflowException("sts job failed")
            break 
    return response.get('name')