# Copyright 2020 Google Inc. All rights reserved.
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

import argparse
import requests
import time

from datetime import datetime
from functools import partial
from concurrent.futures import ThreadPoolExecutor


""" 
Send Data is intended to be an easy to use tool for manual
and E2E testing.  The Webhook Application is mostly infrastructure,
to ensure quality it's important to use E2E tests regularly and 
against a wide array of possible data.

To send data to a deployed pipline:
export PROJECT_ID=<my-project>
python send_data.py
"""

WEBHOOK_EXAMPLE = {
  "responseBody": "",
  "method": "GET",
  "url": "/stuff",
  "account": "company-prod",
  "host": "app.company.com",
  "remoteAddress": "0.0.0.0",
  "statusCode": 304,
  "responseTime": 50.056793,
  "requestBody": {},
  "isBooleanRequest": True,
  "record_data_ex": {
      "value": "embedded",
      "from": "-10min",
  },
  "array_data_ex": ["value", "value2"],
  "_metadata_dataset": "webhook",
  "_metadata_table": "webhook"
}

def get_row():
    """ Return clean example row to send """
    row = WEBHOOK_EXAMPLE
    row["time"] = str(datetime.now())

    return row

def _get_app_domain(project_id):
    """ Return String App Engine Domain to send data to """
    app_domain = "https://{project_id}.appspot.com".format(project_id=project_id)

    return app_domain

def send_request(request_size, project_id=None):
    # Send batches of data to speed up EPS
    app_domain = _get_app_domain(project_id)
    data = [get_row() for i in range(request_size)]
    requests.post(app_domain, json=data)

def generate_traffic(project_id, batches=10, pool_size=10, request_size=200, batch_size=100, batch_sleep_secs=1):
    """ Send Data at App Engine Endpoint
        
        :param project_id: GCP Project ID
        :param batches: Number of batches to send (0 sends in infinite loop)
        :param pool_size: Number of concurrent threads to use
        :param request_size: Number of events per request to batch
        :param batch_size: Number of requests per batch
        :param batch_sleep_secs: Seconds to sleep between batches
    """
    print("Scale Testing")
    with ThreadPoolExecutor(pool_size) as executor:
        if batches:
            total_events = batches * batch_size * request_size
            print("Running for %d" % total_events)
            for r in range(batches):

                executor.map(
                    partial(send_request, project_id=project_id),
                    [request_size for i in range(batch_size)])
                time.sleep(batch_sleep_secs)
        else:
            while True:
                executor.map(
                    partial(send_request, project_id=project_id),
                    [request_size for i in range(batch_size)])
                time.sleep(batch_sleep_secs)

def configure_arg_parser():
    parser = argparse.ArgumentParser()
    
    parser.add_argument("--project-id", "-p",
                        help="GCP Project ID")
    parser.add_argument("--pool-size", "-ps", default=100,
                        help="Number of concurrent processes used")
    parser.add_argument("--request-size", "-r", default=10,
                        help="Number of events per request to batch")
    parser.add_argument("--batch-size", "-bs", default=100,
                        help="Number of requests per batch")
    parser.add_argument("--batches", "-b", default=1,
                        help="Number of batches to send (0 sends in infinite loop)")
    parser.add_argument("--batch-sleep-secs", "-s", default=0,
                        help="Seconds to sleep between batches")

    return parser.parse_args()

def main():
    args = configure_arg_parser()
    generate_traffic(project_id=args.project_id,
                     pool_size=int(args.pool_size),
                     request_size=int(args.request_size),
                     batch_size=int(args.batch_size),
                     batches=int(args.batches),
                     batch_sleep_secs=int(args.batch_sleep_secs))

if __name__ == "__main__":
    main()
