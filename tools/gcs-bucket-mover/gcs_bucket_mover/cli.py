#!/usr/bin/env python2
# Copyright 2018 Google LLC. All rights reserved. Licensed under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.
#
# Any software provided by Google hereunder is distributed "AS IS", WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, and is not intended for production use.
"""Parses the command line and starts the script"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import textwrap

import configargparse
import yaml

from gcs_bucket_mover import bucket_mover_service
from gcs_bucket_mover import bucket_mover_tester
from gcs_bucket_mover import configuration


def _get_parsed_args():
    """Parses command line arguments and the config file.

    Order of precedence for config values is: command line > config file values > defaults

    Returns:
        A "Namespace" object. See argparse.ArgumentParser.parse_args() for more details.
    """

    parser = configargparse.ArgumentParser(
        description=
        'Moves a GCS bucket from one project to another, along with all objects and optionally'
        ' copying all other bucket settings.',
        config_file_parser_class=configargparse.YAMLConfigFileParser,
        formatter_class=configargparse.RawTextHelpFormatter)
    parser.add_argument(
        '--config',
        is_config_file=True,
        help='The path to the local config file')

    parser.add_argument(
        'bucket_name', help='The name of the bucket to be moved.')
    parser.add_argument(
        'source_project',
        help='The project id that the bucket is currently in.')
    parser.add_argument(
        'target_project',
        help='The project id that the bucket will be moved to.')
    parser.add_argument(
        '--gcp_source_project_service_account_key',
        help=
        'The location on disk for service account key json file from the source project'
    )
    parser.add_argument(
        '--gcp_target_project_service_account_key',
        help=
        'The location on disk for service account key json file from the target project'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help=textwrap.dedent('''\
        This will run a test of the tool to ensure all permissions are set up correctly and
        buckets can be moved between the two projects, using a randomly generated bucket.
        A fake bucket name will still need to be specified.'''))
    parser.add_argument(
        '--useBucketLock',
        action='store_true',
        help=textwrap.dedent('''\
        Enabling this option will mean that before the mover makes any changes, it will look for the lock file specified
        in LOCK_FILE_NAME (in config.sh). If it exists in the source bucket, the mover will exit without any operations.
        If it does not exist, the permissions on the source project will be updated so that nobody is allowed to write
        to it, then the mover will move the buckets before finally restoring write access on the new bucket in the
        target project.'''))
    parser.add_argument(
        '--lock_file_name', help='The name of the lock file in the bucket')
    parser.add_argument(
        '--tempBucketName',
        help='The temporary bucket name to use in the target project.')
    parser.add_argument(
        '--location',
        help='Specify a different location for the target bucket.')
    parser.add_argument(
        '--storageClass',
        choices=[
            'MULTI_REGIONAL', 'REGIONAL', 'STANDARD', 'NEARLINE', 'COLDLINE',
            'DURABLE_REDUCED_AVAILABILITY'
        ],
        help='Specify a different storage class for the target bucket.')
    parser.add_argument(
        '--skipEverything',
        action='store_true',
        help=
        'Only copies the bucket\'s storage class and location. Equivalent to setting every other'
        ' --skip parameter to True.')
    parser.add_argument(
        '--skipAcl',
        action='store_true',
        help='Don\'t replicate the ACLs from the source bucket.')
    parser.add_argument(
        '--skipCors',
        action='store_true',
        help='Don\'t copy the CORS settings from the source bucket.')
    parser.add_argument(
        '--skipDefaultObjectAcl',
        action='store_true',
        help='Don\'t copy the Default Object ACL from the source bucket.')
    parser.add_argument(
        '--skipIam',
        action='store_true',
        help='Don\'t replicate the IAM policies from the source bucket.')
    parser.add_argument(
        '--skipKmsKey',
        action='store_true',
        help='Don\'t copy the Default KMS Key from the source bucket.')
    parser.add_argument(
        '--skipLabels',
        action='store_true',
        help='Don\'t copy the Labels from the source bucket.')
    parser.add_argument(
        '--skipLogging',
        action='store_true',
        help='Don\'t copy the Logging settings from the source bucket.')
    parser.add_argument(
        '--skipLifecycleRules',
        action='store_true',
        help='Don\'t copy the Lifecycle Rules from the source bucket.')
    parser.add_argument(
        '--skipNotifications',
        action='store_true',
        help=
        'Don\'t copy the Cloud Pub/Sub notification setting from the source bucket.'
    )
    parser.add_argument(
        '--skipRequesterPays',
        action='store_true',
        help='Don\'t copy the Requester Pays setting from the source bucket.')
    parser.add_argument(
        '--skipVersioning',
        action='store_true',
        help='Don\'t copy the Versioning setting from the source bucket.')

    # Variables set in the config file for running different bucket tests with the --test option
    parser.add_argument(
        '--test_bucket_location',
        help='The location to create the test bucket in')
    parser.add_argument(
        '--test_default_kms_key_name',
        help='A custom KSM key to assign to the test bucket')
    parser.add_argument(
        '--test_email_for_iam',
        help='An IAM email to use for testing permissions on the test bucket')
    parser.add_argument(
        '--test_logging_bucket',
        help='An existing bucket to set up logging on the test bucket')
    parser.add_argument(
        '--test_logging_prefix',
        help='A prefix to use for the logging on the test bucket')
    parser.add_argument(
        '--test_storage_class',
        help='The storage class to use for the test bucket')
    parser.add_argument(
        '--test_topic_name',
        help='A topic name to set up a notification for on the test bucket')

    return parser.parse_args()


def _parse_yaml_file(path):
    """Load and parse local YAML file

    Args:
        path: either a local file system path or a GCS path

    Returns:
        a Python object representing the parsed YAML data
    """

    with open(path, 'r') as stream:
        try:
            return yaml.safe_load(stream)
        except yaml.YAMLError as ex:
            print(ex)


def main():
    """Get passed in args and run either a test run or an actual move"""
    parsed_args = _get_parsed_args()

    # Load the config values set in the config file and create the storage clients.
    config = configuration.Configuration.from_conf(parsed_args)

    # Create the cloud logging client that will be passed to all other modules.
    cloud_logger = config.target_logging_client.logger('gcs-bucket-mover')  # pylint: disable=no-member

    if parsed_args.test:
        test_bucket_name = bucket_mover_tester.set_up_test_bucket(
            config, parsed_args)
        config.bucket_name = test_bucket_name

    bucket_mover_service.move_bucket(config, parsed_args, cloud_logger)
