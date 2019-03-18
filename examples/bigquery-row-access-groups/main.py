# Copyright 2018 Google LLC. All rights reserved. Licensed under the Apache
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

import os

import group_sync

# Your G Suite/Cloud Identiy domain
DOMAIN = 'cbcloudtest.com'
# The email of a domain administrator
ADMIN_EMAIL = 'admin@cbcloudtest.com'
# The name of a dataset that will be created to hold the user mapping table
DATASET = 'bq_iam'
# Name to give the user mapping table
GROUPS_USERS_TABLE_NAME = 'groups_users'
# Whether to use Cloud Identity or G Suite
USE_CLOUD_IDENTITY = False

def sync_groups(request):
  group_sync.GroupSync.sync_all(DOMAIN, ADMIN_EMAIL, DATASET,
                                GROUPS_USERS_TABLE_NAME, USE_CLOUD_IDENTITY)
  return 'Group membership from domain {} copied to table {}.{}'.format(
      DOMAIN, DATASET, GROUPS_USERS_TABLE_NAME)
