from googleapiclient import discovery
from oauth2client.client import GoogleCredentials
from airflow.exceptions import AirflowSkipException, AirflowException
import time
import os
import logging

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