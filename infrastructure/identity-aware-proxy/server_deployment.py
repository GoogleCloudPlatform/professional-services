# Copyright 2016 Google Inc. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Creates sample IAP Server"""

def GenerateConfig(context):
  """Generate configuration."""
  resources=[]

  # Creates an instance template which will be used by an instance group manager
  # to create and auto-scale VMs. The startup-script metadata property shows
  # the script that runs on the VM whenever it is created.
  resources.append({
    'name': 'iap-server-instance-template',
    'type': 'compute.v1.instanceTemplate',
    'properties': {
      'properties': {
        # zone specified in server_deployment.yaml file
        'zone': context.properties['zone'],
        'machineType': 'n1-standard-1',
        'disks': [{
          'deviceName': 'boot',
          'type': 'PERSISTENT',
          'boot': True,
          'autoDelete': True,
          'initializeParams': {
            'sourceImage': 'projects/debian-cloud/global/images/family/debian-8'
          }
        }],
        'networkInterfaces': [{
          'network': 'global/networks/default',
          # Access Config required to give the instance a public IP address
          'accessConfigs': [{
            'name': 'External NAT',
            'type': 'ONE_TO_ONE_NAT'
          }],
        }],
        'serviceAccounts': [{
          # Use the default compute engine service account that is auto-created
          # for every project upon creation
          'email': context.env['project_number'] + '-compute@developer.gserviceaccount.com',
          # compute.readonly scope is necessary in order to programmatically
          # retrieve the backend service ID.
          'scopes': ['https://www.googleapis.com/auth/compute.readonly']
        }],
        'metadata': {
          'items':[{
            'key': 'startup-script',
            # startup script below will download necessary files from github to
            # run a simple python web server. The web server will verify all
            # requests by validating the X-Goog-IAP-JWT-Assertion header value.1
            'value': 'wget https://github.com/GoogleCloudPlatform/python-docs-samples/raw/master/iap/validate_jwt.py? -O /home/validate_jwt.py;'
                     'wget https://github.com/GoogleCloudPlatform/professional-services/raw/danieldeleo-identity-aware-proxy/infrastructure/identity-aware-proxy/iap_validating_server.py? -O /home/iap_validating_server.py;'
                     'wget https://raw.githubusercontent.com/GoogleCloudPlatform/python-docs-samples/master/iap/requirements.txt;'
                     'apt-get update;'
                     'apt-get install python-pip build-essential libssl-dev libffi-dev python-dev -y;'
                     'pip install virtualenv;'
                     'virtualenv /home/iap_server_env;'
                     'source /home/iap_server_env/bin/activate;'
                     'pip install -r requirements.txt;'
                     'pip install --upgrade google-api-python-client;'
                     'pip install --upgrade google-auth-httplib2;'
                     'python /home/iap_validating_server.py'
          }]
        }
      }
    }
  })

  resources.append({
    'name': 'iap-server-instance-group',
    'type': 'compute.v1.instanceGroupManager',
    'properties': {
      'instanceTemplate': '$(ref.iap-server-instance-template.selfLink)',
      'baseInstanceName': 'iap-server-vm',
      'targetSize': 1,
      'zone': context.properties['zone'],
      'namedPorts': [
        {'name': 'http','port': 80},
        {'name': 'https','port': 443}
      ]
    }
  })
  
  resources.append({
    'name': 'iap-health-check',
    'type': 'compute.v1.httpHealthCheck'
  })
  
  resources.append({
    'name': 'iap-backend-service',
    'type': 'compute.v1.backendService',
    'properties': {
      'healthChecks': ['$(ref.iap-health-check.selfLink)'],
      'backends':[{'group': '$(ref.iap-server-instance-group.instanceGroup)'}]
    }
  })
  
  resources.append({
    'name': 'iap-self-signed-cert',
    'type': 'compute.v1.sslCertificate',
    'properties': {
      'privateKey': context.imports[context.properties['privateKey']],
      'certificate': context.imports[context.properties['certificate']]
    }
  })
  
  resources.append({
    'name': 'iap-url-map',
    'type': 'compute.v1.urlMap',
    'properties': {
      'defaultService': '$(ref.iap-backend-service.selfLink)'
    }
  })
  
  resources.append({
    'name': 'iap-target-https-proxy',
    'type': 'compute.v1.targetHttpsProxy',
    'properties': {
      'sslCertificates': ['$(ref.iap-self-signed-cert.selfLink)'],
      'urlMap': '$(ref.iap-url-map.selfLink)'
    }
  })

  resources.append({
    'name': 'iap-reserved-global-address',
    'type': 'compute.v1.globalAddress',
    'properties': {
      'ipVersion': 'IPV4'
    }
  })
  
  resources.append({
    'name': 'iap-global-forwarding-rule',
    'type': 'compute.v1.globalForwardingRule',
    'properties': {
      'target': '$(ref.iap-target-https-proxy.selfLink)',
      'IPAddress': '$(ref.iap-reserved-global-address.address)',
      'portRange': '443'
    }
  })
  
  # You must create a firewall rule that allows traffic from your
  # load balancer and health checker to reach your compute instances.
  # IP ranges: 130.211.0.0/22 and 35.191.0.0/16 correspond
  # to the load balancer and health checker.
  resources.append({
    'name': 'iap-firewall-allow-load-balancer',
    'type': 'compute.v1.firewall',
    'properties': {
      'network': 'global/networks/default',
      'sourceRanges': ['130.211.0.0/22','35.191.0.0/16'],
      'allowed':[{
        'IPProtocol': 'TCP',
        'ports': [80]
      }]
    }
  })

  return {'resources':resources}