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

import enum
from base64 import b64decode, b64encode

import tink
from google.cloud import bigquery, kms
from tink import aead, cleartext_keyset_handle, daead


class CipherManager(object):
    """Wrapper class to manage cipher objects (ColumnCipher class) for multiple columns for a given table."""

    def __init__(self, columns, table_name, dataset_name):
        """Expects a list of strings for columns, along with single strings for table_name and dataset_name."""
        self._ciphers = {}
        keyset_rows = self._retrieve_keysets(columns, table_name, dataset_name)

        for row in keyset_rows:
            self._ciphers[row.column_name] = ColumnCipher(
                row.column_name,
                row.kms_resource,
                row.first_level_keyset,
                row.associated_data,
            )

        self._assert_all_keysets_found(columns)

    def _assert_all_keysets_found(self, columns):
        """Checks that keys were found for all the columns that were provided."""
        col_set = set(columns)
        cipher_set = set(self._ciphers.keys())
        diff = col_set - cipher_set
        if len(diff) != 0:
            raise Exception(f"Error: No keys found for the following columns: {diff}")

    def _retrieve_keysets(
        self, column_names, table_name="deterministic", dataset_name="deterministic"
    ):
        """Retrieves the keysets required for the provided columns. Queries the keysets table in BigQuery via an Authorized TVF.

        Note: Using a default string (eg. 'deterministic' in this case) could be a way to have just a single row for a given column in the Keysets table, rather than needing multiple row for the same column type in different tables that would be using the same key (since the same key needs to be used for deterministic encryption to be usable for joins across tables).

        TVF definition reference:
            CREATE TABLE FUNCTION dataset_name.get_all_keysets(col_names ARRAY<STRING>, tbl_name STRING, ds_name STRING) AS
                SELECT
                column_name, kms_resource, first_level_keyset, associated_data
                FROM
                `project_id.security.keysets`
                WHERE
                SESSION_USER() IN UNNEST(permitted_access)
                AND table_name=tbl_name
                AND dataset_name=ds_name
                AND column_name IN UNNEST(col_names)
        """
        KEYSETS_TVF_PROJECT = "project_id"
        KEYSETS_TVF_DATASET = "dataset_name"
        KEYSETS_ALL_TVF_NAME = "get_all_keysets"

        bq_client = bigquery.Client()
        query_job = bq_client.query(
            f"""
            SELECT * FROM `{KEYSETS_TVF_PROJECT}.{KEYSETS_TVF_DATASET}.{KEYSETS_ALL_TVF_NAME}`({column_names}, '{table_name}', '{dataset_name}');
            """
        )
        results = query_job.result()
        return results

    def encrypt(self, column_name, plaintext):
        """Returns output of the encrypt operation for using a given column's cipher."""
        return self._ciphers[column_name].encrypt(plaintext)

    def decrypt(self, column_name, ciphertext):
        """Returns output of the decrypt operation for using a given column's cipher."""
        return self._ciphers[column_name].decrypt(ciphertext)


class ColumnCipher(object):
    """Provides an abstraction for users to work with the Tink cryptographic library when using BigQuery-compatible KMS-wrapped keysets with BigQuery AEAD column-level encryption."""

    class KeysetType(enum.Enum):
        UNKNOWN = 0
        DETERMINISTIC = 1
        NONDETERMINISTIC = 2

    def __init__(self, column_name, kms_uri, wrapped_dek, associated_data):
        self.__cipher = None  # Not initialized until cipher is needed since the Tink primitive is not serializable - may cause errors in Spark.
        self.key_type_url, self.keyset_type = None, None

        self.column_name = column_name
        self._associated_data = associated_data

        self.__dek = self._kms_unwrap(kms_uri, wrapped_dek)
        self._set_key_type_url()
        self._set_keyset_type()

    def _kms_unwrap(self, key_name, wrapped_dek):
        """Calls GCP KMS to use KMS KEK to unwrap DEK (Tink keyset)."""
        kms_client = kms.KeyManagementServiceClient()
        decrypted_keyset_obj = kms_client.decrypt(
            {
                "name": key_name.split("gcp-kms://")[1],
                "ciphertext": wrapped_dek,
            }
        )
        return decrypted_keyset_obj.plaintext

    def _set_key_type_url(self):
        binary_keyset_reader = tink.BinaryKeysetReader(self.__dek)
        keyset_handle = cleartext_keyset_handle.read(binary_keyset_reader)
        self.key_type_url = keyset_handle.keyset_info().key_info[0].type_url

    def _set_keyset_type(self):
        """Determines and returns the object's keyset type."""
        if self.key_type_url == "type.googleapis.com/google.crypto.tink.AesSivKey":
            self.keyset_type = ColumnCipher.KeysetType.DETERMINISTIC
        elif self.key_type_url == "type.googleapis.com/google.crypto.tink.AesGcmKey":
            self.keyset_type = ColumnCipher.KeysetType.NONDETERMINISTIC
        else:
            self.keyset_type = ColumnCipher.KeysetType.UNKNOWN
            raise Exception(f"Unsupported Tink keyset of type {self.key_type_url}")

    def _create_cipher(self):
        """Creates Tink primitive (cipher), used for cryptographic operations."""
        binary_keyset_reader = tink.BinaryKeysetReader(self.__dek)
        keyset_handle = cleartext_keyset_handle.read(binary_keyset_reader)

        if self.keyset_type is ColumnCipher.KeysetType.DETERMINISTIC:
            daead.register()
            cipher = keyset_handle.primitive(daead.DeterministicAead)
        elif self.keyset_type is ColumnCipher.KeysetType.NONDETERMINISTIC:
            aead.register()
            cipher = keyset_handle.primitive(aead.Aead)
        else:
            raise Exception(f"Unsupported Tink keyset of type {self.keyset_type}")

        return cipher

    def encrypt(self, plaintext, assoc_data=None):
        """Encrypt plaintext string based on KeysetType, return b64-encoded string. Can be modified to accept bytes instead."""
        if self.__cipher is None:
            self.__cipher = self._create_cipher()

        if assoc_data is None:
            assoc_data = self._associated_data

        if self.keyset_type is ColumnCipher.KeysetType.DETERMINISTIC:
            ciphertext = self.__cipher.encrypt_deterministically(
                plaintext.encode(), assoc_data.encode()
            )
        elif self.keyset_type is ColumnCipher.KeysetType.NONDETERMINISTIC:
            ciphertext = self.__cipher.encrypt(plaintext.encode(), assoc_data.encode())
        else:
            raise Exception(f"Unsupported Tink keyset of type {self.keyset_type}")
        return b64encode(ciphertext).decode()

    def decrypt(self, ciphertext, assoc_data=None):
        """Decrypt b64-encoded byte string ciphertext based on KeysetType, return plaintext string."""
        if self.__cipher is None:
            self.__cipher = self._create_cipher()

        if assoc_data is None:
            assoc_data = self._associated_data

        if self.keyset_type is ColumnCipher.KeysetType.DETERMINISTIC:
            plaintext = self.__cipher.decrypt_deterministically(
                b64decode(ciphertext), assoc_data.encode()
            )
        elif self.keyset_type is ColumnCipher.KeysetType.NONDETERMINISTIC:
            plaintext = self.__cipher.decrypt(
                b64decode(ciphertext), assoc_data.encode()
            )
        else:
            raise Exception(
                "Unsupported keyset type. Ensure ColumnCipher has been initialized."
            )
        return plaintext.decode()
