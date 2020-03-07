# Copyright 2019 Google LLC.
# This software is provided as-is, without warranty or representation
# for any use or purpose.
# Your use of it is subject to your agreement with Google.

# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import flask
import json
import logging
import pprint
import tempfile
from dataclasses import dataclass, field
from functools import partial
from typing import Callable, Dict, List, Tuple

from google.cloud import storage

# Handle relative import for CLI invocations of this tool.
from cdap.client import CDAPClient

# Note: This is a naive approach that creates one large in memory object to
# store all lineage info. This will not scale to many, many pipelines over
# a long time frame. This could be easily be refactored to dump to nd-json
# on disk and load to BigQuery to avoid OOM if necessary. This approach
# was taken in the name of simplicity of example and avoiding premature
# optimization as the target use case is a daily export.
"""HTPP Clound Function entry point to export all CDAP Lineage to GCS for a 
given time period."""


def handle_http(request: flask.Request):
    """This function handles a request with JSON Payload of the following schema:
    
    {
        "project": "foo",
        "apiEndpoint": "https://example-cdf-host.datafusion.googleusercontent.com/api/"
        "bucket": "bar",
        "startTimestamp": "now-1d",
        "endTimestamp": "now"
    }
    

    Args:
        request (flask.Request)
    Returns:
        A response payload with the exported nd json object self links for datasets and streams
    """
    request_json = request.get_json()

    required_fields = {
        'project', 'bucket', 'apiEndpoint', 'startTimestamp', 'endTimestamp'
    }

    if not required_fields <= request_json.keys():
        return (
            f'Bad Request: missing required fields: {required_fields - request_json.keys()}',
            400)

    print(f'Exporting CDAP Lineage from {request_json.get("apiEndpoint")} ' +
          f'for time period: {request_json.get("startTimestamp")} to ' +
          f'{request_json.get("endTimestamp")}')
    datasets, streams = export_all_cdap_lineage_to_gcs(
        request_json.get('project'), request_json.get('bucket'),
        request_json.get('apiEndpoint'), request_json.get('startTimestamp'),
        request_json.get('endTimestamp'))

    print(
        f'uploaded dataset lineage to {datasets} and stream lineage to {streams}'
    )
    return (json.dumps({'datasets': datasets, 'streams': streams}), 200)


@dataclass
class LineageScraper:
    """This class scrapes the CDAP Lineage API.
    It will return a list of a List of Namespace object
    
    Attributes:
        client (CDAPClient): client for making request to CDAP API
        start_ts (str): start timestamp to scrape lineage for.
        end_ts (str): end timestamp to scrape lineage for.
    """
    client: CDAPClient
    start_ts: str
    end_ts: str
    _start_timestamp = None
    _end_timestamp = None
    log = logging.getLogger('scrape_lineage.LineageScraper')

    def get_namespace_lineages(self):
        namespaces = list(map(NamespaceLineage, self.client.list_namespaces()))
        # TODO add paralleism to improve performance if necessary
        for namespace in namespaces:
            self.log.info(f'fetching dataset lineages for {namespace.name}')
            _get_lineage = partial(self.client.fetch_lineage,
                                   namespace.name,
                                   start_ts=self.start_ts,
                                   end_ts=self.end_ts)
            namespace.dataset_lineages = [
                _get_lineage('datasets', dataset)
                for dataset in self.client.list_datasets(namespace.name)
            ]
            self.log.info(f'fetching stream lineages for {namespace.name}')
            namespace.stream_lineages = [
                _get_lineage('streams', stream)
                for dataset in self.client.list_streams(namespace.name)
            ]
        return namespaces


@dataclass
class NamespaceLineage:
    """Class to represent CDAP Namespace.

    Contains a list of Datasets and Streams
    """
    name: str
    # This assumes that all the lineage for a time period won't cause OOM.
    dataset_lineages: List[Dict] = field(default_factory=list)
    stream_lineages: List[Dict] = field(default_factory=list)


