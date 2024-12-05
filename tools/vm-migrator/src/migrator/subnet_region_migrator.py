#!/usr/bin/env python
# Copyright 2021 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
This file creates a machine image and them creates an instance
from the machine image in another subnet
"""

import argparse
import logging
import sys
import concurrent.futures
import copy
import json

from . import machine_image
from . import instance
from . import uri
from . import disk
from . import subnet
from . import machine_type_mapping
from . import zone_mapping
from . import fields
from . import project
from csv import DictReader
from csv import DictWriter


def bulk_image_create(project, machine_image_region, file_name='export.csv') \
        -> bool:

    result = True
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        count = 0
        tracker = 0
        machine_image_future = []
        machine_image_name = ''
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                machine_image_future.append(
                    executor.submit(machine_image.create, project,
                                    machine_image_region, row['self_link'],
                                    row['name']))
                count = count + 1

            for future in concurrent.futures.as_completed(
                    machine_image_future):
                try:
                    machine_image_name = future.result()
                    tracker = tracker + 1
                    logging.info('%r machine image created sucessfully',
                                 machine_image_name)
                    logging.info('Machine image %i out of %i completed',
                                 tracker, count)
                except Exception as exc:
                    logging.error(
                        'machine image creation generated an exception: %s',
                        exc)
                    result = False
    return result


def bulk_delete_instances_and_disks(file_name, source_project) -> bool:
    result = True
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = list(DictReader(read_obj))
        count = 0
        tracker = 0
        instance_future = []
        instance_name = ''
        deleted_instances = []
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                instance_uri = uri.Instance.from_uri(row['self_link'])
                instance_future.append(
                    executor.submit(instance.delete, instance_uri))
                count = count + 1

            for future in concurrent.futures.as_completed(instance_future):
                try:
                    instance_name = future.result()
                    deleted_instances.append(instance_name)
                    tracker = tracker + 1
                    logging.info('%r machine deleted sucessfully',
                                 instance_name)
                    logging.info('%i out of %i deleted', tracker, count)
                except Exception as exc:
                    logging.error(
                        'machine deletion generated an exception: %s', exc)
                    result = False
        count = 0
        tracker = 0
        disk_future = []
        disk_name = ''
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                instance_uri = uri.Instance.from_uri(row['self_link'])
                for i in range(9):
                    if row['disk_name_' + str(i + 1)] != '':
                        if instance_uri.name in deleted_instances:
                            disk_future.append(
                                executor.submit(disk.delete, instance_uri,
                                                row['disk_name_' + str(i + 1)],
                                                source_project))
                            count = count + 1
                        else:
                            logging.info(
                                'Since instance {} was not deleted, disk {} '
                                'is being left undeleted as well.'
                                .format(instance_uri.name,
                                        row['disk_name_' + str(i + 1)]))

            for future in concurrent.futures.as_completed(disk_future):
                try:
                    disk_name = future.result()
                    tracker = tracker + 1
                    logging.info('%r disk deleted sucessfully', disk_name)
                    logging.info('%i out of %i deleted', tracker, count)
                except Exception as exc:
                    logging.error('disk deletion generated an exception: %s',
                                  exc)
                    result = False
    return result


def bulk_instance_shutdown(file_name) -> bool:
    result = True
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        count = 0
        tracker = 0
        instance_future = []
        machine_name = ''
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                instance_uri = uri.Instance.from_uri(row['self_link'])
                instance_future.append(
                    executor.submit(instance.shutdown, instance_uri))
                count = count + 1
            for future in concurrent.futures.as_completed(instance_future):
                try:
                    machine_name = future.result()
                    tracker = tracker + 1
                    logging.info('%r machine shutdown sucessfully',
                                 machine_name)
                    logging.info('%i out of %i shutdown', tracker, count)
                except Exception as exc:
                    logging.error(
                        'machine shutdown generated an exception: %s', exc)
                    result = False
    return result


def bulk_instance_start(file_name) -> bool:
    result = True
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        count = 0
        tracker = 0
        instance_future = []
        machine_name = ''
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                instance_uri = uri.Instance.from_uri(row['self_link'])
                instance_future.append(
                    executor.submit(instance.start, instance_uri))
                count = count + 1

            for future in concurrent.futures.as_completed(instance_future):
                try:
                    machine_name = future.result()
                    tracker = tracker + 1
                    logging.info('%r machine started sucessfully',
                                 machine_name)
                    logging.info('%i out of %i started up', tracker, count)
                except Exception as exc:
                    logging.error(
                        'machine strating generated an exception: %s', exc)
                    result = False
    return result


def bulk_move_instances_to_subnet(
        file_name, to_subnet_uri: uri.Subnet, direction: str
    ) -> bool:
    if direction != 'backup' and direction != 'rollback':
        logging.error(
            "bulk_move_instances_to_subnet: specify a direction \
            ('backup' or 'rollback')"
        )
        return False
    result = True
    # first go through the whole file and check for instance fingerprints
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        for row in csv_dict_reader:
            if not row['fingerprint']:
                logging.error(
                    'Missing fingerprint for instance %s, aborting',
                    row['name']
                )
                return False
    # all fingerprints there, proceeding
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        count = 0
        tracker = 0
        instance_future = []
        machine_name = ''
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                instance_uri = uri.Instance.from_uri(row['self_link'])
                if not row['fingerprint']:
                    logging.error(
                        'Missing fingerprint for %s, aborting',
                        row['name']
                    )
                instance_future.append(
                    executor.submit(
                        instance.move_to_subnet_and_rename, instance_uri,
                        row, to_subnet_uri, direction)
                    )
                count = count + 1
            for future in concurrent.futures.as_completed(instance_future):
                try:
                    machine_name = future.result()
                    tracker = tracker + 1
                    logging.info('%r machine moved to subnet %s sucessfully',
                                 machine_name, to_subnet_uri)
                    logging.info('%i out of %i moved to subnet', tracker, count)
                except Exception as exc:
                    logging.error(
                        'Moving machine to subnet %s: exception: %s',
                        to_subnet_uri, exc
                    )
                    result = False
    return result


def add_machineimage_iampolicies(file_name, source_project,
                                 target_service_account) -> bool:

    result = True
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            machineimage_future = []
            count = 0
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                machineimage_future.append(
                    executor.submit(machine_image.add_iam_policy,
                                    source_project, row['name'],
                                    target_service_account))
                count = count + 1

            tracker = 0
            for future in concurrent.futures.as_completed(machineimage_future):
                try:
                    machine_name = future.result()
                    tracker = tracker + 1
                    logging.info('Set IAM policy for service account to '
                                 '%s machine image sucessfully', machine_name)
                    logging.info('%i out of %i set ', tracker, count)
                except Exception as exc:
                    logging.error(
                        'machine iam policy generated an exception: %s', exc)
                    result = False
    return result


def bulk_create_instances(file_name, target_project, target_service_account,
                          target_scopes, target_subnet_uri: uri.Subnet,
                          source_project, retain_ip) -> bool:
    target_network = subnet.get_network(target_subnet_uri)
    result = True
    disk_labels = {}
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            instance_future = []
            count = 0
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                ip = None
                if retain_ip:
                    ip = row['internal_ip']

                if target_network:
                    row['network'] = target_network

                source_instance_uri = uri.Instance.from_uri(row['self_link'])

                target_instance_uri = uri.Instance(
                    project=target_project,
                    zone=zone_mapping.FIND[source_instance_uri.zone],
                    name=row['name']
                )
                alias_ip_ranges = []
                # Re create the alias ip object from CSV if any
                # This support upto 4 ip ranges but they can be easily extended
                for i in range(4):
                    alias_range = {}
                    if row['range_name_' + str(i + 1)] != '':
                        alias_range['subnetworkRangeName'] = row['range_name_'
                                                                 + str(i + 1)]
                    if row['alias_ip_name_' + str(i + 1)]:
                        alias_range['aliasIpName'] = row['alias_ip_name_' +
                                                         str(i + 1)]
                    if row['alias_ip_' + str(i + 1)]:
                        alias_range['ipCidrRange'] = row['alias_ip_' +
                                                         str(i + 1)]
                        alias_ip_ranges.append(alias_range)
                # This supports up to 9 disks
                disk_names = {}
                for i in range(9):
                    if row['device_name_' + str(i + 1)] != '':
                        disk_names[row['device_name_' +
                                       str(i + 1)]] = row['disk_name_' +
                                                          str(i + 1)]
                    if row['disk_labels_' + str(i + 1)] != '':
                        disk_labels[uri.Disk(target_instance_uri.project,
                                             target_instance_uri.zone,
                                             row['disk_name_' + str(i + 1)]
                                             ).uri] = row['disk_labels_' +
                                                          str(i + 1)]

                node_group = None
                if row['node_group'] and row['node_group'] != '':
                    node_group = row['node_group']

                source_machine_type_uri = uri.MachineType.from_uri(
                    row['machine_type'])
                target_machine_type_uri = uri.MachineType(
                    project=target_project,
                    machine_type=machine_type_mapping.FIND.get(
                        source_machine_type_uri.machine_type,
                        source_machine_type_uri.machine_type),
                    zone=target_instance_uri.zone
                )

                if target_subnet_uri.region != target_instance_uri.region:
                    logging.error(
                        'Instance zone mapping from %s to %s is outside the '
                        'target region %s', source_instance_uri.zone,
                        target_instance_uri.zone, target_subnet_uri.zone)
                    continue

                instance_future.append(
                    executor.submit(instance.create, target_instance_uri,
                                    row['network'], target_subnet_uri,
                                    alias_ip_ranges, node_group, disk_names,
                                    ip, target_machine_type_uri,
                                    source_project, target_service_account,
                                    target_scopes))
                count = count + 1

            tracker = 0
            for future in concurrent.futures.as_completed(instance_future):
                try:
                    instance_name = future.result()
                    tracker = tracker + 1
                    logging.info('%r instance %i out of %i created '
                                 'sucessfully', instance_name, tracker, count)
                except Exception as exc:
                    logging.error(
                        'Instance creation generated an exception: %s', exc)
                    result = False

            if not result:
                return False

            disk_future = []
            for disk_uri, labels in disk_labels.items():
                disk_future.append(
                    executor.submit(disk.setLabels, uri.Disk.from_uri(disk_uri),
                                    json.loads(labels)))

            tracker = 0
            for future in concurrent.futures.as_completed(disk_future):
                try:
                    disk_name = future.result()
                    tracker = tracker + 1
                    logging.info('%r disk %i out of %i updated with labels '
                                 'sucessfully', disk_name, tracker,
                                 len(disk_labels))
                except Exception as exc:
                    logging.error(
                        'Disk update generated an exception: %s', exc)
                    result = False

    return result


def bulk_instance_disable_deletionprotection(file_name) -> bool:

    result = True
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            disable_deletionprotection_future = []
            count = 0
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                source_instance_uri = uri.Instance.from_uri(row['self_link'])
                disable_deletionprotection_future.append(
                    executor.submit(instance.disable_deletionprotection,
                                    source_instance_uri))
                count = count + 1

            tracker = 0
            for future in concurrent.futures.as_completed(
                    disable_deletionprotection_future):
                try:
                    instance_name = future.result()
                    tracker = tracker + 1
                    logging.info('Disabled deletion protection for  '
                                 '%s instance sucessfully', instance_name)
                    logging.info('%i out of %i set ', tracker, count)
                except Exception as exc:
                    logging.error(
                        'Disable deletion protection: exception: %s',
                        exc
                    )
                    result = False
    return result


def query_yes_no(question, default='yes'):
    """Ask a yes/no question via raw_input() and return their answer.

    "question" is a string that is presented to the user.
    "default" is the presumed answer if the user just hits <Enter>.
        It must be "yes" (the default), "no" or None (meaning
        an answer is required of the user).

    The "answer" return value is True for "yes" or False for "no".
    """
    valid = {'yes': True, 'y': True, 'ye': True, 'no': False, 'n': False}
    if default is None:
        prompt = ' [y/n] '
    elif default == 'yes':
        prompt = ' [Y/n] '
    elif default == 'no':
        prompt = ' [y/N] '
    else:
        raise ValueError('invalid default answer: %s' % default)

    while True:
        sys.stdout.write(question + prompt)
        choice = input().lower()
        if default is not None and choice == '':
            return valid[default]
        if choice in valid:
            return valid[choice]
        else:
            sys.stdout.write('Please respond with \'yes\' or \'no\''
                             '(or \'y\' or \'n\').\n')


def filter_records(source_file, filter_file, destination_file):
    machine_names_to_filter = []
    with open(filter_file, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        for row in csv_dict_reader:
            machine_names_to_filter.append(row['name'])

    filtered = []
    headers = fields.HEADERS

    with open(source_file, 'r') as csvfile:
        csv_dict_reader = DictReader(csvfile)
        for row in csv_dict_reader:
            if row['name'] in machine_names_to_filter:
                filtered.append(row)

    overwrite_file = query_yes_no(
        'About to overwrite %s with %i records, please confirm to continue' %
        (destination_file, len(filtered)),
        default='no')

    if overwrite_file:
        with open(destination_file, 'w') as csvfile:
            writer = DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            writer.writerows(filtered)
    return overwrite_file


def release_individual_ips(source_subnet_uri, file_name) -> bool:
    result = True
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        releaseip_future = []
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            count = 0
            for row in csv_dict_reader:
                instance_uri = uri.Instance.from_uri(row['self_link'])
                ips = []
                ips.append(row['internal_ip'])
                for i in range(4):
                    alias_ip = row.get('alias_ip_' + str(i + 1))
                    # original behaviour: only delete AliasIPs in the primary range
                    if alias_ip != '' and row['range_name_' + str(i + 1)] == '':
                        ips.append(alias_ip)
                releaseip_future.append(
                    executor.submit(subnet.release_individual_ips,
                                    source_subnet_uri, instance_uri, ips))
                count += 1
            tracker = 0
            for future in concurrent.futures.as_completed(releaseip_future):
                try:
                    sub_result = future.result()
                    result = sub_result and result
                    tracker += 1
                    logging.info('%i out of %i %s ', tracker, count, 'released' if sub_result else 'failed')
                except Exception as exc:
                    logging.error(
                        'releasing ip generated an exception: %s', exc)
                    result = False
    return result


# main function
def main(step, machine_image_region, source_project,
         source_subnet_uri: uri.Subnet, source_zone, source_zone_2,
         source_zone_3, target_project, target_service_account, target_scopes,
         target_subnet_uri: uri.Subnet, backup_subnet_uri: uri.Subnet,
         source_csv, filter_csv, input_csv, rollback_csv,
         log_level) -> bool:
    """
    The main method to trigger the VM migration.
    """
    if not target_project:
        target_project = source_project
    if not target_subnet_uri:
        target_subnet_uri = copy.deepcopy(source_subnet_uri)
    if source_project != target_project:
        if not target_service_account:
            target_service_account = \
                "{}-compute@developer.gserviceaccount.com".format(
                    project.get_number(target_project))
        if target_scopes:
            target_scopes = target_scopes.split(',')
        else:
            target_scopes = [
                'https://www.googleapis.com/auth/devstorage.read_only',
                'https://www.googleapis.com/auth/logging.write',
                'https://www.googleapis.com/auth/monitoring.write',
                'https://www.googleapis.com/auth/service.management.readonly',
                'https://www.googleapis.com/auth/servicecontrol'
            ]

    numeric_level = getattr(logging, log_level.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError('Invalid log level: %s' % log_level)
    logging.basicConfig(filename='migrator.log',
                        format='%(asctime)s  %(levelname)s %(message)s',
                        level=numeric_level)

    logging.info('executing step %s', step)
    if step == 'prepare_inventory':
        logging.info('Exporting the inventory')
        if subnet.export_instances(source_project, source_zone, source_zone_2,
                                   source_zone_3, source_subnet_uri,
                                   source_csv):
            logging.info('%s now has exported records', source_csv)
        else:
            logging.info('File %s was not overwritten', source_csv)
            return False

    elif step == 'filter_inventory':
        logging.info('Exporting the inventory')
        if subnet.export_instances(source_project, source_zone, source_zone_2,
                                   source_zone_3, source_subnet_uri,
                                   source_csv):
            logging.info('%s now has exported records', source_csv)
        else:
            logging.info('File %s was not overwritten', source_csv)
            return False

        logging.info('Filtering out the exported records')
        if filter_records(source_csv, filter_csv, input_csv):
            logging.info('%s now has filtered records', input_csv)
        else:
            logging.info('File %s was not overwritten', input_csv)
            return False

    elif step == 'prepare_rollback':
        logging.info('Listing the VMs to roll back')
        if subnet.list_instances_for_rollback(source_project, source_zone, backup_subnet_uri, input_csv, rollback_csv):
            logging.info('%s now has exported records', rollback_csv)
        else:
            logging.info('File %s was not overwritten', rollback_csv)
            return False

    elif step == 'rollback_instances':
        logging.info('Performing rollback of instances in file %s', rollback_csv)
        if bulk_move_instances_to_subnet(rollback_csv, source_subnet_uri, 'rollback'):
            logging.info('Instances rollback completed successfully')
        else:
            logging.info('Rollback failed, please see the log file for details')
            return False

    elif step == 'shutdown_instances':
        with open(input_csv, 'r') as read_obj:
            csv_dict_reader = DictReader(read_obj)
            count = len(list(csv_dict_reader))
        shutdown_response = query_yes_no(
            'Are you sure you want to shut down all (%s) '
            'instances present in the inventory ?' % count,
            default='no')

        if shutdown_response:
            logging.info('Shutting down all instances')

            if bulk_instance_shutdown(input_csv):
                logging.info('Successfully shut down all instances')
            else:
                logging.info('Shutting down all instances failed')
                return False
        else:
            return False

    elif step == 'start_instances':
        start_response = query_yes_no(
            'Are you sure you want to start all '
            'instances present in the inventory ?',
            default='no')
        if start_response:
            logging.info('Starting all instances')

            if bulk_instance_start(input_csv):
                logging.info('Successfully started all instances')
            else:
                logging.info('Starting all instances failed')
                return False
        else:
            return False

    elif step == 'create_machine_images':
        logging.info('Creating Machine Images')
        if bulk_image_create(source_project, machine_image_region, input_csv):
            logging.info('Successfully created all machine images')
        else:
            logging.info('Creating all machine images failed')
            return False

    elif step == 'disable_deletionprotection_instances':
        with open(input_csv, 'r') as read_obj:
            csv_dict_reader = DictReader(read_obj)
            count = len(list(csv_dict_reader))
        shutdown_response = query_yes_no(
            'Are you sure you want to disable deletion protection for all (%s) '
            'instances present in the inventory?' % count,
            default='no')

        if shutdown_response:
            logging.info('Disabling deletion protection for all instances')

            if bulk_instance_disable_deletionprotection(input_csv):
                logging.info('Successfully disabled deletion protection for all '
                             'instances')
            else:
                logging.info('Disabling deletion protection for all instances '
                             'failed')
                return False
        else:
            return False

    elif step == 'delete_instances':
        with open(input_csv, 'r') as read_obj:
            csv_dict_reader = DictReader(read_obj)
            count = len(list(csv_dict_reader))
        response = query_yes_no('Are you sure you want to delete the (%s) '
                                'instances and disks present in the inventory '
                                '?' % count, default='no')
        if response:
            logging.info('Deleting all the instances and disks present in the '
                         'inventory')
            if bulk_delete_instances_and_disks(input_csv, source_project):
                logging.info('Successfully deleted all instances and disks '
                             'present in the inventory')
            else:
                logging.info('Deleting all instances and disks in the '
                             'inventory failed')
                return False
        else:
            logging.info('Not deleting any instances nor disks')
            return False

    elif step == 'clone_subnet':
        logging.info('Cloning Subnet')
        if subnet.duplicate(source_subnet_uri, target_subnet_uri):
            logging.info('Successfully cloned subnet in the provided region')
        else:
            logging.info('Cloning subnet in the provided region failed')
            return False

    elif step == 'add_machineimage_iampolicies':
        logging.info('Setting IAM policies of created machine images with '
                     'input_csv=%s, source_project=%s, target_service_account='
                     '%s', input_csv, source_project, target_service_account)
        if add_machineimage_iampolicies(input_csv, source_project,
                                        target_service_account):
            logging.info('Successfully set IAM policies of created machine '
                         'images')
        else:
            logging.info('Setting IAM policies of created machine images '
                         'failed')
            return False

    elif step == 'create_instances':
        logging.info(
            'Creating instances retaining the original ips in file %s with '
            'source_project=%s, target_project=%s, target_service_account=%s, '
            'target_scopes=%s, target_subnet_uri=%s', input_csv,
            source_project, target_project, target_service_account,
            target_scopes, target_subnet_uri)
        if bulk_create_instances(input_csv, target_project,
                                 target_service_account, target_scopes,
                                 target_subnet_uri, source_project, True):
            logging.info('Instances created successfully')
        else:
            logging.error('Creation of instances failed')
            return False

    elif step == 'create_instances_without_ip':
        logging.info(
            'Creating instances without retaining the original ips in file %s '
            'with source_project=%s, target_project=%s, target_service_account'
            '=%s, target_scopes=%s, target_subnet_uri=%s', input_csv,
            source_project, target_project, target_service_account,
            target_scopes, target_subnet_uri)
        if bulk_create_instances(input_csv, target_project,
                                 target_service_account, target_scopes,
                                 target_subnet_uri, source_project, False):
            logging.info('Instances created successfully')
        else:
            logging.error('Creation of instances failed')
            return False

    elif step == 'backup_instances':
        logging.info(
            'Backing up instances in file %s to backup_subnet_uri=%s',
            input_csv, backup_subnet_uri)
        if bulk_move_instances_to_subnet(input_csv, backup_subnet_uri, 'backup'):
            logging.info('Instances backed up successfully')
        else:
            logging.error('Backup of instances failed')
            return False

    elif step == 'release_ip_for_subnet':
        logging.info('Releasing all IPs of project %s present in '
                     'subnet %s', source_project, source_subnet_uri)
        if subnet.release_ip(source_project, source_subnet_uri):
            logging.info('All IPs of project %s present in subnet %s released '
                         'sucessfully', source_project,  source_subnet_uri)
        else:
            logging.error('Releasing the IPs of project %s present in subnet '
                          '%s failed', source_project, source_subnet_uri)
            return False

    elif step == 'release_ip':
        logging.info('Releasing the IPs present in the %s file', input_csv)
        if release_individual_ips(source_subnet_uri, input_csv):
            logging.info('IPs present in the file %s released successfully',
                         input_csv)
        else:
            logging.error('Releasing ips present in the file %s failed',
                          input_csv)
            return False
    else:
        logging.error('Step %s unknown', step)
        return False

    return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        '--step',
        default='prepare_inventory',
        help='Which step to execute. '
        'The steps can be any of prepare_inventory | '
        'filter_inventory | shutdown_instances | create_machine_images |  '
        'delete_instances | release_ip_for_subnet | release_ip '
        '| clone_subnet | add_machineimage_iampolicies | create_instances | '
        'create_instances_without_ip')
    parser.add_argument('--machine_image_region',
                        help='Compute Engine region to deploy to.')
    parser.add_argument('--source_project',
                        help='Source project ID')
    parser.add_argument('--source_subnet',
                        help='Source subnet uri')
    parser.add_argument('--source_zone',
                        help='Source zone where the existing subnet exist')
    parser.add_argument(
        '--source_zone_2',
        help='Second source zone where the existing subnet exist')
    parser.add_argument(
        '--source_zone_3',
        help='Third source zone where the existing subnet exist')
    parser.add_argument('--target_project',
                        help='Target project ID')
    parser.add_argument('--target_project_sa',
                        help='Target service account in target project')
    parser.add_argument('--target_project_sa_scopes', help='Target service '
                        'account scopes in the target project')
    parser.add_argument('--target_subnet',
                        help='Target subnet uri')
    parser.add_argument('--backup_subnet',
                        help='Backup subnet uri')
    parser.add_argument('--source_csv',
                        default='source.csv',
                        help='The csv with the full dump of movable VMs.')
    parser.add_argument('--filter_csv',
                        default='filter.csv',
                        help='filter file containing names of '
                        'instances to filter from overall inventory')
    parser.add_argument('--input_csv',
                        default='input.csv',
                        help='destination file to export the data to')
    parser.add_argument('--rollback_csv',
                        default='rollback.csv',
                        help='destination file to list the VMs to rollback to')
    parser.add_argument('--log_level', default='INFO', help='Log Level')
    args = parser.parse_args()

    if not main(args.step, args.machine_image_region, args.source_project,
                uri.Subnet.from_uri(args.source_subnet), args.source_zone,
                args.source_zone_2, args.source_zone_3, args.target_project,
                args.target_project_sa, args.target_project_sa_scopes,
                uri.Subnet.from_uri(args.target_subnet),
                uri.Subnet.from_uri(args.backup_subnet),
                args.source_csv, args.filter_csv, args.input_csv, args.rollback_csv,
                args.log_level):
        sys.exit(1)
