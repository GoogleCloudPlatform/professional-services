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

from resources.base import Resource


class BaseResource(Resource):
    ASSET_TYPE = "cloudresourcemanager.googleapis.com/TestResource"
    RESOURCE_ID_PATTERN = "\/\/cloudresourcemanager.googleapis.com\/(.*)"


class TestBaseResource(unittest.TestCase):
    def setUp(self):
        self.new_resource = BaseResource(
            "//cloudresourcemanager.googleapis.com/foobar",
            "roles/test.role",
            "foo@bar.com",
            True,
        )

    def test_it_should_init(self):
        self.assertEqual(
            self.new_resource._role,
            "roles/test.role",
            "Should set role",
        )
        self.assertEqual(
            self.new_resource._new_member,
            "foo@bar.com",
            "Should set new member to copy",
        )
        self.assertEqual(
            self.new_resource._resource_id,
            "//cloudresourcemanager.googleapis.com/foobar",
            "Should set resource id",
        )
        self.assertEqual(
            self.new_resource._dry_run,
            True,
            "Should set dry run",
        )

    def test_should_parse_resource_id(self):
        (resource_name,) = self.new_resource._parsed_resource_id()
        self.assertEqual(resource_name, "foobar", "Should parse resource name")

    @unittest.expectedFailure
    def test_should_fail_with_invalid_resource_id(self):
        self.new_resource._resource_id = "fail"
        (resource_name,) = self.new_resource._parsed_resource_id()
        self.assertEqual(
            resource_name, "foobar", "Should fail to parse resource name"
        )


if __name__ == "__main__":
    unittest.main()