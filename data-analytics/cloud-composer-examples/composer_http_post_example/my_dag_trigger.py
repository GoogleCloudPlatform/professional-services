# Copyright 2017 Google Inc. All Rights Reserved.
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

"""Example making GET request to IAP resource."""

import argparse
from datetime import datetime
import json
import make_iap_request as iap
import os


def main():

    """This main function calls the make_iap_request function which is defined
     at
     https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/make_iap_request.py
     and then prints the output of the function. The make_iap_request function
     demonstrates how to authenticate to Identity-Aware Proxy using a service
     account.

     Returns:
      The page body, or raises an exception if the page couldn't be retrieved.

    """

    bucket = 'jferriero-bucket'

    parser = argparse.ArgumentParser()
    parser.add_argument("--url", dest='url', required=False,
                        help="The url of a resource sitting behind identity-aware proxy.",
                        default='https://i07f6d886b43cd8fb-tp.appspot.com/api/experimental/dags/average-speed/dag_runs')
    parser.add_argument("--iapClientId", dest='iapClientId', required=False,
                        help="The Client ID of the IAP OAuth Client.",
                        default='699819593920-caef1ukpvtdpsqhb3rs39de850nhbl09.apps.googleusercontent.com')
    parser.add_argument("--raw_path", dest='raw_path', required=False, help="GCS path to raw files.",
                        default='gs://jferriero-bucket/cloud-composer-lab/raw-test/')
    args = parser.parse_args()

    # Force trailing slash because logic in avearge-speed DAG expects it this way
    raw_path = args.raw_path if args.raw_path[-1] == '/' else args.raw_path + '/'

    # This transformed path is relative to the bucket Variable in the Airflow environment.
    # Note, the gs://<bucket> prefix is stripped because the GoogleCloudStorageToBigQueryOperator
    #  expects the source_objects as relative to the bucket param
    transformed_path = raw_path.replace('/raw-', '/transformed-').replace('gs://'
                                                                          + bucket + '/', '')

    failed_path = raw_path.replace('/raw-', '/failed-').replace('gs://' + bucket + '/', '')

    # Note, we need to remove the trailing slash because of how the the spark saveAsTextFile
    # method works.
    transformed_path = transformed_path[:-1] if transformed_path[-1] == '/' else transformed_path

    # Place parameters to be passed as part of the dag_run triggered by this POST here.
    # In this example we will pass the path where the raw files are  and the path where we should
    # place the transformed files.
    conf = {
        'raw_path': raw_path,
        'transformed_path': transformed_path,
        'failed_path': failed_path
    }

    # The api signature requires a unique run_id
    payload = {
        'run_id': 'post-triggered-run-%s' % datetime.now().strftime('%Y%m%d%H%M%s'),
        'conf': json.dumps(conf)
    }

    return iap.make_iap_request(args.url, args.iapClientId, method='POST',
                                data=json.dumps(payload))


if __name__ == "__main__":
    main()
