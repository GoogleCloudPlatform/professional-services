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

import json
import os
import requests
import time

from datetime import datetime
from multiprocessing import Pool

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

def _get_app_domain():
    """ Return String App Engine Domain to send data to """
    project_id = os.environ["PROJECT_ID"]
    app_domain = "https://{project_id}.appspot.com".format(project_id=project_id)

    return app_domain

def send_request(request_size):
    # Send batches of data to speed up EPS
    app_domain = _get_app_domain()
    data = [get_row() for i in range(request_size)]
    requests.post(app_domain, json=data)

def test_scaling(batches=10, pool_size=10, request_size=200, batch_size=100, batch_sleep_secs=1):
    """ Send Data at App Engine Endpoint
        
        :param batches: Number of batches to send (0 sends in infinite loop)
        :param pool_size: Number of concurrent threads to use
        :param request_size: Number of events per request to batch
        :param batch_size: Number of events per request to batch
        :param batch_sleep_secs: Seconds to sleep between batches
    """
    print("Scale Testing")
    pool = Pool(processes=pool_size)
    if batches:
        total_events = batches * batch_size * request_size
        print("Running for %d" % total_events)
        for r in range(batches):
            pool.map(send_request, [request_size for i in range(batch_size)])
            time.sleep(batch_sleep_secs)
    else:
        while True:
            pool.map(send_request, [request_size for i in range(batch_size)])
            time.sleep(batch_sleep_secs)

def main():
    test_scaling(pool_size=100, request_size=10, batch_size=1, batches=1, batch_sleep_secs=0)

if __name__ == "__main__":
    main()
