# Copyright 2023 Google LLC
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

from main import EphemeralInstance
from google.auth.compute_engine import Credentials
import json

'''
This is an example project destruction.
'''

# Init gcp credentials. This example is using compute engine vm credentials.
creds = Credentials()

# load init.json
f = open('private_init.json')
arr = json.load(f)
f.close()

f = open('bindings.json')
bindings = json.load(f)
f.close()

# create an instance of an ephemeral project
instance = EphemeralInstance(
    organization_id=arr['organization_id'],
    name=arr['project_id'],
    owner_username=arr['owner_username'],
    owner_email=arr['owner_email'],
    credentials_object=creds,
    add_iam_bindings_json=bindings,
    remove_iam_bindings_json=bindings)

instance.destroy_project()