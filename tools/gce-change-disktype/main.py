#!/usr/bin/env python3

# Copyright 2019 Google, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import datetime
import logging
import re
import sys
import time

import googleapiclient
import googleapiclient.discovery

DISK_REGEXP = r'^https:\/\/www\.googleapis\.com\/compute\/v1\/projects\/(.*?)\/zones\/(.*?)\/disks\/(.*?)$'


def main():
    parser = argparse.ArgumentParser(
        description=
        '''Update disks attached to a GCE instance to customer supplied disk-type '''
    )
    parser.add_argument('--project',
                        required=True,
                        dest='project',
                        action='store',
                        type=str,
                        help='Project containing the GCE instance.')
    parser.add_argument('--zone',
                        required=True,
                        dest='zone',
                        action='store',
                        type=str,
                        help='Zone containing the GCE instance.')
    parser.add_argument('--instance',
                        required=True,
                        dest='instance',
                        action='store',
                        type=str,
                        help='Instance name.')
    parser.add_argument('--disktype',
                        required=True,
                        dest='disktype',
                        action='store',
                        type=str,
                        help='New disk that will replace the old one')
    parser.add_argument(
        '--destructive',
        dest='destructive',
        action='store_const',
        const=True,
        default=False,
        help=
        'Upon completion, delete source disks and snapshots created during migration process.'
    )
    args = parser.parse_args()
    create_newdisk_process(args.project, args.zone, args.instance,
                           args.disktype, args.destructive)


def create_newdisk_process(project, zone, instance, disktype, destructive):
    start = time.time()
    region = zone.rpartition("-")[0]
    compute = googleapiclient.discovery.build('compute', 'v1')
    stop_instance(compute, project, zone, instance)
    disks = get_instance_disks(compute, project, zone, instance)
    disktype = 'https://www.googleapis.com/compute/v1/projects/{0}/zones/{1}/diskTypes/'.format(
        project, zone) + disktype
    for source_disk in disks:
        disk_url = source_disk['source']
        boot = source_disk['boot']
        auto_delete = source_disk['autoDelete']
        deviceName = source_disk['deviceName'][0:46]
        existing_disk_name = re.search(DISK_REGEXP, disk_url).group(3)

        snapshot_name = '{}-update-disk-{}'.format(
            existing_disk_name[0:39], int(datetime.datetime.now().timestamp()))
        new_disk_name = '{}-disk-{}'.format(
            existing_disk_name[0:46], int(datetime.datetime.now().timestamp()))
        create_snapshot(compute, project, zone, existing_disk_name,
                        snapshot_name)
        create_disk(compute, project, region, zone, snapshot_name,
                    new_disk_name, disktype)

        detach_disk(compute, project, zone, instance, deviceName)

        attach_disk(compute, project, zone, instance, new_disk_name, boot,
                    auto_delete, deviceName)
        if destructive:
            delete_disk(compute, project, zone, existing_disk_name)
            delete_snapshot(compute, project, snapshot_name)

    start_instance(compute, project, zone, instance)

    end = time.time()
    logging.info('Migration took %s seconds.', end - start)


def get_disk_type(compute, project, zone, disk_name):
    logging.debug('Getting project=%s, zone=%s, disk_name=%s metadata', project,
                  zone, disk_name)
    result = compute.disks().get(project=project, zone=zone,
                                 disk=disk_name).execute()
    logging.debug(
        'Getting project=%s, zone=%s, disk_name=%s metadata complete.', project,
        zone, disk_name)
    return result['type']


def get_instance_disks(compute, project, zone, instance):
    logging.debug('Getting project=%s, zone=%s, instance=%s disks', project,
                  zone, instance)
    result = compute.instances().get(project=project,
                                     zone=zone,
                                     instance=instance).execute()
    logging.debug('Getting project=%s, zone=%s, instance=%s disks complete.',
                  project, zone, instance)
    return result['disks']


def create_snapshot(compute, project, zone, disk, snapshot_name):
    body = {
        'name': snapshot_name,
    }
    logging.debug('Creating snapshot of disk project=%s, zone=%s, disk=%s',
                  project, zone, disk)
    operation = compute.disks().createSnapshot(project=project,
                                               zone=zone,
                                               disk=disk,
                                               body=body).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    logging.debug('Snapshotting of disk project=%s, zone=%s, disk=%s complete.',
                  project, zone, disk)
    return result


