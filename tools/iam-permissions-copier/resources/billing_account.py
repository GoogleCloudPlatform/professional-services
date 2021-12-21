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

import click

from .base import Resource
from google.cloud import billing_v1


class BillingAccount(Resource):
    _internal_client = billing_v1.CloudBillingClient()
    ASSET_TYPE = "cloudbilling.googleapis.com/BillingAccount"
    RESOURCE_ID_PATTERN = "\/\/cloudbilling.googleapis.com\/(.*)"
    REQUIRED_PERMISSIONS = [
        "billing.accounts.getIamPolicy",
        "billing.accounts.setIamPolicy",
    ]

    @staticmethod
    def _client():
        return BillingAccount._internal_client

    def _get_policy_permissions(self):
        resource_path = self._build_resource_path()
        actual_permissions = self._client().test_iam_permissions(
            resource=resource_path,
            permissions=self.REQUIRED_PERMISSIONS,
        )
        return actual_permissions.permissions

    def _get_role_bindings(self):
        policy = self._updated_policy_snapshot

        map_bindings = list(
            map(
                lambda b: {"role": b.role, "members": b.members},
                policy.bindings,
            )
        )

        return map_bindings

    def delete_test_instance(self):
        # Nothing to do here
        return None

    @classmethod
    def make_test_instance(cls):
        # static billing account used for testing
        click.secho(
            "NOTICE: Using a static billing account for testing",
            fg="white",
        )
        return cls.get_test_instance(
            "//cloudbilling.googleapis.com/billingAccounts/{id}".format(
                id=cls.TEST_BILLING_ACT_ID
            ),
            "roles/billing.user",
        )