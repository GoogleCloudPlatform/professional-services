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
import datetime
import logging
import os
import pathlib
from typing import Optional

from google.api_core import exceptions
from google.cloud import storage

from src.config.config_service import config_service

logger = logging.getLogger(__name__)


class GcsService:
    """A service for interacting with Google Cloud Storage."""

    def __init__(self, bucket_name: Optional[str] = None):
        """Initializes the GCS client and bucket."""
        self.cfg = config_service
        self.client = storage.Client(project=self.cfg.PROJECT_ID)
        self.bucket_name = bucket_name or self.cfg.GENMEDIA_BUCKET
        self.bucket = self.client.bucket(self.bucket_name)
        logger.info(
            f"GcsService initialized for bucket: gs://{self.bucket_name}"
        )

    def download_from_gcs(
        self, gcs_uri_path: str, destination_file_path: str
    ) -> str | None:
        """
        Downloads a blob from GCS and saves it to a local file path.

        Args:
            gcs_uri_path: The path to the file in the GCS bucket. Do not append
            the bucket name, just the folder and file path.
            Ex: '17025013387606323175/sample_0.mp4'

            destination_file_path: The local path to save the file to.

        Returns:
            The local path of the downloaded file, or None on failure.
        """
        os.makedirs(os.path.dirname(destination_file_path), exist_ok=True)
        blob = self.bucket.blob(gcs_uri_path)
        try:
            blob.download_to_filename(destination_file_path)
            return destination_file_path
        except exceptions.NotFound:
            logger.error(
                f"Blob '{gcs_uri_path}' not found in bucket '{self.bucket_name}'."
            )
            return None
        except exceptions.GoogleAPICallError as e:
            logger.error(f"Failed to download '{gcs_uri_path}' from GCS: {e}")
            return None

    def download_bytes_from_gcs(self, gcs_uri: str) -> bytes | None:
        """
        Downloads a blob from GCS and returns its content as bytes.

        Args:
            gcs_uri: The full GCS URI (e.g., "gs://bucket-name/path/to/blob").

        Returns:
            The blob content as bytes, or None on failure.
        """
        if not gcs_uri.startswith("gs://"):
            logger.error(f"Invalid GCS URI provided: {gcs_uri}")
            return None

        try:
            bucket_name, blob_name = gcs_uri.replace("gs://", "").split("/", 1)
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            return blob.download_as_bytes()
        except exceptions.NotFound:
            logger.error(f"Blob '{gcs_uri}' not found.")
            return None
        except Exception as e:
            logger.error(f"Failed to download bytes from '{gcs_uri}': {e}")
            return None

    def upload_file_to_gcs(
        self, local_path: str, destination_blob_name: str, mime_type: str
    ):
        """
        Checks if a local file exists and then uploads it to a GCS blob.

        Args:
            local_path: Path to the local file to upload.
            destination_blob_name: The name for the object in GCS.

        Raises:
            FileNotFoundError: If the file at local_path does not exist.
        """
        try:
            if not self.bucket_name:
                logger.error(
                    "GCS bucket name is not configured. Aborting upload."
                )
                return None

            if not pathlib.Path(local_path).is_file():
                raise FileNotFoundError(
                    f"Cannot upload file, not found at: {local_path}"
                )

            blob = self.bucket.blob(destination_blob_name)
            blob.upload_from_filename(local_path, content_type=mime_type)
            return f"gs://{self.bucket_name}/{destination_blob_name}"
        except exceptions.NotFound:
            # This specific error usually means the BUCKET itself does not exist.
            logger.error(
                f"Upload failed: The bucket 'gs://{self.bucket_name}' was not found."
            )
            return None
        except exceptions.GoogleAPICallError as e:
            logger.error(f"Failed to upload '{destination_blob_name}': {e}")
            return None

    def upload_bytes_to_gcs(
        self, bytes: bytes, destination_blob_name: str, mime_type: str
    ):
        """
        Uploads bytes it to a GCS blob.

        Args:
            local_path: Path to the local file to upload.
            destination_blob_name: The name for the object in GCS.
        """
        try:

            blob = self.bucket.blob(destination_blob_name)
            blob.upload_from_string(bytes, content_type=mime_type)
            return f"gs://{self.bucket_name}/{destination_blob_name}"
        except exceptions.NotFound:
            logger.error(f"Blob '{destination_blob_name}' not found.")
            return None
        except exceptions.GoogleAPICallError as e:
            logger.error(f"Failed to upload '{destination_blob_name}': {e}")
            return None

    def delete_blob_from_uri(self, gcs_uri: str):
        """
        Deletes a blob from GCS using its full gs:// URI.

        Args:
            gcs_uri: The full GCS URI (e.g., "gs://bucket-name/path/to/blob").

        Returns:
            True if deletion was successful or blob didn't exist, False on error.
        """
        if not gcs_uri.startswith(f"gs://{self.bucket_name}/"):
            logger.error(
                f"GCS URI '{gcs_uri}' does not belong to bucket '{self.bucket_name}'."
            )
            return False

        blob_name = gcs_uri.replace(f"gs://{self.bucket_name}/", "")
        blob = self.bucket.blob(blob_name)
        try:
            blob.delete()
            logger.info(f"Successfully deleted blob: {gcs_uri}")
            return True
        except exceptions.NotFound:
            logger.warning(f"Blob not found, could not delete: {gcs_uri}")
            return True  # Treat as success if it's already gone
        except exceptions.GoogleAPICallError as e:
            logger.error(f"Failed to delete blob '{gcs_uri}': {e}")
            return False

    def store_to_gcs(
        self,
        folder: str,
        file_name: str,
        mime_type: str,
        contents: str | bytes,
        decode: bool = False,
        bucket_name: str | None = None,
    ):
        """store contents to GCS"""
        actual_bucket_name = bucket_name if bucket_name else self.bucket_name
        logger.info(
            f"Target project {self.cfg.PROJECT_ID}, target bucket {actual_bucket_name}"
        )
        destination_blob_name = f"{folder}/{file_name}"
        logger.info(f"Destination {destination_blob_name}")
        try:
            blob = self.bucket.blob(destination_blob_name)

            # Upload the file decoding it first
            if decode:
                contents_bytes = base64.b64decode(contents)
                blob.upload_from_string(contents_bytes, content_type=mime_type)
            # Upload the file as bytes
            elif isinstance(contents, bytes):
                blob.upload_from_string(contents, content_type=mime_type)
            else:
                return ""

            return f"gs://{actual_bucket_name}/{destination_blob_name}"
        except exceptions.NotFound:
            logger.error(
                f"Blob '{destination_blob_name}' not found in bucket '{self.bucket_name}'."
            )
            return None
        except exceptions.GoogleAPICallError as e:
            logger.error(
                f"Failed to download '{destination_blob_name}' from GCS: {e}"
            )
            return None
