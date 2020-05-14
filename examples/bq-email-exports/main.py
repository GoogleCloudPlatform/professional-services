# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Cloud Function for scheduling emails of BigQuery results
Uses https://github.com/sendgrid/sendgrid-python
"""

import base64
import datetime
import json
import os
import time

from google.auth import default, iam
from google.auth.transport import requests
from google.cloud import bigquery, storage
from google.oauth2 import service_account
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


def credentials():
    """Gets credentials to authenticate Google APIs.

    Returns:
        Credentials to authenticate the API.
    """
    # Get Application Default Credentials if running in Cloud Functions
    if os.getenv("IS_LOCAL") is None:
        credentials = default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"])
    # To use this file locally set IS_LOCAL=1 and populate env var GOOGLE_APPLICATION_CREDENTIALS
    # with path to service account json key file
    else:
        credentials = service_account.Credentials.from_service_account_file(
            os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
    return credentials

def main(event, context):
    """Entrypoint for Cloud Function"""

    # Create BQ and Storage Client
    bq_client = bigquery.Client(credentials=credentials())
    storage_client = storage.Client(credentials=credentials())

    # Get configurations from Cloud Scheduler payload
    config = json.loads(base64.b64decode(event['data']).decode('utf-8'))

    # Append timestamp to table name and set table_id
    table_name = config["table_name"] + time.strftime("%Y%m%d%I%M%S")
    table_id = f"{config['project_id']}.{config['dataset_id']}.{table_name}"

    # Get query
    job_config = bigquery.QueryJobConfig(destination=table_id)
    query_bucket = storage_client.bucket(config["query_bucket"])
    query_file = query_bucket.blob(config["query_file_name"])
    query = query_file.download_as_string()
    sql = query.decode("utf-8")

    # Start the query, passing in the extra configuration
    query_job = bq_client.query(sql, job_config=job_config)

    # Wait for the job to complete
    query_job.result()
    print(f"Query results loaded to the table {table_id}")

    # Export table data as JSON file to GCS
    destination_uri = f"gs://{config['bucket_name']}/{table_name}.json"
    dataset_ref = bigquery.DatasetReference(config["project_id"], config["dataset_id"])
    table_ref = dataset_ref.table(table_name)
    extract_job = bq_client.extract_table(
        table_ref,
        destination_uri
    )

    # Waits for job to complete
    extract_job.result()
    print(f"Exported {config['project_id']}:{config['dataset_id']}.{table_id} to {destination_uri}")

    # Delete table once exporting is complete
    bq_client.delete_table(table_id)
    print(f"Deleted table '{table_id}'.")

    # Generate a v4 signed URL for downloading a blob
    bucket = storage_client.bucket(config["bucket_name"])
    blob = bucket.blob(f"{table_name}.json")

    signing_credentials = None
    # If running on GCF, generate signing credentials
    # Service account running the GCF must have Service Account Token Creator role
    if os.getenv("IS_LOCAL") is None:
        signer = iam.Signer(
            request=requests.Request(),
            credentials=credentials(),
            service_account_email=os.getenv("FUNCTION_IDENTITY"),
        )
        # Create Token-based service account credentials for signing
        signing_credentials = service_account.IDTokenCredentials(
            signer=signer,
            token_uri="https://www.googleapis.com/oauth2/v4/token",
            target_audience="",
            service_account_email=os.getenv("FUNCTION_IDENTITY"),
        )

    url = blob.generate_signed_url(
        version="v4",
        # This URL is valid until expiration
        expiration=datetime.timedelta(hours=config["signed_url_expiration_hrs"]),
        method="GET",
        # Signing credentials; if None falls back to json credentials in local environment
        credentials=signing_credentials,
    )
    print("Generated GET signed URL.")

    # Create email message through SendGrid with link to signed URL
    message = Mail(
        from_email = config["from_email"],
        to_emails = config["to_email"],
        subject = config["email_subject"],
        html_content = "<p> Your BigQuery export from Google Cloud Platform \
            is linked <a href={}>here</a>.</p>".format(url),
    )

    # Send email
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        print(f"SendGrid response code: {response.status_code}")
    except Exception as e:
        raise RuntimeError(f"ERROR: sending email failed: {e.message}")


if __name__ == "__main__":
    main()
