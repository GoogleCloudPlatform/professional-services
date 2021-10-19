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
import distutils.util
import json
import logging
import os

from google.auth import default, exceptions, iam
from google.auth.transport import requests
from google.cloud import storage
from google.oauth2 import service_account
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


def main(event, context):
    """Entrypoint for Cloud Function"""

    data = base64.b64decode(event['data'])
    log_entry = json.loads(data)
    status = log_entry['severity']
    if status == "ERROR":
        code = log_entry['protoPayload']['status']['code']
        message = log_entry['protoPayload']['status']['message']
        job_id = log_entry['protoPayload']['serviceData']['jobCompletedEvent'][
            'job']['jobName']['jobId']
        logging.error(
            RuntimeError(
                f"Error in upstream export job with ID {job_id}. Code {code}: {message}"
            ))
    else:
        destination_uris = log_entry['protoPayload']['serviceData'][
            'jobCompletedEvent']['job']['jobConfiguration']['extract'][
                'destinationUris']
        if len(destination_uris) > 1:
            logging.warning(
                "Multiple GCS URIs found from BigQuery export. Only the first "
                "file will be linked in the email.")

        blob_path = destination_uris[0]
        blob = storage.Blob.from_string(blob_path)
        url = generate_signed_url(blob) if distutils.util.strtobool(get_env(
            'SIGNED_URL')) else get_auth_url(blob_path)

        message = Mail(
            from_email=get_env('FROM_EMAIL'),
            to_emails=get_env('TO_EMAILS'),
            subject=get_env('EMAIL_SUBJECT'),
            html_content="<p> Your BigQuery export from Google Cloud Platform \
                is linked <a href={}>here</a>.</p>".format(url),
        )

        try:
            sg_client = SendGridAPIClient(get_env('SENDGRID_API_KEY'))
            response = sg_client.send(message)
            print(f"SendGrid response code: {response.status_code}")
        except Exception as exc:
            logging.error(RuntimeError(f"ERROR: sending email failed: {exc}"))


def generate_signed_url(blob):
    """Generate signed URL for storage blob"""
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
    # Cloud Functions service account must have Service Account Token Creator role
    try:
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(
                hours=int(get_env('SIGNED_URL_EXPIRATION'))),
            method="GET",
            credentials=signing_credentials)
    except exceptions.TransportError:
        logging.error(
            RuntimeError("Service account running the function must have IAM "
                         "roles/iam.serviceAccountTokenCreator."))
    else:
        print("Generated signed URL.")
        return url


def get_env(name):
    """Returns environment variable"""
    return os.environ[name]


def get_auth_url(blob_path):
    """Returns authenticated URL given GCS URI"""
    return blob_path.replace('gs://', 'https://storage.cloud.google.com/')
