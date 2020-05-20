# Copyright 2016 Google Inc. All rights reserved.
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

import requests
import time
import os

from multiprocessing import Pool, TimeoutError
from datetime import datetime


project_id = os.environ["PROJECT_ID"]
app_domain = "https://{project_id}.appspot.com".format(project_id=project_id)
# app_domain = "https://webhook-endpoint-dot-{project_id}.uc.r.appspot.com".format(project_id=project_id)

# Data Examples
WEBHOOK_EXAMPLE = {
  "method": "GET",
  "url": "/alooma-prod/rest/metrics",
  "queryparams": {"metrics": "INPUT_INCOMING","from": "-10min","resolution": "10sec","inputLabel": "3ab43dsgsdgsfgs3-4d6dsf1b93a"},
  "user": {"id": 314,"email": "test@alooma.com","identity_provider_id": None,"is_admin": None,
  "accounts": [
      {
        "id": 12325,
        "account_name": "alooma",
        "company_name": None,
        "partner_id": None,
        "_pivot_user_id": 4153,
        "_pivot_account_id": 1875
      },
      {
        "id": 2041,
        "account_name": "alooma-prod",
        "company_name": None,
        "partner_id": None,
        "_pivot_user_id": 4153,
        "_pivot_account_id": 2041
      }
    ]
  },
  "statusCode": 304,
  "account": "alooma-prod",
  "host": "app.alooma.com",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/24523Safari/537.36",
  "responseTime": 50.056793,
  "requestBody": {},
  "fullUrl": "http://app.alooma.com/alooma-prod/rest/metrics?metrics=INPUT_INCOMING&from=-10min&resolution=10sec&inputLabel=332423dfssdd678ae1b93a",
  "responseBody": "",
  "remoteAddress": "23.18.142.69",
  "_metadata_dataset": "alooma",
  "_metadata_table": "log_test"
}
import json
for field in WEBHOOK_EXAMPLE:
    if isinstance(WEBHOOK_EXAMPLE[field], dict) or isinstance(WEBHOOK_EXAMPLE[field], list):
      WEBHOOK_EXAMPLE[field] = json.dumps(WEBHOOK_EXAMPLE[field])

def get_row():
    row = WEBHOOK_EXAMPLE
    row["time"] = str(datetime.now())

    return row

def test_failure():
    print("Test 1: Expect Error")
    res = requests.post(app_domain)
    print(res.content)

def test_simple_result():
    print("Test 2: Expect Simple Result")
    data = get_row()
    res = requests.post(app_domain, json=data)
    print(res.content)

def test_complex_result():
    print("Test 3: Expect Complex Result")
    data = [get_row() for _ in range(2)]
    res = requests.post(app_domain, json=data)
    print(res.content)


# Scale Test
def send_request(request_size):
    # Send batches of data to speed up EPS
    data = [get_row() for i in range(request_size)]
    res = requests.post(app_domain, json=data)

def test_scaling(batches=10, pool_size=10, request_size=200, batch_size=100, batch_sleep_secs=1):
    """ Send Data at App Engine Endpoint
        
        :param batches: Number of batches to send (0 sends in infinite loop)
        :param pool_size: Number of concurrent threads to use
        :param request_size: Number of events per request to batch
        :param batch_size: Number of events per request to batch
        :param batch_sleep_secs: Seconds to sleep between batches
    """
    print("Test 4: Scale Testing")
    pool = Pool(processes=pool_size)
    if batches:
        total_events = batches * batch_size * request_size
        print("Running for %d" % total_events)
        for r in range(batches):
            p_res = pool.map(send_request, [request_size for i in range(batch_size)])
            time.sleep(batch_sleep_secs)
    else:
        while True:
            p_res = pool.map(send_request, [request_size for i in range(batch_size)])
            time.sleep(batch_sleep_secs)

def main():
    test_failure()
    test_simple_result()
    test_complex_result()

    test_scaling(pool_size=100, request_size=500, batch_size=100, batches=1, batch_sleep_secs=0)

if __name__ == "__main__":
    main()
