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


class Folder(ResourceManagerResource):
    ASSET_TYPE = "cloudresourcemanager.googleapis.com/Folder"
    RESOURCE_ID_PATTERN = "\/\/cloudresourcemanager.googleapis.com\/(.*)"
    REQUIRED_PERMISSIONS = [
        "resourcemanager.folders.setIamPolicy",
        "resourcemanager.folders.getIamPolicy",
    ]

    @staticmethod
    def _client():
        return ResourceManagerResource._client().folders()

    def delete_test_instance(self):
        resource_path = self._build_resource_path()
        self._client().delete(name=resource_path).execute()

    @classmethod
    def make_test_instance(cls):
        folder_name = cls.get_test_instance_name()

        operation = (
            cls._client()
            .create(
                body={
                    "displayName": folder_name,
                    "parent": cls.TEST_ORG,
                }
            )
            .execute()
        )

        status = Folder._wait_for_operation(cls, operation)
        created_name = status["response"]["name"]

        return cls.get_test_instance(
            "//cloudresourcemanager.googleapis.com/{name}".format(
                name=created_name
            ),
            "roles/resourcemanager.folderEditor",
        )