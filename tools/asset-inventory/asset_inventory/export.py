#!/usr/bin/env python
#
# Copyright 2019 Google Inc.
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

"""Invokes Asset Inventory API to export resources, and IAM policies.

For more information on the Cloud Asset Inventory API see:
https://cloud.google.com/resource-manager/docs/cloud-asset-inventory/overview

"""

from __future__ import print_function

import argparse
import logging
import pprint

from concurrent import futures

from google.cloud.exceptions import GoogleCloudError
from google.cloud import asset_v1


class Clients(object):
    """Holds API client objects."""

    _cloudasset = None

    @classmethod
    def cloudasset(cls):
        if cls._cloudasset:
            return cls._cloudasset
        cls._cloudasset = asset_v1.AssetServiceClient()
        return cls._cloudasset


def export_to_gcs(parent, gcs_destination, content_type, asset_types):
    """Exports assets to GCS destination.

    Invoke either the cloudasset.organizations.exportAssets or
    cloudasset.projects.exportAssets method depending on if parent is a project
    or organization.
    Args:
        parent: Either `project/<project-id>` or `organization/<organization#>`.
        gcs_destination: GCS uri to export to.
        content_type: Either `RESOURCE` or `IAM_POLICY` or
        None/`CONTENT_TYPE_UNSPECIFIED` for just asset names.
        asset_types: None for all asset types or a list of asset names to
        export.
    Returns:
        The result of the successfully completed export operation.
    """
    output_config = asset_v1.types.OutputConfig()
    output_config.gcs_destination.uri = gcs_destination
    operation = Clients.cloudasset().export_assets(
        {'parent': parent,
         'output_config': output_config,
         'content_type': content_type,
         'asset_types': asset_types})
    return operation.result()


def export_to_gcs_content_types(parent, gcs_destination, content_types,
                                asset_types):
    """Export each asset type into a GCS object with the GCS prefix.

    Will call `export_to_gcs concurrently` to perform an export, once for each
    content_type.

    Args:
        parent: Project id or organization number.
        gcs_destination: GCS object prefix to export to (gs://bucket/prefix)
        content_types: List of [RESOURCE, NAME, IAM_POLICY, NAME] to export.
        Defaults to [RESOURCE, NAME, IAM_POLICY]
        asset_types: List of asset_types to export. Supply `None` to get
        everything.
    Returns:
        A dict of content_types and export result objects.

    """

    logging.info('performing export from %s to %s of content_types %s',
                 parent, gcs_destination, str(content_types))
    if asset_types == ['*']:
        asset_types = None
    if content_types is None:
        content_types = ['RESOURCE', 'IAM_POLICY']
    with futures.ThreadPoolExecutor(max_workers=3) as executor:
        export_futures = {
            executor.submit(export_to_gcs, parent, '{}/{}.json'.format(
                gcs_destination, content_type), content_type, asset_types):
            content_type
            for content_type in content_types
        }
    operation_results = {}
    for future in futures.as_completed(export_futures):
        try:
            content_type = export_futures[future]
            operation_results[content_type] = future.result()
        except GoogleCloudError:
            content_type = export_futures[future]
            logging.exception('Error exporting %s', content_type)
            raise
    logging.info('export results: %s', pprint.pformat(operation_results))
    return operation_results


def add_argparse_args(ap, required=False):
    """Configure the `argparse.ArgumentParser`."""
    ap.formatter_class = argparse.RawTextHelpFormatter
    # pylint: disable=line-too-long
    ap.description = (
        'Exports google cloud organization or project assets '
        'to a gcs bucket or bigquery. See:\n'
        'https://cloud.google.com/resource-manager/docs/cloud-asset-inventory/overview\n\n'
        'This MUST be run with a service account owned by a project with the '
        'Cloud Asset API enabled. The gcloud generated user credentials'
        ' do not work. This requires:\n\n'
        '1. Enable the Cloud Asset Inventory API on a project ('
        'https://console.cloud.google.com/apis/api/cloudasset.googleapis.com/overview)\n'
        '  2. Create a service account owned by this project\n'
        '  3. Give the service account roles/cloudasset.viewer at the organization layer\n'
        '  4. Run on a GCE instance started with this service account,\n'
        '   or download the private key and set GOOGLE_APPLICATION_CREDENTIALS to the file name\n'
        '  5. Run this command.\n\n'
        'If the GCS bucket being written to is owned by a different project then'
        ' the project that you enabled the API on, then you must also grant the'
        ' "service-<project-id>@gcp-sa-cloudasset.iam.gserviceaccount.com" account'
        ' objectAdmin privileges to the bucket:\n'
        'gsutil iam ch serviceAccount:service-<project-id>@gcp-sa-cloudasset.iam.gserviceaccount.com:objectAdmin '
        'gs://<bucket>\n'
        '\n\n')
    ap.add_argument(
        '--parent',
        required=required,
        help=('Organization number (organizations/123)'
              'or project id (projects/id) or number (projects/123).'))

    ap.add_argument(
        '--gcs-destination', help='URL of the gcs file to write to.',
        required=required)

    def content_types_argument(string):
        valid_content_types = [
            'CONTENT_TYPE_UNSPECIFIED', 'RESOURCE', 'IAM_POLICY'
        ]
        content_types = [x.strip() for x in string.split(',')]
        for content_type in content_types:
            if content_type not in valid_content_types:
                raise argparse.ArgumentTypeError(
                    'invalid content_type {}'.format(content_type))
        return content_types

    ap.add_argument(
        '--content-types',
        help=('Type content to output for each asset a comma seperated list '
              ' of `CONTENT_TYPE_UNSPECIFIED`, `RESOURCE`, `IAM_POLICY` '
              'defaults to `RESOURCE, IAM_POLICY`.'),
        type=content_types_argument,
        default='RESOURCE, IAM_POLICY',
        nargs='?')

    ap.add_argument(
        '--asset-types',
        help=('Comma separated list of asset types to export such as '
              '"google.compute.Firewall,google.compute.HealthCheck"'
              ' default is `*` for everything'),
        type=lambda x: [y.strip() for y in x.split(',')],
        nargs='?')


def main():
    logging.basicConfig()
    logging.getLogger().setLevel(logging.INFO)
    ap = argparse.ArgumentParser(formatter_class=argparse.RawTextHelpFormatter)
    add_argparse_args(ap, required=True)
    args = ap.parse_args()
    logging.info('Exporting assets.')
    export_result = export_to_gcs_content_types(
        args.parent,
        args.gcs_destination,
        args.content_types,
        asset_types=args.asset_types.split(',') if args.asset_types else None)
    logging.info('Export results %s.', pprint.pformat(export_result))


if __name__ == '__main__':
    main()
