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
"""
This script pulls metadata and checksums for file archives in Google Cloud Storage and stores
them in a manifest file and in BigQuery to track changes over time.
The script uses the BagIt specification.
"""
import base64
import binascii
import os
import re
import json
from datetime import datetime
from google.cloud import storage, bigquery

FIXITY_MANIFEST_NAME = "manifest-md5sum.txt"
DATA_DIRECTORY_NAME = "data"  # Do not include trailing slash here


def main(event, context):
    """Identify bags to run Fixity, then write a manifest and write a record to BigQuery
    Args:
        event (obj): PubSub event data
        context (obj): Object that contains event context information
    """
    if "data" in event:
        event = json.loads(base64.b64decode(event["data"]).decode("utf-8"))
    print("Event: " + str(event))
    print("Context: " + str(context))
    if event == {} or is_manifest(context) is False:
        bucket_name = os.environ["BUCKET"]
        storage_client = storage.Client()
        bucket = storage_client.get_bucket(bucket_name)
        matched_bags = match_bag(context, bucket)
        for bag in matched_bags:
            bagit = BagIt(bucket, bag)
            bagit.commit()


def match_bag(context, bucket):
    """Matches bag to the file for which an event is triggered and returns bag
    or list of all bags to run Fixity against.
    Args:
        context (obj): Object that contains event context information
        bucket (obj): Bucket to match against
    """
    filename = context.resource["name"]
    matcher = re.search(
        r"projects/_/buckets/" + bucket.name + r"/objects/(.*)/data/.*",
        filename)
    try:
        return [matcher.group(1)
               ]  # Only match on changes to files within data/ directory
    except:
        bags = get_bags(bucket, None)
        for bag in bags:
            if bag in filename:
                return [bag]
        return bags


def get_bags(bucket, top_prefix=None):
    """Recurse through GCS directory tree until you hit 'data/' to create a list of every bag
    top_prefix (str): Starting level prefix
    """
    prefixes = set()
    top_prefixes = get_prefixes(bucket, top_prefix)
    for prefix in top_prefixes:
        if prefix.endswith(f"{DATA_DIRECTORY_NAME}/"):
            prefixes.add(
                re.sub(r"\/" + re.escape(DATA_DIRECTORY_NAME) + r"\/$", "",
                       prefix))  # remove data/ from bag name
        else:
            prefixes.update(get_bags(bucket, prefix))
    return prefixes


def get_prefixes(bucket, prefix=None):
    """Retrieves the directories for a bucket using the prefix
    Args:
        bucket (obj): Bucket object to retrieve prefixes against
        prefix (str): Prefix to look for nested prefixes underneath
    """
    iterator = bucket.list_blobs(prefix=prefix, delimiter="/")
    prefixes = []
    for page in iterator.pages:
        prefixes.extend(list(page.prefixes))
    return prefixes


def is_manifest(context):
    """Decides if file event is against a manifest file. Running fixity whenever
    a manifest is created would cause a loop, so this prevents that.
    Args:
        context (obj): Object that contains event context information
    """
    return FIXITY_MANIFEST_NAME in context.resource["name"]


class BagIt:
    """Creates manifest files and data based on BagIt specification
    """

    def __init__(self, bucket, bag):
        """Instantiates variables and BigQuery client
        Args:
            bucket (obj): GCS bucket object for which archive files are stored.
            bag (str): Name of bag to run Fixity against.∂∂∂∂
        """
        self.bag = bag
        self.bucket_name = os.environ["BUCKET"]
        self.bucket = bucket
        self.blobs = self.get_blobs()
        self.bigquery_client = bigquery.Client()
        self.fixity_date = datetime.now()

    def commit(self):
        self.write_and_upload_manifest()
        self.write_to_bigquery()

    def get_blobs(self):
        """Retrieve files with metadata present in a bag"""
        blobs = self.bucket.list_blobs(
            prefix=f"{self.bag}/{DATA_DIRECTORY_NAME}/")
        blobs_with_metadata = []
        for blob in blobs:
            blobs_with_metadata.append(self.get_metadata(blob.name))
        return blobs_with_metadata

    def get_metadata(self, blob_name):
        """Transforms metadata into a dict object
        Args:
            blob_name (str): Name of blob to pull metadata against
        """

        def decode_hash(hash_bytes):
            return binascii.hexlify(
                base64.urlsafe_b64decode(hash_bytes)).decode("utf-8")

        blob = self.bucket.get_blob(blob_name)
        return {
            "name": blob.name,
            "id": blob.id,
            "size": blob.size,
            "updated": blob.updated,
            "crc32c": decode_hash(blob.crc32c),
            "md5sum": decode_hash(blob.md5_hash),
        }

    def write_to_bigquery(self):
        """Writes dict object into BigQuery using Streaming Inserts"""
        dataset_id = "fixity_data"  # replace with your dataset ID
        table_id = "records"  # replace with your table ID
        table_ref = self.bigquery_client.dataset(dataset_id).table(table_id)
        table = self.bigquery_client.get_table(table_ref)  # API request
        rows_to_insert = list(
            map(
                lambda blob: (
                    self.bucket_name,
                    self.bag,
                    blob["name"],
                    blob["size"],
                    blob["updated"],
                    blob["crc32c"],
                    blob["md5sum"],
                    self.fixity_date,
                ),
                self.blobs,
            ))
        try:
            errors = self.bigquery_client.insert_rows(table, rows_to_insert)
            assert errors == []
            print(
                f"Wrote {len(rows_to_insert)} records to BigQuery for {self.bucket_name}:{self.bag}"
            )
        except AssertionError:
            raise AssertionError("Error with BigQuery streaming inserts")

    def write_and_upload_manifest(self):
        """Writes a manifest file into bag top-level directory"""
        manifest = ""
        for blob in self.blobs:
            manifest = manifest + blob["name"] + "\t" + blob["md5sum"] + "\n"

        manifest_blob = self.bucket.blob(f"{self.bag}/{FIXITY_MANIFEST_NAME}")
        manifest_blob.upload_from_string(manifest)
        print(f"Wrote manifest file for {self.bucket_name}:{self.bag}")
