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
"""Common functions for the various tests."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import mock


def get_mock_args():
    """Builds a default object representing parsed command line options."""
    args = mock.MagicMock()
    args.source_project = 'my-source-project'
    args.target_project = 'my-target-project'
    args.bucket_name = 'my-source-bucket'
    args.temp_bucket_name = None
    args.rename_bucket_to = None
    args.disable_bucket_lock = False
    args.lock_file_name = 'my-lock-file'
    args.gcp_source_project_service_account_key = './data/fake_source_keyjson'
    args.gcp_target_project_service_account_key = './data/fake_target_keyjson'

    args.location = 'conf_location'
    args.storage_class = 'conf_storage_class'
    args.skip_everything = False
    args.skip_acl = False
    args.skip_cors = False
    args.skip_default_obj_acl = False
    args.skip_iam = False
    args.skip_kms_key = False
    args.skip_labels = False
    args.skip_logging = False
    args.skip_lifecycle_rules = False
    args.skip_notifications = False
    args.skip_requester_pays = False
    args.skip_versioning = False
    
    args._properties={"iamConfiguration":{
            "uniformBucketLevelAccess":{"enabled":False}
        }}
    if args._properties["iamConfiguration"]["uniformBucketLevelAccess"]["enabled"]:
        args.acl.get_entities.return_value = None
        args.default_object_acl.get_entities.return_value = None
        args.is_uniform_bucket=True
    else:
        args.acl.get_entities.return_value = 'bucket_acl_entities'
        args.default_object_acl.get_entities.return_value = 'bucket_default_obj_acl_entities'
        args.is_uniform_bucket=False
    return args


def get_mock_source_bucket():
    """Builds a default object representing a GCS Bucket object."""
    bucket = mock.MagicMock()
    bucket.location = 'bucket_location'
    bucket.storage_class = 'bucket_storage_class'
    bucket.get_iam_policy.return_value = 'bucket_iam_policy'

    bucket.requester_pays = 'bucket_requester_pays'
    bucket.cors = 'bucket_cors'
    bucket.default_kms_key_name = 'projects/my-proj/locations/global/keyRings/abc/cryptoKeys/tester'
    bucket.labels = 'bucket_labels'
    bucket.lifecycle_rules = ['bucket_lifecycle_rules']
    bucket.get_logging.return_value = {
        'logBucket': 'bucket1',
        'logObjectPrefix': 'prefix'
    }
    bucket.versioning_enabled = 'bucket_versioning'
    bucket.list_notifications.return_value = ['bucket_notifications']
    bucket._properties={"iamConfiguration":{
            "uniformBucketLevelAccess":{"enabled":False}
        }}
    if bucket._properties["iamConfiguration"]["uniformBucketLevelAccess"]["enabled"]:
        bucket.acl.get_entities.return_value = None
        bucket.default_object_acl.get_entities.return_value = None
    else:
        bucket.acl.get_entities.return_value = 'bucket_acl_entities'
        bucket.default_object_acl.get_entities.return_value = 'bucket_default_obj_acl_entities'
   

    return bucket




