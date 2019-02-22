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
"""Creates a BigQuery table listing members of all groups in a G Suite or Cloud Identity domain."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
import csv
from io import StringIO
import sys

import auth_util
from apiclient.discovery import build
import google.api_core.exceptions
from google.cloud import bigquery


class GroupSync(object):
  """Manages synchronization of group member data from G Suite or Cloud Identity

  API to BigQuery.
  """

  def __init__(self, admin_email, domain, use_cloud_identity):
    self.domain = domain
    self.use_cloud_identity = use_cloud_identity
    self.bq_client = bigquery.Client()
    self.service = self._get_service_reference(admin_email)

  def _get_service_reference(self, admin_email):
    """Instantiates a connection to the API.

    Args:
      admin_email: a G Suite or Cloud Identity administrator account to
        impersonate.

    Returns:
      A reference to an API Service object, ready to call APIs.
    """
    if self.use_cloud_identity:
      scopes = [
          'https://www.googleapis.com/auth/cloud-identity.groups.readonly'
      ]
    else:
      scopes = [
          'https://www.googleapis.com/auth/admin.directory.group',
      ]

    credentials = auth_util.get_credentials(admin_email, scopes)
    if self.use_cloud_identity:
      service = build('cloudidentity', 'v1', credentials=credentials)
    else:
      service = build('admin', 'directory_v1', credentials=credentials)

    return service

  def get_group_members_as_list(self):
    """Retrieves the members of all groups in the domain as an array.

    Returns:
      A bi-dimensional array with each row representing a pair of group id and
      user id (both strings).
    """

    all_group_members = []
    if self.use_cloud_identity:
      ci_parent = 'identitysources/{}'.format(self.domain)
      results = self.service.groups().list(parent=ci_parent).execute()
    else:
      results = self.service.groups().list(domain=self.domain).execute()

    for g in results.get('groups', []):
      if self.use_cloud_identity:
        group_id = g['groupKey']['id']
      else:
        group_id = g['email']
      members = self._list_group_members(group_id)
      group_members = zip([group_id] * len(members), members)
      all_group_members.extend(group_members)

    return all_group_members

  def _list_group_members(self, group_id):
    """Calls the G Suite or Cloud Identity API to list members of the given

    group.

    Args:
      group_id: group id in the form group@domain.tld

    Returns:
      An array of strings containing the emails of group members.
    """
    if self.use_cloud_identity:
      ci_parent = 'groups/{}'.format(group_id)
      results = self.service.memberships().list(parent=ci_parent).execute()
      users = [m['memberKey']['id'] for m in results.get('memberships')]
    else:
      results = self.service.members().list(groupKey=group_id).execute()
      users = [
          m['email']
          for m in results.get('members')
          if m.get('status', None) == 'ACTIVE'
      ]
    return users

  def create_group_members_table(self, dataset_id, groups_users_table_name):
    """Creates a BigQuery table to store group membership data.

    If a table with the given name in the given dataset already exists, will
    assume it is already created properly and keep it as is. If the given
    dataset does not already exist, it will also be created.

    Args:
      dataset_id: id of dataset in which to create the table. If it doesn't
        exist, it will be created.
      groups_users_table_name: name of table to be created if it doesn't exist.

    Returns:
      A reference to the new or existing table.
    """
    dataset_ref = self.bq_client.dataset(dataset_id)
    dataset = bigquery.Dataset(dataset_ref)
    try:
      self.bq_client.create_dataset(dataset)
    except google.api_core.exceptions.Conflict:
      # Assume dataset already exists.
      pass

    schema = [
        bigquery.SchemaField('group', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('user', 'STRING', mode='REQUIRED'),
    ]
    table_ref = dataset_ref.table(groups_users_table_name)
    table = bigquery.Table(table_ref, schema=schema)
    try:
      self.bq_client.create_table(table)
    except google.api_core.exceptions.Conflict:
      # Assume table already exists.
      pass
    return table_ref

  def store_group_members(self, table_ref, data):
    """Stores the given group membership data into the given table.

    All data in the table will be replaced by the new data.

    Args:
      table_ref: a reference to the table that will receive the data. Needs to
        have the correct schema as created by `create_group_members_table`.
      data: bi-dimensional array representing the data to be inserted.

    Returns:
      An array of errors returned from the BigQuery API, if any.
    """

    # Use batch load from in-memory CSV file instead of streaming.
    csv_file = StringIO()
    csv_writer = csv.writer(csv_file)
    csv_writer.writerows(data)

    # Configure job to replace table data, (default is append).
    job_config = bigquery.LoadJobConfig()
    job_config.write_disposition = bigquery.job.WriteDisposition.WRITE_TRUNCATE

    errors = self.bq_client.load_table_from_file(
        csv_file, table_ref, rewind=True, job_config=job_config)
    return errors

  @staticmethod
  def sync_all(domain, admin_email, dataset_id, groups_users_table_name,
               use_cloud_identity):
    """Synchronizes membership of all domain groups into a BigQuery table.

    Args:
      domain: name of the G Suite or Cloud Identity domain whose groups are to
        be synched
      admin_email: a G Suite or Cloud Identity administrator account to
        impersonate.
      dataset_id: id of dataset in which to create the table. If it doesn't
        exist, it will be created.
      groups_users_table_name: name of table to be created if it doesn't exist.
    """
    group_sync = GroupSync(admin_email, domain, use_cloud_identity)
    all_group_members = group_sync.get_group_members_as_list()
    table_ref = group_sync.create_group_members_table(dataset_id,
                                                      groups_users_table_name)
    group_sync.store_group_members(table_ref, all_group_members)


def main(argv):

  parser = argparse.ArgumentParser()

  parser.add_argument(
      '--admin_email',
      dest='admin_email',
      required=True,
      help='Email of a user to impersonate for G Suite API calls.')

  parser.add_argument(
      '--domain',
      dest='domain',
      required=True,
      help='Domain which owns the groups to be synced to BigQuery tables.')

  parser.add_argument(
      '--dataset',
      dest='dataset',
      default='bq_iam',
      help='BigQuery dataset where tables should be created or updated.')

  parser.add_argument(
      '--groups_users_table_name',
      dest='groups_users_table_name',
      default='groups_users',
      help='Name of the BigQuery table that will contain the mapping of groups '
      'to users.')

  parser.add_argument(
      '--use_cloud_identity',
      dest='use_cloud_identity',
      default=False,
      action='store_true',
      help='Set this flag to use the Cloud Identity API.')

  args, _ = parser.parse_known_args(argv)

  GroupSync.sync_all(args.domain, args.admin_email, args.dataset,
                     args.groups_users_table_name, args.use_cloud_identity)


if __name__ == '__main__':
  main(sys.argv)
