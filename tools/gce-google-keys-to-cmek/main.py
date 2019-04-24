#!/usr/bin/env python3

# Copyright 2019 Google, LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import googleapiclient
import googleapiclient.discovery
import time
import re
import sys

def main():
    parser = argparse.ArgumentParser(description='Convert disks attached to a GCE instance from Google-managed encryption keys to customer-managed encryption keys.')
    parser.add_argument('--project', required=True, dest='project', action='store', type=str, help='Project containing the GCE instance.')
    parser.add_argument('--zone', required=True, dest='zone', action='store', type=str, help='Zone containing the GCE instance.')
    parser.add_argument('--instance', required=True, dest='instance', action='store', type=str, help='Instance name.')
    parser.add_argument('--key-ring', required=True, dest='keyRing', action='store', type=str, help='Name of the key ring containing the key to encrypt the disks. Must be in the same zone as the instance.')
    parser.add_argument('--key-name', required=True, dest='keyName', action='store', type=str, help='Name of the key to encrypt the disks. Must be in the same zone as the instance.')
    parser.add_argument('--key-version', required=True, dest='keyVersion', action='store', type=int, help='Version of the key to encrypt the disks.')
    parser.add_argument('--destructive', dest='destructive', action='store_const', const=True, default=False, help='Upon completion, delete source disks and snapshots created during migration process.')
    args = parser.parse_args()

    migrate_instance_to_cmek(args.project, args.zone, args.instance, args.keyRing, args.keyName, args.keyVersion, args.destructive)

def migrate_instance_to_cmek(project, zone, instance, keyRing, keyName, keyVersion, destructive):
    start = time.time()

    zone_regexp = r'^(\w\w-\w*\d)-(\w)$'
    region = re.search(zone_regexp, zone).group(1)

    compute = googleapiclient.discovery.build('compute', 'v1')

    # TODO: Consider if we can use compute.disks().list() and do disk checking
    # before we decide to stop the VM instance.
    stop_instance(compute, project, zone, instance)
    disks = get_instance_disks(compute, project, zone, instance)
    for sourceDisk in disks:
        disk_regexp = r'^https:\/\/www\.googleapis\.com\/compute\/v1\/projects\/(.*?)\/zones\/(.*?)\/disks\/(.*?)$'
        disk_url = sourceDisk['source']
        existing_disk_name = re.search(disk_regexp,disk_url).group(3)

        if 'diskEncryptionKey' in sourceDisk:
            print('Skipping {0}, already encrypyed with {1}', existing_disk_name, sourceDisk['diskEncryptionKey'])
            continue

        snapshot_name = existing_disk_name + '-goog-to-cmek'
        new_disk_name = existing_disk_name + '-cmek'
        disk_type = get_disk_type(compute, project, zone, existing_disk_name)

        create_snapshot(compute, project, zone, existing_disk_name, snapshot_name)
        key_name='projects/{0}/locations/{1}/keyRings/{2}/cryptoKeys/{3}/cryptoKeyVersions/{4}'.format(project, region, keyRing, keyName, keyVersion)
        create_disk(compute, project, region, zone, snapshot_name, new_disk_name, disk_type, key_name)
        detach_disk(compute, project, zone, instance, existing_disk_name)

        boot = sourceDisk['boot']
        autoDelete = sourceDisk['autoDelete']
        attach_disk(compute, project, zone, instance, new_disk_name, boot, autoDelete)
        if destructive:
            delete_disk(compute, project, zone, existing_disk_name)
            delete_snapshot(compute, project, snapshot_name)

    start_instance(compute, project, zone, instance)

    end = time.time()
    print('Migration took {0} seconds.'.format(end -start))

def get_disk_type(compute, project, zone, diskName):
    print('Getting project={0}, zone={1}, diskName={2} metadata'.format(project, zone, diskName))
    result = compute.disks().get(project=project, zone=zone, disk=diskName).execute()
    print('Getting project={0}, zone={1}, diskName={2} metadata complete.'.format(project, zone, diskName))
    return result['type']

def get_instance_disks(compute, project, zone, instance):
    print('Getting project={0}, zone={1}, instance={2} disks'.format(project, zone, instance))
    result = compute.instances().get(project=project, zone=zone, instance=instance).execute()
    print('Getting project={0}, zone={1}, instance={2} disks complete.'.format(project, zone, instance))
    return result['disks']

def create_snapshot(compute, project, zone, disk, snapshot_name):
    body = {
        'name': snapshot_name,
    }
    print('Creating snapshot of disk project={0}, zone={1}, disk={2}'.format(project, zone, disk))
    operation = compute.disks().createSnapshot(project=project, zone=zone, disk=disk, body=body).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    print('Snapshotting of disk project={0}, zone={1}, disk={2} complete.'.format(project, zone, disk))
    return result

