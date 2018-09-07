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
"""Creates sample IAP client."""


def GenerateConfig(context):
  """Generates list of GCP resources required for IAP web client."""
  
  resources= [{
    'name': 'iap-client-vm',
    'type': 'compute.v1.instance',
    'properties': {
      'zone': context.properties['zone'],
      'machineType': 'zones/' + context.properties[
        'zone'] + '/machineTypes/n1-standard-1',
      'disks': [{
        'deviceName': 'boot',
        'type': 'PERSISTENT',
        'boot': True,
        'autoDelete': True,
        'initializeParams': {
          'sourceImage': 'projects/debian-cloud/global/images/family/debian-8',
        }
      }],
      'networkInterfaces': [{
        'network': 'global/networks/default',
        # Access Config required to give the instance a public IP address.
        'accessConfigs': [{
          'name': 'External NAT',
          'type': 'ONE_TO_ONE_NAT',
        }],
      }],
      'serviceAccounts': [{
        'email': context.env[
                   'project_number'] + '-compute@developer.gserviceaccount.com',
        'scopes': ['https://www.googleapis.com/auth/iam']
      }],
      'metadata': {
        'items': [{
          'key': 'startup-script',
          'value': 'apt-get update;'
                   'apt-get install python-pip build-essential libssl-dev libffi-dev python-dev -y;'
                   'wget https://raw.githubusercontent.com/GoogleCloudPlatform/python-docs-samples/master/iap/requirements.txt;'
                   'wget https://raw.githubusercontent.com/GoogleCloudPlatform/python-docs-samples/master/iap/make_iap_request.py? -O /home/make_iap_request.py;'
                   'sed -i "s/url,$/url, verify=False,/" /home/make_iap_request.py;'
                   'wget https://raw.githubusercontent.com/GoogleCloudPlatform/professional-services/danieldeleo-identity-aware-proxy/infrastructure/identity-aware-proxy/iap_authenticated_client.py? -O /home/iap_authenticated_client.py;'
                   'pip install virtualenv;'
                   'virtualenv /home/iap_client_env;'
                   '/home/iap_client_env/bin/pip install -r requirements.txt;'
        }]
      }
    }
  }]
  return {'resources':resources}
