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

from .base import Resource
import googleapiclient.discovery
import time
import click


class ResourceManagerResource(Resource):
    _internal_client = googleapiclient.discovery.build(
        serviceName="cloudresourcemanager",
        version="v3",
        cache_discovery=False,
    )

    def _get_policy_permissions(self):
        permissions = {"permissions": self.REQUIRED_PERMISSIONS}
        resource_path = self._build_resource_path()
        request = self._client().testIamPermissions(
            resource=resource_path, body=permissions
        )
        returnedPermissions = request.execute()
        return returnedPermissions["permissions"]

    @staticmethod
    def _client():
        return ResourceManagerResource._internal_client

    def _get_current_policy(self, resource_path=None):
        request = self._client().getIamPolicy(resource=resource_path)
        return request.execute()

    def _get_updated_policy(self, resource_path):
        policy = self._get_current_policy(resource_path)
        policy["bindings"].append(
            {"role": self._role, "members": [self._new_member]}
        )
        return policy

    def _process_updated_iam_policy(self, resource_path, new_policy):
        request = self._client().setIamPolicy(
            resource=resource_path, body={"policy": new_policy}
        )
        try:
            return request.execute()
        except googleapiclient.errors.HttpError as errh:
            [details] = errh.error_details
            if details["type"] == "ORG_MUST_INVITE_EXTERNAL_OWNERS":
                click.secho(
                    "ORG_MUST_INVITE_EXTERNAL_OWNERS error triggered when adding {user}"
                    .format(
                        user=self._new_member
                    ),
                )

    def _wait_for_operation(self, operation):
        while True:
            status = (
                ResourceManagerResource._internal_client.operations()
                .get(name=operation["name"])
                .execute()
            )
            if "done" in status:
                if status["done"]:
                    return status
            time.sleep(1)