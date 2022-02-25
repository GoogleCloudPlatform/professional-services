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

import re
import os
import click
import uuid


class Resource(object):
    TEST_ORG = "organizations/{org}".format(org=os.environ.get("TEST_ORG_ID"))
    TEST_USER = "user:{email}".format(
        email=os.environ.get("TEST_EMAIL")
    ).lower()
    TEST_PROJECT_ID = os.environ.get("TEST_PROJECT_ID")
    TEST_BILLING_ACT_ID = os.environ.get("TEST_BILLING_ACT_ID")
    RESOURCE_ID_PATTERN = ""
    REQUIRED_PERMISSIONS = []
    ASSET_TYPE = ""

    def __init__(self, resource_id, role, new_member, dry_run=False):
        self._role = role
        self._dry_run = dry_run
        self._new_member = new_member
        self._resource_id = resource_id
        self._prev_policy_snapshot = {}
        self._updated_policy_snapshot = None

    def migrate(self):
        self.__update_policy_for_resource(self._build_resource_path())

    def rollback(self):
        resource_path = self._build_resource_path()
        updated_policy = self._get_current_policy(resource_path)
        if type(updated_policy) is dict and "etag" in updated_policy:
            self._prev_policy_snapshot["etag"] = updated_policy["etag"]

        if hasattr(updated_policy, "etag"):
            if hasattr(self._prev_policy_snapshot, "_properties"):
                self._prev_policy_snapshot._properties[
                    "etag"
                ] = updated_policy.etag
            elif hasattr(self._prev_policy_snapshot, "etag"):
                self._prev_policy_snapshot.etag = updated_policy.etag

        self._process_updated_iam_policy(
            resource_path, self._prev_policy_snapshot
        )
        click.secho(
            "ROLLED BACK BINDING ON {resource}".format(
                resource=self._resource_id
            ),
            bg="black",
            fg="red",
        )

    def _get_policy_permissions(self):
        return []

    def verify_permissions(self):
        try:
            returnedPermissions = self._get_policy_permissions()
            matches = set(self.REQUIRED_PERMISSIONS) == set(returnedPermissions)
            if matches:
                return click.secho(
                    "Permissions verified for {resource}".format(
                        resource=self._resource_id
                    ),
                )
        except:
            pass

        raise SystemExit(
            "ERROR: Permissions not enough to modify {resource}".format(
                resource=self._resource_id
            )
        )

    @staticmethod
    def get_test_instance_name():
        return "int-test-{val}".format(val=uuid.uuid4().hex)[:20]

    def rollback_test_instance(self):
        self.delete_test_instance()
        click.secho(
            "DELETED {resource}".format(resource=self._resource_id),
            bg="black",
            fg="red",
        )
        click.secho("".join(map(lambda x: x * 20, "-")))

    @classmethod
    def get_test_instance(cls, resource, role):
        click.secho(
            "CREATED NEW {resource}".format(resource=resource),
            bg="black",
            fg="green",
        )

        return cls(
            resource,
            role,
            cls.TEST_USER,
        )

    def _parsed_resource_id(self):
        match = re.compile(self.RESOURCE_ID_PATTERN).match(self._resource_id)
        if match is None:
            raise RuntimeError(
                "Unable to parse resource name {name}".format(
                    name=self._resource_id
                )
            )
        return match.groups()

    def _build_resource_path(self):
        (resource_path,) = self._parsed_resource_id()
        return resource_path

    def _get_current_policy(self, resource_path=None):
        return self._client().get_iam_policy(
            request={"resource": resource_path}
        )

    def _get_updated_policy(self, resource_path=None):
        policy = self._get_current_policy(resource_path)

        policy.bindings.add(
            role=self._role,
            members=[self._new_member],
        )
        return policy

    def _get_role_bindings(self):
        policy = self._updated_policy_snapshot
        return policy["bindings"] if type(policy) is dict else policy.bindings

    def _process_updated_iam_policy(self, resource_path, new_policy):
        request = {"resource": resource_path, "policy": new_policy}
        return self._client().set_iam_policy(request=request)

    def __log_pre_update(self):
        click.secho("".join(map(lambda x: x * 20, "-")))
        click.secho("UPDATING {resource}".format(resource=self._resource_id))
        click.secho(
            "NEW_USER   => {user}".format(user=self._new_member),
            bg="black",
            fg="green",
        )
        click.secho(
            "ROLE       => {role}".format(role=self._role),
            bg="black",
            fg="green",
        )
        click.secho("".join(map(lambda x: x * 20, "-")))

    def __update_policy_for_resource(self, resource):
        self.__log_pre_update()

        self._prev_policy_snapshot = self._get_current_policy(resource)
        updated_policy = self._get_updated_policy(resource)

        # TODO: if not self._dry_run ?
        if self._dry_run is False:
            self._updated_policy_snapshot = self._process_updated_iam_policy(
                resource, updated_policy
            )