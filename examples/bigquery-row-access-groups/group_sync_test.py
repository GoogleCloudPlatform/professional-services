# Copyright 2019 Google LLC. All rights reserved. Licensed under the Apache
# License, Version 2.0 (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.
#
# Any software provided by Google hereunder is distributed "AS IS", WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, and is not intended for production use.
"""Tests for group_sync."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import group_sync

import unittest
from unittest import mock


class GroupSyncTest(unittest.TestCase):

  @mock.patch("auth_util.get_credentials")
  def test_get_group_members_as_list_cloud_identity(self, au):
    au.get_credentials.return_value = mock.MagicMock()
    gs = group_sync.GroupSync("admin@example.com", "example.com", True)

    gs.bq_client = mock.MagicMock()
    gs.service = mock.MagicMock()
    gs.service.groups().list().execute.return_value = {
        "groups": [{
            "name": "groups/test-group",
            "groupKey": {
                "id": "test-group",
                "namespace": "identitysources/example.com"
            },
            "parent": "identitysources/example.com",
            "displayName": "Test Group",
            "description": "Group for testing purposes",
            "createTime": "2019-02-11T11:49:28+0000",
            "updateTime": "2019-02-11T11:49:28+0000",
            "labels": {
                "labels/system/groups/external": "",
            }
        }],
        "nextPageToken": ""
    }
    gs.service.memberships().list().execute.return_value = {
        "memberships": [{
            "name": "groups/test-group/memberships/user1",
            "memberKey": {
                "id": "user1",
                "namespace": "identitysources/example.com"
            },
            "createTime": "2019-02-11T11:49:28+0000",
            "updateTime": "2019-02-11T11:49:28+0000",
            "roles": [{
                "name": "MEMBER"
            }]
        }],
        "nextPageToken": ""
    }

    all_group_members = gs.get_group_members_as_list()

    self.assertListEqual(all_group_members, [("test-group", "user1")])


if __name__ == "__main__":
  unittest.main()
