# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Delete Cloud SQL On-Demand Backups.

Tool to delete unecessary Cloud SQL On-Demand Backups.
"""

import argparse
import logging
import httplib2
import json
import time
from datetime import datetime
from googleapiclient import discovery
from oauth2client.client import GoogleCredentials
from googleapiclient import errors

CREDENTIALS = GoogleCredentials.get_application_default()
if CREDENTIALS.create_scoped_required():
    CREDENTIALS = CREDENTIALS.create_scoped(
        'https://www.googleapis.com/auth/cloud-platform')

SQL = None


def resource_iterator(next_page_function):
    """Loop through resources from a Google API.

    An iterator that returns all of the resources from a Google API 'list'
    operation paging through each set.

    Args:
        next_page_function: A function that when called will return the next
        page of results.

    Yields:
        A list if resources, which are typically dictionaries.
    """
    next_page_token = None
    more_results = True
    while more_results:
        resource_response = None
        try:
            resource_response = next_page_function(next_page_token).execute()
        except errors.HttpError:
            # Some projects throw a 403. (compute engine isn't enabled)
            # just ignore those resources.
            logging.debug('skipping resources.', exc_info=True)
            return

        for items_field in ['items', 'rrsets', 'managedZones']:
            items = resource_response.get(items_field, {})
            if items and isinstance(items, dict):
                for item in items.iteritems():
                    yield item
            if items and isinstance(items, list):
                for item in items:
                    yield item
        if 'nextPageToken' in resource_response:
            next_page_token = resource_response['nextPageToken']
        else:
            more_results = False


def get_cloudsql_instances(project):
    """List all Cloud SQL instancs in the project."""
    for instance in resource_iterator(
       lambda pt: SQL.instances().list(
           project=project,
           pageToken=pt)):
        yield instance


def get_cloudsql_backups(project, instance_id):
    """List all SQL backups."""
    for backup in resource_iterator(
       lambda pt: SQL.backupRuns().list(
           project=project,
           instance=instance_id,
           pageToken=pt)):
        yield backup


def current_time():
    return datetime.utcnow()


def delete_old_backups(instance, days_to_keep, backups_to_keep,
                       async_delete, dry_run):
    """Delete unecessary Cloud SQL Backups.

    Retrieives backups looking for those younger then `days_to_keep` then
    deletes any if we found at least `backups_to_keep` backups.
    Args:
        instance: Cloud SQL instance object.
        days_to_keep: Integer of days of backups to keep.
        backups_to_keep: Number of backups to keep.
        async_delete: Wait for each delete operation to complete.
        dry_run: Just log and not delete anything.
    """
    keepable_backups_found = 0
    now = current_time()
    project = instance['project']
    for backup in get_cloudsql_backups(project, instance['name']):
        backup_time = datetime.strptime(backup['endTime'],
                                        '%Y-%m-%dT%H:%M:%S.%fZ')
        if (now - backup_time).days <= days_to_keep:
            keepable_backups_found += 1
            logging.debug('keeping backup %d, %s , <= %d days',
                          keepable_backups_found,
                          backup, days_to_keep)
        elif keepable_backups_found >= backups_to_keep:
            logging.info('deleting backup %s', backup)
            if not dry_run:
                delete_backup(project, backup, async_delete)
        else:
            keepable_backups_found += 1
            logging.debug('keeping backup %d, %s, < %d backups kept',
                          keepable_backups_found,
                          backup, backups_to_keep)


def wait_for_delete_operation_completion(project, operation, retry_count=0):
    """Wait for the backup delete operation to complete.

    Args:
        project: project id.
        operation: the operation object to wait on.
        retry_count: times this operation was waited on.
    Raises:
        Exception: If the delete operation failed due to an error.
    """
    change = SQL.operations().get(
        project=project,
        operation=operation['name']).execute()
    if change['status'].lower() in('pending', 'running'):
        # Retry with backoff and max of 10 seconds.
        time.sleep(min(1.5**retry_count, 10))
        wait_for_delete_operation_completion(
            project, operation, retry_count=retry_count + 1)
    elif change['status'].lower() == 'done':
        logging.debug('delete %s completed successfully.',
                      change)
    else:
        raise Exception('delete failed {}.'.format(json.dumps(change)))


def delete_backup(project, backup, async_delete):
    operation = SQL.backupRuns().delete(
        instance=backup['instance'], project=project, id=backup['id']).execute()
    if not async_delete:
        wait_for_delete_operation_completion(project, operation)


def main():
    """Delete Cloud SQL Backups.

    Backups older then the input number of days if there is
    at least some backup that's are newer.
    """
    ap = argparse.ArgumentParser(
        description=(('Deletes old Cloud SQL on demand backups'
                      'in a project. Both --backups-to-keep and'
                      '--days-to-keep must be satsified.')))
    ap.add_argument('project', help='The project id.')
    ap.add_argument('--days-to-keep',
                    help='Number of days of backups to retain.', nargs='?',
                    type=int, default=1)
    ap.add_argument('--backups-to-keep',
                    help='Number of backups to retain.', nargs='?',
                    type=int, default=1)
    ap.add_argument('--async-delete',
                    help='Do not wait for operation completion.', nargs='?',
                    type=bool, default=False)
    ap.add_argument('--dry-run',
                    help='Does not delete, logs what would be done.',
                    action='store_true')
    ap.add_argument('--debug', help='Verbose debugging.', action='store_true')
    args = ap.parse_args()
    project = args.project
    days_to_keep = args.days_to_keep
    backups_to_keep = args.backups_to_keep
    async_delete = args.async_delete
    dry_run = args.dry_run
    logging.basicConfig(level=logging.DEBUG)
    if args.debug:
        logging.basicConfig(level=logging.DEBUG)
        httplib2.debuglevel = 100
    else:
        logging.basicConfig(level=logging.INFO)
    global SQL
    http = httplib2.Http(timeout=60)
    SQL = discovery.build('sqladmin', 'v1beta4',
                          http=CREDENTIALS.authorize(http),
                          cache_discovery=False)
    for instance in get_cloudsql_instances(project):
        logging.info('delete backups for instance %s', instance)
        delete_old_backups(instance, days_to_keep, backups_to_keep,
                           async_delete, dry_run)


if __name__ == '__main__':
    main()