def export_all_cdap_lineage_to_gcs(
        project: str, bucket_name: str, api_endpoint: str, start_ts: str,
        end_ts: str) -> Tuple[storage.Blob, storage.Blob]:
    """Uploads all scraped CDAP lineage for a time period to a GCS bucket.

    The GCS bucket will have the following structure
    gs://{bucket}/cdap_lineage/datasets/start={start_ts}/end={end_ts}/lineage.json
    gs://{bucket}/cdap_lineage/streams/start={start_ts}/end={end_ts}/lineage.json

    Args: 
        TODO
    """

    cdap_client = CDAPClient(project, api_endpoint)
    storage_client = storage.Client(project=project)
    bucket = storage_client.bucket(bucket_name)

    scraper = LineageScraper(cdap_client, start_ts, end_ts)
    namespaces = scraper.get_namespace_lineages()

    datasets_blob_link = ""
    streams_blob_link = ""
    for namespace in namespaces:
        if namespace.dataset_lineages:
            start_timestamp = namespace.dataset_lineages[0].get("start")
            end_timestamp = namespace.dataset_lineages[0].get("end")
            datasets_blob = bucket.blob(
                f'cdap_lineage/{namespace.name}/datasets/start={start_timestamp}/end={end_timestamp}/cdap_lineage.ndjson'
            )
            datasets_blob.upload_from_string('\n'.join(
                map(json.dumps, namespace.dataset_lineages)))
            datasets_blob_link = datasets_blob.self_link
        else:
            print(
                f'no datasets lineage found for time period: {start_ts} to {end_ts}'
            )

        if namespace.stream_lineages:
            start_timestamp = namespace.stream_lineages[0].get("start")
            end_timestamp = namespace.stream_lineages[0].get("end")
            streams_blob = bucket.blob(
                f'cdap_lineage/{namespace.name}/streams/start={start_timestamp}/end={end_timestamp}/cdap_lineage.ndjson'
            )
            streams_blob.upload_from_string('\n'.join(
                map(json.dumps, namespace.stream_lineages)))
            streams_blob_link = streams_blob.self_link
        else:
            print(
                f'no steams lineage found for time period: {start_ts} to {end_ts}'
            )
        return (datasets_blob_link, streams_blob_link)


def main():
    """Main method for CLI invocations of this tool."""
    args = parse_lineage_scraper_args()
    logger = logging.getLogger('cdap_lineage_scraper')
    logging.basicConfig(level=args.log)
    export_all_cdap_lineage_to_gcs(args.project, args.bucket,
                                   args.api_endpoint, args.start_ts,
                                   args.end_ts)


def parse_lineage_scraper_args() -> argparse.Namespace:
    """Reads CLI arguments for local invocation of this utility."""
    parser = argparse.ArgumentParser(
        formatter_class=argparse.RawDescriptionHelpFormatter,
        description='Export CDAP Lineage information to GCS bucket',
        epilog="""

        Example Usage: 

        export  PROJECT='your-gcp-project'
        export  BUCKET='cdap_lineage_export_bucket'
        export  REGION='us-central1'
        export  INSTANCE_NAME='cdf-instance'
        export  CDAP_API_ENDPOINT=$(gcloud beta data-fusion instances describe --location=${REGION} --format='value(apiEndpoint)' ${INSTANCE_NAME})

        python3 scrape_lineage.py \
          --api_endpoint='${CDAP_API_ENDPOINT}' \
          --project='${PROJECT}' \
          --bucket=${BUCKET}

        """)
    parser.add_argument('--project',
                        '-p',
                        help='GCP Project ID',
                        required=True,
                        dest='project')
    parser.add_argument(
        '--api_endpoint',
        '-a',
        help="""CDAP API endpoint. For Data Fusion this can be retrieved with:
             gcloud beta data-fusion instances describe --location=${REGION} \
               --format='value(apiEndpoint)' ${INSTANCE_NAME}""",
        required=True,
        dest='api_endpoint')

    parser.add_argument('--bucket',
                        '-b',
                        help='Destination GCS Bucket for lineage loading',
                        required=True,
                        dest='bucket')

    parser.add_argument(
        '--start_ts',
        '-s',
        help="""Starting time-stamp of lineage (inclusive), in seconds. 
        Supports now, now-1h, etc. syntax""",
        default='now-1d',
        dest='start_ts')

    parser.add_argument(
        '--end_ts',
        '-e',
        help="""Ending time-stamp of lineage (inclusive), in seconds. 
        Supports now, now-1h, etc. syntax""",
        default='now',
        dest='end_ts')

    parser.add_argument('--log',
                        help='Logging level, defaults to INFO',
                        choices=['ERROR', 'INFO', 'WARN', 'DEBUG'],
                        type=str.upper,
                        required=False,
                        dest='log',
                        default='INFO')

    return parser.parse_args()


if __name__ == '__main__':
    main()
