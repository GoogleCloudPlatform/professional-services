# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import io
import logging
from base64 import b64decode, b64encode

import tink
from google.cloud import bigquery, kms
from tink import aead, cleartext_keyset_handle, daead

SECURITY_DATASET = "security"
KEYSET_TABLE = "keysets"


def wrap_key(plaintext_key, project_id, location_id, key_ring_id, key_id):
    """Wrap base64-encoded plaintext keyset using KMS KEK, returning b64 byte string."""
    kms_client = kms.KeyManagementServiceClient()
    plaintext_key_bytes = b64decode(plaintext_key)
    key_name = kms_client.crypto_key_path(project_id, location_id, key_ring_id, key_id)
    encrypted_keyset_obj = kms_client.encrypt(
        {"name": key_name, "plaintext": plaintext_key_bytes}
    )

    return b64encode(encrypted_keyset_obj.ciphertext).decode()


def upload_key_to_bq(
    project_id,
    kms_resource,
    first_level_keyset,
    dataset_name,
    table_name,
    column_name,
    associated_data,
    permitted_access,
):
    """Load row to BigQuery keysets table."""

    bq_client = bigquery.Client(project_id)
    row_dict = {
        "kms_resource": kms_resource,
        "first_level_keyset": first_level_keyset,
        "dataset_name": dataset_name,
        "table_name": table_name,
        "column_name": column_name,
        "associated_data": associated_data,
        "permitted_access": permitted_access,
    }

    security_table = bq_client.get_table(
        f"{project_id}.{SECURITY_DATASET}.{KEYSET_TABLE}"
    )

    job_config = bigquery.LoadJobConfig()
    job_config.write_disposition = bigquery.WriteDisposition.WRITE_APPEND

    job = bq_client.load_table_from_json(
        [row_dict], security_table, job_config=job_config
    )
    logging.info(f"Starting job {job.job_id}")

    job.result()  # Waits for table load to complete.
    logging.info("Job finished.")


def gen_tink_clear_keyset(is_deterministic):
    """Create a base64-encoded cleartext Tink keyset."""
    if is_deterministic:
        # In BQ: "SELECT KEYS.NEW_KEYSET('DETERMINISTIC_AEAD_AES_SIV_CMAC_256')"
        daead.register()
        key_template = daead.deterministic_aead_key_templates.AES256_SIV
    else:
        # In BQ: "SELECT KEYS.NEW_KEYSET('AEAD_AES_GCM_256')"
        aead.register()
        key_template = aead.aead_key_templates.AES256_GCM

    keyset_handle = tink.KeysetHandle.generate_new(key_template)
    binary_out = io.BytesIO()
    cleartext_keyset_handle.write(tink.BinaryKeysetWriter(binary_out), keyset_handle)
    binary_out.seek(0)
    keyset = b64encode(binary_out.read())

    return keyset


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.INFO)

    parser = argparse.ArgumentParser()
    parser.add_argument("--project_id", type=str)
    parser.add_argument(
        "--is_deterministic", action=argparse.BooleanOptionalAction
    )  # Pass either --is_deterministic or --no-is_deterministic
    parser.add_argument("--key_location", type=str)
    parser.add_argument("--key_ring_id", type=str)
    parser.add_argument("--key_id", type=str)
    parser.add_argument("--dataset_name", type=str)
    parser.add_argument("--table_name", type=str)
    parser.add_argument("--column_name", type=str)
    parser.add_argument("--associated_data", type=str)
    parser.add_argument(
        "--permitted_users", type=str
    )  # Comma-separated string, eg. "alice@example.com,bob@example.com"
    args = parser.parse_args()

    # Generate new Tink keyset
    tink_keyset = gen_tink_clear_keyset(args.is_deterministic)

    # Wrap cleartext keyset (DEK) using GCP KMS.
    kms_resource_name = f"gcp-kms://projects/{args.project_id}/locations/{args.key_location}/keyRings/{args.key_ring_id}/cryptoKeys/{args.key_id}"
    wrapped_key = wrap_key(
        tink_keyset, args.project_id, args.key_location, args.key_ring_id, args.key_id
    )

    # Upload wrapped keyset to BigQuery.
    upload_key_to_bq(
        args.project_id,
        kms_resource_name,
        wrapped_key,
        args.dataset_name,
        args.table_name,
        args.column_name,
        args.associated_data,
        args.permitted_users.split(","),
    )
