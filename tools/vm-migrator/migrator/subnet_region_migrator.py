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
import time
from . import machine_image
from . import instance
from . import disk
from . import subnet
from . import zone_mapping
from . import fields
from . import project
from csv import DictReader
from csv import DictWriter


def bulk_image_create(project, machine_image_region, file_name='export.csv'):

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


def bulk_delete_instances(file_name):
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        count = 0
        tracker = 0
        instance_future = []
        instance_name = ''

        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                parsed_link = instance.parse_self_link(row['self_link'])
                instance_future.append(
                    executor.submit(instance.delete, parsed_link['project'],
                                    parsed_link['zone'], row['name']))
                count = count + 1

            for future in concurrent.futures.as_completed(instance_future):
                try:
                    instance_name = future.result()
                    tracker = tracker + 1
                    logging.info('%r machine deleted sucessfully',
                                 instance_name)
                    logging.info('%i out of %i deleted', tracker, count)
                except Exception as exc:
                    logging.error(
                        'machine deletion generated an exception: %s', exc)


def bulk_delete_disks(file_name):
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        count = 0
        tracker = 0
        disk_future = []
        disk_name = ''
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                parsed_link = instance.parse_self_link(row['self_link'])
                for i in range(9):
                    if row['disk_name_' + str(i + 1)] != '':
                        disk_future.append(
                            executor.submit(disk.delete,
                                            parsed_link['project'],
                                            parsed_link['zone'], row['name'],
                                            row['disk_name_' + str(i + 1)]))
                count = count + 1

            for future in concurrent.futures.as_completed(disk_future):
                try:
                    disk_name = future.result()
                    tracker = tracker + 1
                    logging.info('%r disk deleted sucessfully', disk_name)
                    logging.info('%i out of %i deleted', tracker, count)
                except Exception as exc:
                    logging.error('disk deletion generated an exception: %s',
                                  exc)


def bulk_instance_shutdown(file_name):
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
                parsed_link = instance.parse_self_link(row['self_link'])
                instance_future.append(
                    executor.submit(instance.shutdown, parsed_link['project'],
                                    parsed_link['zone'],
                                    parsed_link['instance_id']))
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


def bulk_instance_start(file_name):
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
                parsed_link = instance.parse_self_link(row['self_link'])
                instance_future.append(
                    executor.submit(instance.start, parsed_link['project'],
                                    parsed_link['zone'],
                                    parsed_link['instance_id']))
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


def set_machineimage_iampolicies(file_name, source_project,
                                 target_service_account):

    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        count = 0
        tracker = 0
        machineimage_future = []
        machine_name = ''
        # We can use a with statement to ensure threads are cleaned up promptly
        with concurrent.futures.ThreadPoolExecutor(
                max_workers=100) as executor:
            # Start the load operations and mark each future with its URL
            for row in csv_dict_reader:
                machineimage_future.append(
                    executor.submit(machine_image.set_iam_policy,
                                    source_project, row['name'],
                                    target_service_account))
                count = count + 1

            for future in concurrent.futures.as_completed(machineimage_future):
                try:
                    machine_name = future.result()
                    tracker = tracker + 1
                    logging.info('Set IAM policy for service account to '
                                 '%r machine image sucessfully', machine_name)
                    logging.info('%i out of %i set ', tracker, count)
                except Exception as exc:
                    logging.error(
                        'machine iam policy generated an exception: %s', exc)


def bulk_create_instances(file_name, target_project, target_service_account,
                          target_scopes, target_subnet, source_project,
                          retain_ip):
    target_network_selflink = subnet.get_network(target_subnet)
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
                ip = None
                if retain_ip:
                    ip = row['internal_ip']

                if target_network_selflink:
                    row['network'] = target_network_selflink

                parsed_link = instance.parse_self_link(row['self_link'])
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
                # This supports up to 4 disks
                disk_names = {}
                for i in range(9):
                    if row['device_name_' + str(i + 1)] != '':
                        disk_names[row['device_name_' +
                                       str(i + 1)]] = row['disk_name_' +
                                                          str(i + 1)]

                node_group = None
                if row['node_group'] and row['node_group'] != '':
                    node_group = row['node_group']

                target_zone = zone_mapping.FIND[parsed_link['zone']]
                instance_future.append(
                    executor.submit(instance.create, target_project,
                                    target_zone, row['network'], target_subnet,
                                    row['name'], alias_ip_ranges, node_group,
                                    disk_names, ip, row['machine_type'],
                                    source_project, target_service_account,
                                    target_scopes))
                count = count + 1

            for future in concurrent.futures.as_completed(instance_future):
                try:
                    machine_name = future.result()
                    tracker = tracker + 1
                    logging.info('%r machine created sucessfully',
                                 machine_name)
                    logging.info('%i out of %i created ', tracker, count)
                except Exception as exc:
                    logging.error(
                        'machine creation generated an exception: %s', exc)


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


def release_ips_from_file(file_name):
    with open(file_name, 'r') as read_obj:
        csv_dict_reader = DictReader(read_obj)
        for row in csv_dict_reader:
            parsed_link = instance.parse_self_link(row['self_link'])
            region = instance.get_region_from_zone(parsed_link['zone'])
            project = parsed_link['project']
            ips = []
            # The first ip for a machine is reserved
            # with the same name as the VM
            ips.append(row['name'])
            # Find the reserved alias ips
            for i in range(4):
                ip_name = row.get('alias_ip_name_' + str(i + 1))
                if ip_name != '' and row['range_name_' + str(i + 1)] == '':
                    ips.append(ip_name)
            subnet.release_specific_ips(project, region, ips)
            time.sleep(2)  # Prevent making too many requests in loop


