"""Moudule to register request/response interceptors when mitmproxy runs."""
# Copyright 2024 Google Inc. All Rights Reserved.

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
from mitmproxy import http
import re
import os
from hashlib import md5
import base64

from absl import logging

import tink
from tink import aead
from tink.integration import gcpkms

# Env variables for GCP KMS with Key encryption keys. The default values are set for testing locally.
GCP_KMS_PROJECT_ID = os.environ.get('GCP_KMS_PROJECT_ID', "your-default-project")
GCP_KMS_KEY = os.environ.get('GCP_KMS_KEY', "your-default-kms-key")
GCP_KMS_CREDENTIALS = os.environ.get('GCP_KMS_CREDENTIALS', None)

# Intialize kms client, tink and create envelope AEAD primitive using AES256 GCM for encrypting the data 
aead.register()

try:
    client = gcpkms.GcpKmsClient(GCP_KMS_KEY, GCP_KMS_CREDENTIALS)
except tink.TinkError as e:
    logging.exception('Error creating GCP KMS client: %s', e)
    raise  # Re-raise the exception to be handled at a higher level

try:
    remote_aead = client.get_aead(GCP_KMS_KEY)
    env_aead = aead.KmsEnvelopeAead(
        aead.aead_key_templates.AES256_GCM, remote_aead
    )
except tink.TinkError as e:
    logging.exception('Error creating primitive: %s', e)
    raise

def _base64_md5hash(buffer_object: bytes) -> str:
    """Get MD5 hash of bytes (as base64).

    Args:
        buffer_object: Buffer containing bytes used to compute an MD5 hash.

    Returns:
        A base64 encoded digest of the MD5 hash.
    """
    hash_obj = md5(buffer_object)
    digest_bytes = hash_obj.digest()
    return base64.b64encode(digest_bytes).decode("utf-8")  # Decode to string


def encrypt_and_decrypt(mode: str, gcp_project_id: str, ciphertext: bytes, 
                       gcs_blob_path: bytes) -> bytes:
    """Encrypts or decrypts data using Tink and Google Cloud KMS.

    Args:
        mode: The operation mode, either "encrypt" or "decrypt".
        gcp_project_id: The ID of the Google Cloud project.
        ciphertext: The data to encrypt or decrypt.
        gcs_blob_path: The path to the GCS blob.

    Returns:
        The encrypted or decrypted data.

    Raises:
        ValueError: If an unsupported mode is provided.
    """

    if mode == 'encrypt':
        output_data = env_aead.encrypt(ciphertext, gcs_blob_path)
        logging.info("Data encrypted successfully.")
        return output_data
    elif mode == 'decrypt':
        decrypted_content = env_aead.decrypt(ciphertext, gcs_blob_path)
        logging.info("Data decrypted successfully.")
        return decrypted_content
    else:
        raise ValueError(
            f'Unsupported mode {mode}. Please choose "encrypt" or "decrypt".'
        )


def request(flow: http.HTTPFlow) -> None:
    """Intercepts and potentially modifies HTTP requests.

    This function specifically targets GCS upload requests, attempting to
    encrypt the content before it's uploaded.

    Args:
        flow: The HTTP flow object representing the request/response exchange.
    """
    if flow.request.pretty_url.startswith("https://storage.googleapis.com/upload"):
        logging.info("GCS Upload Request intercepted:")
        gcs_url = flow.request.pretty_url
        gcs_url = gcs_url.split("/v1/b/")[1]
        bucket_url = gcs_url.split("/o")[0] # get the bucket and object url
        # logging.info(flow.request.content)

        request_content = flow.request.content.decode("utf-8")

        # Get GCS blob path form the request
        object_url = re.search(
                '{"name": "(.*?)"}\r\n', request_content
            ).group(1)
        gcs_path = b"gs://" + bucket_url.encode("utf-8") + b"/" + object_url.encode("utf-8")
        logging.info(f"GCS Path of the upload request : {gcs_path}")

        try:
            file_content = re.search(
                'content-type: text/plain\r\n\r\n(.*?)\r\n', request_content
            ).group(1)
        except AttributeError:
            raise
        file_content = file_content.encode("utf-8")

        encrypted_content = encrypt_and_decrypt(
            "encrypt",
            GCP_KMS_PROJECT_ID,
            file_content,
            gcs_path,
        )

        flow.request.content = flow.request.content.replace(
            file_content, encrypted_content
        )
        logging.info(f"Request content modified after encryption.")


def response(flow: http.HTTPFlow) -> None:
    """Intercepts and potentially modifies HTTP responses.

    This function targets GCS download responses, attempting to decrypt the
    content that was previously encrypted.

    Args:
        flow: The HTTP flow object representing the request/response exchange.
    """
    if flow.request.pretty_url.startswith("https://storage.googleapis.com/download"):
        logging.info("GCS Download Request intercepted:")
        gcs_url = flow.request.pretty_url
        gcs_url = gcs_url.split("/v1/b/")[1]
        bucket_url, object_url = gcs_url.split("/o/")[0], gcs_url.split("/o/")[1] # get the bucket and object url
        object_url = object_url.split("?")[0] # capture only object name and clean up the query string post ?
        gcs_path = b"gs://" + bucket_url.encode("utf-8") + b"/" + object_url.encode("utf-8")
        encrypted_data = flow.response.content
        decrypted_content = encrypt_and_decrypt(
            "decrypt",
            GCP_KMS_PROJECT_ID,
            encrypted_data,
            gcs_path,
        )
        # Update the response content with the decrypted content
        flow.response.content = decrypted_content

        # Update content lenght headers with new length of decrypted data
        flow.response.headers["X-Goog-Stored-Content-Length"] = str(
            len(flow.response.content)
        )
        flow.response.headers["Content-Length"] = str(len(flow.response.content))
        
        # Update Google hash headers with decrypted contents md5 hash to pass the checksum validation.
        md5_hash = _base64_md5hash(decrypted_content)
        flow.response.headers["X-Goog-Hash"] = md5_hash


def start():
    """Entry point for starting the mitmproxy addon."""
    from mitmproxy import ctx
    ctx.master.addons.add(request)
    ctx.master.addons.add(response)