def delete_snapshot(compute, project, snapshot_name):
    print('Deleting snapshot project={0}, snapshot_name={1}'.format(project, snapshot_name))
    operation = compute.snapshots().delete(project=project, snapshot=snapshot_name).execute()
    result = wait_for_global_operation(compute, project, operation)
    print('Deleting snapshot project={0},  snapshot_name={1} complete.'.format(project, snapshot_name))
    return result

def attach_disk(compute, project, zone, instance, disk, boot, autoDelete):
    """ Attaches disk to instance.

    Requries iam.serviceAccountUser
    """
    disk_url = 'projects/{0}/zones/{1}/disks/{2}'.format(project, zone, disk)
    body = {
        'autoDelete': autoDelete,
        'boot': boot,
        'source': disk_url,
    }
    print('Attaching disk project={0}, zone={1}, instance={2}, disk={3}'.format(project, zone, instance, disk_url))
    operation = compute.instances().attachDisk(project=project, zone=zone, instance=instance, body=body).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    print('Attaching disk project={0}, zone={1}, instance={2}, disk={3} complete.'.format(project, zone, instance, disk_url))
    return result

def detach_disk(compute, project, zone, instance, disk):
    print('Detaching disk project={0}, zone={1}, instance={2}, disk={3}'.format(project, zone, instance, disk))
    operation = compute.instances().detachDisk(project=project, zone=zone, instance=instance, deviceName=disk).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    print('Detaching disk project={0}, zone={1}, instance={2}, disk={3} complete.'.format(project, zone, instance, disk))
    return result

def delete_disk(compute, project, zone, disk):
    print('Deleting disk project={0}, zone={1}, disk={2}'.format(project, zone, disk))
    operation = compute.disks().delete(project=project, zone=zone, disk=disk).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    print('Deleting disk project={0}, zone={1}, disk={2} complete.'.format(project, zone, disk))
    return result

def create_disk(compute, project, region, zone, snapshot_name, disk_name, disk_type, key_name):
    """Creates a new CMEK encrypted persistent disk from a snapshot"""
    sourceSnapshot = 'projects/{0}/global/snapshots/{1}'.format(project, snapshot_name)
    body = {
        'name': disk_name,
        'sourceSnapshot': sourceSnapshot,
        'type': disk_type,
        'diskEncryptionKey': {
            'kmsKeyName': key_name,
        },
    }
    start = 'Creating new disk project={0}, zone={1}, name={2} sourceSnapshot={3}, kmsKeyName={4}'
    finish = start + ' complete'
    print(start.format(project, zone, disk_name, sourceSnapshot, key_name))
    operation = compute.disks().insert(project=project, zone=zone,  body=body).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    print(finish.format(project, zone, disk_name, sourceSnapshot, key_name))
    return result

def start_instance(compute, project, zone, instance):
    print('Starting project={0}, zone={1}, instance={2}'.format(project, zone, instance))
    operation = compute.instances().start(project=project, zone=zone, instance=instance).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    print('Starting project={0}, zone={1}, instance={2} complete.'.format(project, zone, instance))
    return result

def stop_instance(compute, project, zone, instance):
    print('Stopping project={0}, zone={1}, instance={2}'.format(project, zone, instance))
    operation = compute.instances().stop(project=project, zone=zone, instance=instance).execute()
    result = wait_for_zonal_operation(compute, project, zone, operation)
    print('Stopping project={0}, zone={1}, instance={2} complete.'.format(project, zone, instance))
    return result

def wait_for_global_operation(compute, project, operation):
    operation = operation['name']
    def build():
        return compute.globalOperations().get(
            project=project,
            operation=operation)
    return _wait_for_operation(operation, build)

def wait_for_zonal_operation(compute, project, zone, operation):
    operation = operation['name']
    def build():
        return compute.zoneOperations().get(
            project=project,
            zone=zone,
            operation=operation)
    return _wait_for_operation(operation, build)

def _wait_for_operation(operation, build_request):
    """Helper for waiting for operation to complete."""
    print('Waiting for {0}'.format(operation), end='')
    while True:
        print('.', end='')
        sys.stdout.flush()
        result = build_request().execute()
        if result['status'] == 'DONE':
            print('done!')
            if 'error' in result:
                print('finished with an error')
                print('Error {0}'.format(result['error']))
                raise Exception(result['error'])
            return result
        time.sleep(5)


if __name__== '__main__':
    main()
