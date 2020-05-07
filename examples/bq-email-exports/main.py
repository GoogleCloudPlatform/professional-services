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

# using SendGrid's Python Library
# https://github.com/sendgrid/sendgrid-python

import os
import time
import datetime
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from google.cloud import bigquery, storage
from google.auth import iam, default
from google.auth.transport import requests
from google.oauth2 import service_account


def credentials():
    """Gets credentials to authenticate Google APIs.

    Args:
        None

    Returns:
        Credentials to authenticate the API.
    """
    # Get Application Default Credentials if running in Cloud Functions
    if os.getenv("IS_LOCAL") is None:
        credentials, project = default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    # To use this file locally set IS_LOCAL=1 and populate env var GOOGLE_APPLICATION_CREDENTIALS
    # with path to service account json key file
    else:
        credentials = service_account.Credentials.from_service_account_file(
            os.getenv("GOOGLE_APPLICATION_CREDENTIALS"), scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
    return credentials


def main():
    """Sends an email with a Google Cloud Storage signed URL of BQ Query results.
    Creates BQ table, runs a SQL query, and exports the results to Cloud Storage as a CSV.
    Generates signing credentials for the CSV and sends an email with a link to the signed URL.

    Args:
        None

    Returns:
        None
    """

    # Create BQ and Storage Client
    bq_client = bigquery.Client(credentials=credentials())
    storage_client = storage.Client(credentials=credentials())

    # Set variables
    timestr = time.strftime("%Y%m%d%I%M%S")
    project = "report-scheduling"
    dataset_id = "bq_exports"
    file_name = "daily_export_" + timestr
    csv_name = file_name + ".csv"
    table_id = "report-scheduling.bq_exports." + file_name
    bucket_name = "bq_email_exports"
    from_email = "sender@example.com"
    to_emails = "recipient@example.com"

    # Create a BQ table
    schema = [
        bigquery.SchemaField("url", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("view_count", "INTEGER", mode="REQUIRED"),
    ]

    # Make an API request to create table
    table = bq_client.create_table(bigquery.Table(table_id, schema=schema))
    print("Created table {}.{}.{}".format(table.project, table.dataset_id, table.table_id))

    # Run query on that table
    job_config = bigquery.QueryJobConfig(destination=table_id)

    # Define the SQL query
    sql = """
        SELECT
        CONCAT(
            'https://stackoverflow.com/questions/',
            CAST(id as STRING)) as url,
        view_count
        FROM `bigquery-public-data.stackoverflow.posts_questions`
        WHERE tags like '%google-bigquery%'
        ORDER BY view_count DESC
        LIMIT 10
    """

    # Start the query, passing in the extra configuration
    query_job = bq_client.query(sql, job_config=job_config)

    # Wait for the job to complete
    query_job.result()
    print("Query results loaded to the table {}".format(table_id))

    # Export table data as CSV to GCS
    destination_uri = "gs://{}/{}".format(bucket_name, csv_name)
    dataset_ref = bq_client.dataset(dataset_id, project=project)
    table_ref = dataset_ref.table(file_name)

    extract_job = bq_client.extract_table(
        table_ref,
        destination_uri,
        # Location must match that of the source table
        location="US",
    )

    # Waits for job to complete
    extract_job.result()
    print("Exported {}:{}.{} to {}".format(project, dataset_id, table_id, destination_uri))

    # Generate a v4 signed URL for downloading a blob
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(csv_name)

    signing_credentials = None
    # If running on GCF, generate signing credentials
    # Service account running the GCF must have Service Account Token Creator role
    if os.getenv("IS_LOCAL") is None:
        signer = iam.Signer(request=requests.Request(),
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
        # This URL is valid for 24 hours, until the next email
        expiration=datetime.timedelta(hours=24),
        # Allow GET requests using this URL
        method="GET",
        # Signing credentials; if None falls back to json credentials in local environment
        credentials=signing_credentials,
    )
    print("Generated GET signed URL.")

    # Create email message through SendGrid with link to signed URL
    message = Mail(
        from_email=from_email,
        to_emails=to_emails,
        subject="Daily BQ export",
        html_content="<p> Your daily BigQuery export from Google Cloud Platform \
            is linked <a href={}>here</a>.</p>".format(
            url
        ),
    )

    # Send email
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        print(response.status_code)
    except Exception as e:
        print(e.message)


if __name__ == "__main__":
    main()
