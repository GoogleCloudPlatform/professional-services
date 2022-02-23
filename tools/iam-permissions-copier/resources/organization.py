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

from .resource_manager import ResourceManagerResource
import click


class Organization(ResourceManagerResource):
    ASSET_TYPE = "cloudresourcemanager.googleapis.com/Organization"
    RESOURCE_ID_PATTERN = "\/\/cloudresourcemanager.googleapis.com\/(.*)"
    REQUIRED_PERMISSIONS = [
        "resourcemanager.organizations.getIamPolicy",
        "resourcemanager.organizations.setIamPolicy",
    ]

    @staticmethod
    def _client():
        return ResourceManagerResource._client().organizations()

    def delete_test_instance(self):
        # Nothing to do here
        return None

    @classmethod
    def make_test_instance(cls):
        # static organization used for testing
        click.secho(
            "NOTICE: Using a static organization for testing",
            fg="white",
        )
        return cls.get_test_instance(
            "//cloudresourcemanager.googleapis.com/{org}".format(
                org=cls.TEST_ORG
            ),
            "roles/resourcemanager.organizationViewer",
        )