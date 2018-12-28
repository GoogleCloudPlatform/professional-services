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

DOMAIN = 'cbcloudtest.com'
ADMIN_EMAIL = 'admin@cbcloudtest.com'
DATASET = 'bq_iam'
GROUPS_USERS_TABLE_NAME = 'groups_users'

def sync_groups(request):
  # os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'service-account-key.json'
  group_sync.GroupSync.sync_all(DOMAIN, ADMIN_EMAIL, DATASET,
                                GROUPS_USERS_TABLE_NAME)
  return 'Group membership from domain {} synched to table {}.{}'.format(
      DOMAIN, DATASET, GROUPS_USERS_TABLE_NAME)
