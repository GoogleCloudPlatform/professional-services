# Copyright 2021 Google, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# Copyright 2021 Google, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import base64
import json
import re
from googleapiclient.discovery import build


def main(event, ctx):
    if 'data' not in event:
        raise

    payload = base64.b64decode(event['data']).decode('utf-8')
    payload = json.loads(payload)

    print(payload)
    data = payload['asset']['resource']['data']

    if should_delete(data):
        delete_rule(data)


def should_delete(data) -> bool:
    # Hook for deciding whether to delete a firewall rule

    # Do the sourceRanges allow all IPs
    return any('/0' in source_range for source_range in data['sourceRanges'])


def delete_rule(data):
    self_link = data['selfLink']
    project = re.search('projects/([\w-]+)/', self_link).group(1)
    firewall = re.search('firewalls/([\w-]+)', self_link).group(1)
    svc = build('compute', 'v1')
    svc.firewalls().delete(project=project, firewall=firewall).execute()
    print(f'Deleted firewall: {self_link}')