def delete_snapshot(compute, project, snapshot_name):
    logging.debug('Deleting snapshot project=%s, snapshot_name=%s', project,
                  snapshot_name)
    operation = compute.snapshots().delete(project=project,
                                           snapshot=snapshot_name).execute()
    result = wait_for_global_operation(compute, project, operation)
    logging.debug('Deleting snapshot project=%s,  snapshot_name=%s complete.',
                  project, snapshot_name)
    return result


def attach_disk(compute, project, zone, instance, disk, boot, auto_delete,
                deviceName):
    """ Attaches disk to instance.

    Requries iam.serviceAccountUser
    """
    disk_url = 'projects/{0}/zones/{1}/disks/{2}'.format(project, zone, disk)
    body = {
        'autoDelete': auto_delete,
        'boot': boot,
        'deviceName': deviceName,
        'source': disk_url,
    }
    logging.debug('Attaching disk project=%s, zone=%s, instance=%s, disk=%s',
                  project, zone, instance, disk_url)
    operation = compute.instances().attachDisk(project=project,
                                               zone=zone,
                                               instance=instance,
                                               body=body).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    logging.debug(
        'Attaching disk project=%s, zone=%s, instance=%s, disk=%s complete.',
        project, zone, instance, disk_url)
    return result


def detach_disk(compute, project, zone, instance, disk):
    logging.debug('Detaching disk project=%s, zone=%s, instance=%s, disk=%s',
                  project, zone, instance, disk)
    operation = compute.instances().detachDisk(project=project,
                                               zone=zone,
                                               instance=instance,
                                               deviceName=disk).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    logging.debug(
        'Detaching disk project=%s, zone=%s, instance=%s, disk=%s complete.',
        project, zone, instance, disk)
    return result


def delete_disk(compute, project, zone, disk):
    logging.debug('Deleting disk project=%s, zone=%s, disk=%s', project, zone,
                  disk)
    operation = compute.disks().delete(project=project, zone=zone,
                                       disk=disk).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    logging.debug('Deleting disk project=%s, zone=%s, disk=%s complete.',
                  project, zone, disk)
    return result


def create_disk(compute, project, region, zone, snapshot_name, disk_name,
                disk_type):
    """Creates a new user supplied disk-type from snapshot"""
    source_snapshot = 'projects/{0}/global/snapshots/{1}'.format(
        project, snapshot_name)
    body = {
        'name': disk_name,
        'sourceSnapshot': source_snapshot,
        'type': disk_type
    }
    logging.debug(
        'Creating new disk project=%s, zone=%s, name=%s source_snapshot=%s, kmsKeyName=%s',
        project, zone, disk_name, source_snapshot)
    operation = compute.disks().insert(project=project, zone=zone,
                                       body=body).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    logging.debug(
        'Creating new disk project=%s, zone=%s, name=%s source_snapshot=%s, kmsKeyName=%s complete.',
        project, zone, disk_name, source_snapshot)
    return result


def start_instance(compute, project, zone, instance):
    logging.debug('Starting project=%s, zone=%s, instance=%s', project, zone,
                  instance)
    operation = compute.instances().start(project=project,
                                          zone=zone,
                                          instance=instance).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    logging.debug('Starting project=%s, zone=%s, instance=%s complete.',
                  project, zone, instance)
    return result


def stop_instance(compute, project, zone, instance):
    logging.debug('Stopping project=%s, zone=%s, instance=%s', project, zone,
                  instance)
    operation = compute.instances().stop(project=project,
                                         zone=zone,
                                         instance=instance).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    logging.debug('Stopping project=%s, zone=%s, instance=%s complete.',
                  project, zone, instance)
    return result


def wait_for_global_operation(compute, project, operation):
    """Helper for waiting for global operation to complete."""
    operation = operation['name']

    def build():
        return compute.globalOperations().get(project=project,
                                              operation=operation)

    return _wait_for_operation(operation, build)


def wait_for_zonal_operation(compute, project, zone, operation):
    """Helper for waiting for zonal operation to complete."""
    operation = operation['name']

    def build():
        return compute.zoneOperations().get(project=project,
                                            zone=zone,
                                            operation=operation)

    return _wait_for_operation(operation, build)


def _wait_for_operation(operation, build_request):
    """Helper for waiting for operation to complete."""
    logging.debug('Waiting for %s', operation)
    while True:
        sys.stdout.flush()
        result = build_request().execute()
        if result['status'] == 'DONE':
            logging.debug('done!')
            if 'error' in result:
                logging.error('finished with an error')
                logging.error('Error %s', result['error'])
                raise Exception(result['error'])
            return result
        time.sleep(5)


if __name__ == '__main__':
    main()
