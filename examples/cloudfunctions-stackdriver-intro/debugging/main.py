# Copyright 2019 Google LLC
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

from googleapiclient import discovery
import base64
import json

#def live_migrate_vm(data, context):
def test_migrate_vm(data, context):

    # Authenticate
    service = discovery.build('compute', 'beta')

    # Parse log
    #data_buffer = base64.b64decode(data['data'])
    #log_entry = json.loads(data_buffer)['resource']
    log_entry = data['resource']
    
    # Capture required variables
    project_id = log_entry['labels']['project_id']
    zone = log_entry['labels']['zone']
    instance_id = log_entry['labels']['instance_id']

    # Make VM migration API call
    request = service.instances().simulateMaintenanceEvent(project=project_id, zone=zone, instance=instance_id)
    response = request.execute()

    # Capture result
    print(response)
