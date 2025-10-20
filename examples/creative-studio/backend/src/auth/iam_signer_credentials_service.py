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

import datetime
import logging
from os import getenv
from google.auth import credentials
from google.cloud import iam_credentials_v1
from google.cloud import storage

logger = logging.getLogger(__name__)


class IamSignerCredentials(credentials.Signing):
    """
    A custom credentials class that uses the IAM Credentials API to sign bytes.

    This class implements the `google.auth.credentials.Signing` interface.
    The Storage client library will automatically call the `sign_bytes` method when it
    needs a signature.
    """

    def __init__(self):
        # 1. Create the custom credentials object for signing.
        self.service_account_email = getenv("SIGNING_SA_EMAIL", "")
        self.iam_client = iam_credentials_v1.IAMCredentialsClient()
        self._sa_path = (
            f"projects/-/serviceAccounts/{self.service_account_email}"
        )

    def generate_presigned_url(
        self, gcs_uri: str | None, expiration_hours: int = 1
    ) -> str:
        """Generates a v4 presigned URL for a GCS object.

        The user or service account running this code needs 'roles/storage.objectViewer'
        permission on the bucket, or a custom role with 'storage.objects.get'.

        Args:
            gcs_uri: The GCS URI of the object (e.g., 'gs://bucket/object').
            expiration_hours: The number of hours the URL will be valid for.

        Returns:
            A presigned URL, or the original GCS URI if an error occurs.
        """
        if not gcs_uri or (gcs_uri and not gcs_uri.startswith("gs://")):
            return gcs_uri or ""

        # Get the service account email from an environment variable.
        # This is the account that will be used to sign the URL. It must have 'roles/storage.objectViewer' on the bucket.
        # The principal running this code (e.g., your user account) needs 'roles/iam.serviceAccountTokenCreator' on this SA.
        if not self.service_account_email:
            return gcs_uri

        try:
            # 2. Parse the GCS URI and create a blob object.
            storage_client = storage.Client()
            bucket_name, blob_name = gcs_uri.replace("gs://", "").split("/", 1)
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_name)

            # 3. Generate the signed URL, passing the custom credentials.
            # The storage library will call our signing_credentials.sign_bytes() method.
            url = blob.generate_signed_url(
                version="v4",
                expiration=datetime.timedelta(hours=expiration_hours),
                method="GET",
                credentials=self,
            )
            return url
        except Exception as e:
            logger.error(f"Error generating presigned URL for {gcs_uri}: {e}")
            return gcs_uri

    @property
    def signer_email(self) -> str:
        """The email of the service account used for signing."""
        return self.service_account_email

    def sign_bytes(self, message: bytes) -> bytes:
        """Signs a bytestring using the IAM Credentials API."""
        try:
            response = self.iam_client.sign_blob(
                name=self._sa_path,
                payload=message,
            )
            return response.signed_blob
        except Exception as e:
            logger.error(
                f"IAM PERMISSION DENIED: The principal running this code does not have "
                f"'roles/iam.serviceAccountTokenCreator' on the service account '{self.service_account_email}'."
            )
            raise e  # Re-raise the exception to be caught by the caller

    # Alias sign_bytes to sign to satisfy the Signer interface, which is
    # required by the `signer` property.
    sign = sign_bytes

    @property
    def signer(self):
        """The object that can sign bytes."""
        return self

    def refresh(self, request):
        """Refresh is not used by this credentials type."""
        pass
