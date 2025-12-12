# Copyright 2025 Google LLC
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

import base64
import logging
from email.message import EmailMessage

import google.auth
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from src.config.config_service import config_service

logger = logging.getLogger(__name__)


class EmailService:
    """A service for sending emails via Gmail's SMTP server."""

    # The scope required to send emails via the Gmail API.
    _SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

    def __init__(self):
        self.frontend_url = config_service.FRONTEND_URL
        self.sender_email = config_service.SENDER_EMAIL

        if not self.sender_email:
            logger.warning(
                "SENDER_EMAIL not set for Gmail API. "
                "EmailService will log emails instead of sending."
            )

    def send_workspace_invitation_email(
        self,
        recipient_email: str,
        inviter_name: str,
        workspace_name: str,
        workspace_id: int,
    ):
        """
        Sends an email to a user inviting them to a workspace using the Gmail API
        with service account domain-wide delegation.
        If sender credentials are not configured, it will log the email content.
        """
        invitation_url = f"{self.frontend_url}?workspaceId={workspace_id}"
        subject = (
            f"You've been invited to join '{workspace_name}' in Creative Studio"
        )
        plain_text_content = f"Hello,\n\n{inviter_name} has invited you to join the workspace '{workspace_name}'.\n\nClick the link below to access the workspace:\n{invitation_url}\n\nThanks,\nThe Creative Studio Team"

        if not self.sender_email:
            logger.info("--- SIMULATING EMAIL SEND (due to missing config) ---")
            logger.info(
                f"To: {recipient_email}\nSubject: {subject}\nBody:\n{plain_text_content}"
            )
            return

        try:
            # 1. Get the application's default credentials (from the service account on Cloud Run)
            creds, _ = google.auth.default(scopes=self._SCOPES)

            # 2. Impersonate the target user (the sender_email)
            delegated_creds = creds.with_subject(self.sender_email)  # type: ignore
            delegated_creds.refresh(Request())

            # 3. Build the Gmail API service client
            service = build(
                "gmail",
                "v1",
                credentials=delegated_creds,
                cache_discovery=False,
            )

            # 4. Create the email message
            message = EmailMessage()
            message.set_content(plain_text_content)
            message["To"] = recipient_email
            message["From"] = self.sender_email
            message["Subject"] = subject

            # 5. Encode the message in base64url format as required by the API
            encoded_message = base64.urlsafe_b64encode(
                message.as_bytes()
            ).decode()

            create_message = {"raw": encoded_message}

            # 6. Send the email
            send_message = (
                service.users()
                .messages()
                .send(userId="me", body=create_message)
                .execute()
            )
            logger.info(
                f'Message Id: {send_message["id"]} sent to {recipient_email}'
            )

        except HttpError as error:
            logger.error(
                f"An error occurred sending email to {recipient_email}: {error}"
            )
        except Exception as e:  # Catch other potential errors like auth issues
            logger.error(
                f"Failed to send workspace invitation email to {recipient_email}: {e}"
            )
