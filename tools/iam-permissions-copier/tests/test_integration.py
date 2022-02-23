#    Copyright 2022 Google LLC

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

storage_client = storage.Client()
billing_client = billing_v1.CloudBillingClient()
resource_client = googleapiclient.discovery.build("cloudresourcemanager", "v3")

from constants import ALL_RESOURCES_IN_PROCESSING_ORDER


class TestIntegration(unittest.TestCase):
    def setUp(self):
        self.resources = list(
            map(
                lambda a: a.make_test_instance(),
                ALL_RESOURCES_IN_PROCESSING_ORDER,
            )
        )

    def tearDown(self):
        for resource in self.resources:
            resource.rollback()
            resource.rollback_test_instance()

    def test_it_should_create_resource(self):
        for resource in self.resources:
            resource.verify_permissions()
            resource.migrate()
            bindings = resource._get_role_bindings()

            binding = next(
                filter(
                    lambda binding: resource._new_member
                    in (string.lower() for string in binding["members"])
                    and binding["role"] == resource._role,
                    bindings,
                )
            )

            self.assertEqual(
                binding["role"],
                resource._role,
                "Should have added role",
            )
            self.assertIn(
                resource._new_member,
                (string.lower() for string in binding["members"]),
                "Should have added new member",
            )


if __name__ == "__main__":
    unittest.main()