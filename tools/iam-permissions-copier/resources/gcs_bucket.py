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

from .base import Resource
from google.cloud import storage


class GcsBucket(Resource):
    _internal_client = storage.Client()
    ASSET_TYPE = "storage.googleapis.com/Bucket"
    RESOURCE_ID_PATTERN = "\/\/storage.googleapis.com\/(.*)"
    REQUIRED_PERMISSIONS = [
        "storage.buckets.getIamPolicy",
        "storage.buckets.setIamPolicy",
    ]

    def _client(self):
        (bucket,) = self._parsed_resource_id()
        return self._internal_client.get_bucket(bucket)

    def _get_policy_permissions(self):
        return self._client().test_iam_permissions(
            permissions=self.REQUIRED_PERMISSIONS
        )

    def _get_current_policy(self, resource_path):
        return self._client().get_iam_policy()

    def _get_updated_policy(self, resource_path):
        policy = self._get_current_policy(resource_path)
        policy.bindings.append(
            {
                "role": self._role,
                "members": [self._new_member],
            }
        )
        return policy

    def _process_updated_iam_policy(self, resource, policy):
        return self._client().set_iam_policy(policy)

    def delete_test_instance(self):
        self._client().delete()

    @classmethod
    def make_test_instance(cls):
        bucket_name = cls.get_test_instance_name()

        cls._internal_client.create_bucket(bucket_name)

        return cls.get_test_instance(
            "//storage.googleapis.com/{name}".format(name=bucket_name),
            "roles/storage.legacyBucketReader",
        )