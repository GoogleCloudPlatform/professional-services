# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import os
import requests
import json
import sys
from datetime import datetime

PROJECT         = os.getenv('PROJECT')
REGION          = os.getenv('REGION')
SECRET          = os.getenv("SECRET")
BUCKET          = os.getenv('BUCKET')
SERVICE_ACCOUNT = os.getenv('SERVICE_ACCOUNT')
COLLECTION      = os.getenv('COLLECTION')
TOPIC           = os.getenv('TOPIC')
SALT            = os.getenv('SALT')

def trigger_dataflow(data, context):
	token_url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
	token_response = requests.get(token_url, headers = {'Metadata-Flavor': 'Google'}).json()
	token = token_response['access_token']

	url = f"https://dataflow.googleapis.com/v1b3/projects/{PROJECT}/templates:launch"
	params = {
		'gcsPath' : f'gs://{BUCKET}/Template/hashpipeline',
		'location': REGION
	}
	timestamp = datetime.now().strftime("%Y%m%d%H%M")
	data = {
		"jobName": f"hashpipeline-job-{timestamp}",
		"parameters": {
			"requirements_file": "requirements.txt",
			"project_id": PROJECT,
			"region": REGION,
			"staging_location": f"gs://{BUCKET}/stg",
			"input": f"gs://{data['bucket']}/{data['name']}",
			"topic": TOPIC,
			"secret_name": SECRET,
			"collection_name": COLLECTION,
			"salt": SALT,
		},
		"environment" : {
			"tempLocation": f"gs://{BUCKET}/tmp",
			"zone": f'{REGION}-b',
			"serviceAccountEmail": SERVICE_ACCOUNT
		}
	}
	resp = requests.post(url=url, data=json.dumps(data), params=params, headers = {'Authorization': f'Bearer {token}'})
	print(resp.text)

	return resp.text