# main function
def main(step, machine_image_region,
         source_project, source_region, source_subnetwork,
         source_zone, source_zone_2, source_zone_3,
         target_project, target_service_account, target_scopes,
         target_region, target_subnetwork,
         source_csv, filter_csv, input_csv, log_level):
    """
    The main method to trigger the VM migration.
    """
    if not target_project:
        target_project = source_project
    if not target_region:
        target_region = source_region
    if not target_subnetwork:
        target_subnetwork = source_subnetwork
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

    target_subnet_selflink = 'projects/{}/regions/{}/subnetworks/{}'.format(
        target_project, target_region, target_subnetwork)
    source_subnet_selflink = 'projects/{}/regions/{}/subnetworks/{}'.format(
        source_project, source_region, source_subnetwork)

    numeric_level = getattr(logging, log_level.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError('Invalid log level: %s' % log_level)
    logging.basicConfig(filename='migrator.log',
                        format='%(asctime)s  %(levelname)s %(message)s',
                        level=numeric_level)

    logging.info('executing step %s', step)
    if step == 'prepare_inventory':
        logging.info('Preparing the inventory to be exported')
        subnet.export_instances(source_project, source_zone, source_zone_2,
                                source_zone_3, source_subnet_selflink,
                                source_csv)
    if step == 'filter_inventory':
        logging.info('Preparing the inventory to be exported')
        subnet.export_instances(source_project, source_zone, source_zone_2,
                                source_zone_3, source_subnet_selflink,
                                source_csv)
        logging.info('filtering out the inventory')
        overwrite_file = filter_records(source_csv, filter_csv, input_csv)
        if overwrite_file:
            logging.info('%s now has filtered records', input_csv)
        else:
            logging.info('File %s was not overwriten', input_csv)

    if step == 'shutdown_instances':
        with open(input_csv, 'r') as read_obj:
            csv_dict_reader = DictReader(read_obj)
            count = len(list(csv_dict_reader))
        shutdown_response = query_yes_no(
            'Are you sure you want to shutdown the (%s) '
            'instances present in the inventory ?' % count,
            default='no')
        if shutdown_response:
            logging.info('Shutting down the instances')
            bulk_instance_shutdown(input_csv)

    if step == 'start_instances':
        start_response = query_yes_no(
            'Are you sure you want to start the'
            'instances present in the inventory ?',
            default='no')
        if start_response:
            logging.info('Starting the instances')
            bulk_instance_start(input_csv)

    if step == 'create_machine_images':
        logging.info('Creating Machine Images')
        bulk_image_create(source_project, machine_image_region, input_csv)

    if step == 'delete_instances':
        with open(input_csv, 'r') as read_obj:
            csv_dict_reader = DictReader(read_obj)
            count = len(list(csv_dict_reader))
        response = query_yes_no('Are you sure you want to delete the (%s) '
                                'instances present in the inventory ?' % count,
                                default='no')
        if response:
            logging.info('Deleting all the instances present in the inventory')
            bulk_delete_instances(input_csv)
            logging.info('Deleting all the disks present in the inventory')
            bulk_delete_disks(input_csv)
        else:
            logging.info('Not deleting any instances')

    if step == 'clone_subnet':
        logging.info('Cloning Subnet')
        subnet.duplicate(source_project, source_region, source_subnetwork,
                         target_project, target_region, target_subnetwork)
        logging.info('Subnet sucessfully cloned in the provided region')

    if step == 'set_machineimage_iampolicies':
        logging.info('Setting IAM policies of created machine images')
        set_machineimage_iampolicies(input_csv, source_project,
                                     target_service_account)
        logging.info('Successfully set IAM policies of created machine images')

    if step == 'create_instances':
        logging.info('Creating machine instances')
        bulk_create_instances(input_csv, target_project,
                              target_service_account, target_scopes,
                              target_subnet_selflink,
                              source_project, True)
        logging.info('Instances created successfully')

    if step == 'create_instances_without_ip':
        logging.info(
            'Creating machine instances without retaining the original ips')
        bulk_create_instances(input_csv, target_project,
                              target_service_account, target_scopes,
                              target_subnet_selflink,
                              source_project, False)
        logging.info('Instances created successfully')

    if step == 'release_ip_for_subnet':
        logging.info('Releasing all the Ips present in the subnet')
        subnet.release_ip(source_project, source_region,
                          source_subnet_selflink)
        logging.info('All the IPs of the Subnet released sucessfully')

    if step == 'release_ip':
        logging.info('Releasing the ips present in the export')
        release_ips_from_file(input_csv)
        logging.info('ips present in %s released subcessfully', input_csv)


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
        '| clone_subnet | set_machineimage_iampolicies | create_instances | '
        'create_instances_without_ip')
    parser.add_argument('--machine_image_region',
                        help='Compute Engine region to deploy to.')
    parser.add_argument('--source_project',
                        help='Source project ID')
    parser.add_argument('--source_region',
                        help='Source subnetwork name')
    parser.add_argument('--source_subnetwork',
                        help='Source subnetwork name')
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
    parser.add_argument('--target_region',
                        help='Target region')
    parser.add_argument('--target_subnetwork',
                        help='Target subnetwork name')
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
    parser.add_argument('--log_level', default='INFO', help='Log Level')
    args = parser.parse_args()

    main(args.step, args.machine_image_region,
         args.source_project, args.source_region, args.source_subnetwork,
         args.source_zone, args.source_zone_2, args.source_zone_3,
         args.target_project, args.target_project_sa,
         args.target_project_sa_scopes, args.target_region,
         args.target_subnetwork,
         args.source_csv, args.filter_csv, args.input_csv, args.log_level)
