#    Copyright 2021 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

import unittest
import googleapiclient.discovery
from google.cloud import storage
from google.cloud import billing_v1
from resources.base import Resource

storage_client = storage.Client()
billing_client = billing_v1.CloudBillingClient()
resource_client = googleapiclient.discovery.build("cloudresourcemanager", "v3")

project_permissions = ["bigquery.datasets.create", "storage.buckets.create"]

org_permissions = [
    "resourcemanager.folders.create",
    "resourcemanager.projects.create",
    "resourcemanager.projects.delete",
]


class TestPermissions(unittest.TestCase):
    def test_can_create_project_resources(self):
        request = resource_client.projects().testIamPermissions(
            resource="projects/{id}".format(id=Resource.TEST_PROJECT_ID),
            body={"permissions": project_permissions},
        )
        returnedPermissions = request.execute()
        self.assertEqual(
            set(project_permissions), set(returnedPermissions["permissions"])
        )

    def test_can_create_org_resources(self):
        request = resource_client.organizations().testIamPermissions(
            resource=Resource.TEST_ORG,
            body={"permissions": org_permissions},
        )
        returnedPermissions = request.execute()
        self.assertEqual(
            set(org_permissions), set(returnedPermissions["permissions"])
        )