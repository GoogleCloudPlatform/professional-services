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
Cloud Function for sending the email with a signed URL link.
Triggered after export job from BigQuery to GCS is complete.
Uses https://github.com/sendgrid/sendgrid-python
"""

import base64
import datetime
import json
import logging
import os

from google.auth import default, iam
from google.auth.transport import requests
from google.cloud import storage
from google.oauth2 import service_account
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


def main(event, context):
    """Entrypoint for Cloud Function"""

    # Set variables
    signed_url_expiration_hrs = 24
    from_email = "sender@example.com"
    to_email = "recipient@example.com"
    email_subject = "Daily BQ export"

    data = base64.b64decode(event['data'])
    log_entry = json.loads(data)
    status = log_entry['severity']
    if status == "ERROR":
        code = log_entry['protoPayload']['status']['code']
        message = log_entry['protoPayload']['status']['message']
        logging.error(
            RuntimeError(
                f"Error in upstream export job. Code {code}: {message}"))
    else:
        blob_path = log_entry['protoPayload']['serviceData'][
            'jobCompletedEvent']['job']['jobConfiguration']['extract'][
                'destinationUris'][0]
        object_name = blob_path.split('/')[2]
        bucket_name = blob_path.split('/')[3]

        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(object_name)

        # Cloud Functions service account must have Service Account Token Creator role
        credentials = default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"])[0]
        signer = iam.Signer(
            request=requests.Request(),
            credentials=credentials,
            service_account_email=os.getenv("FUNCTION_IDENTITY"),
        )
        # Create token-based service account credentials for signing
        signing_credentials = service_account.IDTokenCredentials(
            signer=signer,
            token_uri="https://www.googleapis.com/oauth2/v4/token",
            target_audience="",
            service_account_email=os.getenv("FUNCTION_IDENTITY"),
        )

        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(hours=signed_url_expiration_hrs),
            method="GET",
            credentials=signing_credentials)
        print("Generated signed URL.")

        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=email_subject,
            html_content="<p> Your BigQuery export from Google Cloud Platform \
                is linked <a href={}>here</a>.</p>".format(url),
        )

        try:
            sg_client = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
            response = sg_client.send(message)
            print(f"SendGrid response code: {response.status_code}")
        except Exception as exc:
            logging.error(RuntimeError(f"ERROR: sending email failed: {exc}"))
