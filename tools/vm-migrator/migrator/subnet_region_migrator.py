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


def bulk_create_instances(file_name, target_subnet, retain_ip):
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
                    executor.submit(instance.create, parsed_link['project'],
                                    target_zone, row['network'], target_subnet,
                                    row['name'], alias_ip_ranges, node_group,
                                    disk_names, ip, row['machine_type']))
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
def main(project,
         source_zone,
         source_zone_2,
         source_zone_3,
         source_subnet,
         machine_image_region,
         target_subnet,
         target_region,
         source_region,
         subnet_name,
         step,
         log,
         file_name='export.csv',
         filter_file_name='filter.csv'):
    """
    The main method to trigger the VM migration.
    """
    numeric_level = getattr(logging, log.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError('Invalid log level: %s' % log)
    logging.basicConfig(filename='migrator.log',
                        format='%(asctime)s  %(levelname)s %(message)s',
                        level=numeric_level)

    logging.info('executing step %s', step)
    if step == 'prepare_inventory':
        logging.info('Preparing the inventory to be exported')
        subnet.export_instances(project, source_zone, source_zone_2,
                                source_zone_3, source_subnet, 'source.csv')
    if step == 'filter_inventory':
        logging.info('Preparing the inventory to be exported')
        subnet.export_instances(project, source_zone, source_zone_2,
                                source_zone_3, source_subnet, 'source.csv')
        logging.info('filtering out the inventory')
        overwrite_file = filter_records('source.csv', filter_file_name,
                                        file_name)
        if overwrite_file:
            logging.info('%s now has filtered records', file_name)
        else:
            logging.info('File %s was not overwriten', file_name)

    if step == 'shutdown_instances':
        with open(file_name, 'r') as read_obj:
            csv_dict_reader = DictReader(read_obj)
            count = len(list(csv_dict_reader))
        shutdown_response = query_yes_no(
            'Are you sure you want to shutdown the (%s)'
            'instances present in the inventory ?' % count,
            default='no')
        if shutdown_response:
            logging.info('Shutting down the instances')
            bulk_instance_shutdown(file_name)

    if step == 'start_instances':
        start_response = query_yes_no(
            'Are you sure you want to start the'
            'instances present in the inventory ?',
            default='no')
        if start_response:
            logging.info('Starting the instances')
            bulk_instance_start(file_name)

    if step == 'create_machine_images':
        logging.info('Creating Machine Images')
        bulk_image_create(project, machine_image_region, file_name)

    if step == 'delete_instances':
        with open(file_name, 'r') as read_obj:
            csv_dict_reader = DictReader(read_obj)
            count = len(list(csv_dict_reader))
        response = query_yes_no('Are you sure you want to delete the (%s)'
                                'instances present in the inventory ?' % count,
                                default='no')
        if response:
            logging.info('Deleting all the instances present in the inventory')
            bulk_delete_instances(file_name)
            logging.info('Deleting all the disks present in the inventory')
            bulk_delete_disks(file_name)
        else:
            logging.info('Not deleting any instances')

    if step == 'clone_subnet':
        logging.info('Cloning Subnet')
        subnet.duplicate(project, subnet_name, source_region, target_region)
        logging.info('Subnet sucessfully cloned in the provided region')

    if step == 'create_instances':
        logging.info('Creating machine instances')
        bulk_create_instances(file_name, target_subnet, True)
        logging.info('Instances created successfully')

    if step == 'create_instances_without_ip':
        logging.info(
            'Creating machine instances without retaining the original ips')
        bulk_create_instances(file_name, target_subnet, False)
        logging.info('Instances created successfully')

    if step == 'release_ip_for_subnet':
        logging.info('Releasing all the Ips present in the subnet')
        subnet.release_ip(project, source_region, source_subnet)
        logging.info('ips present in %s released subcessfully', file_name)

    if step == 'release_ip':
        logging.info('Releasing the ips present in the export')
        release_ips_from_file(file_name)
        logging.info('All the IPs of the Subnet released sucessfully')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--project', help='Your Google Cloud project')
    parser.add_argument('--input_csv',
                        default='',
                        help='The csv file containing vms to move.')
    parser.add_argument('--target_subnet',
                        default='',
                        help='Compute Engine subnet to deploy to.')
    parser.add_argument('--machine_image_region',
                        default='us-central1',
                        help='Compute Engine region to deploy to.')
    parser.add_argument('--target_region',
                        default='us-east1-a',
                        help='Target region for the new subnet')
    parser.add_argument('--source_zone',
                        default='us-east1-a',
                        help='Source zone where the existing subnet exist')
    parser.add_argument(
        '--source_zone_2',
        default=None,
        help='Second source zone where the existing subnet exist')
    parser.add_argument(
        '--source_zone_3',
        default=None,
        help='Third source zone where the existing subnet exist')
    parser.add_argument('--source_region',
                        default='us-east1-a',
                        help='Source region where the existing subnet exist')
    parser.add_argument('--subnet_name',
                        default='us-east1-a',
                        help='Source subnet name')
    parser.add_argument('--source_subnet',
                        default='us-east1-a',
                        help='Source subnet self link')
    parser.add_argument('--export_file',
                        default='export.csv',
                        help='destination file to export the data to')
    parser.add_argument('--filter_file',
                        default='filter.csv',
                        help='filter file containing names of '
                        'instances to filter from overall inventory')
    parser.add_argument('--log', default='INFO', help='Log Level')
    parser.add_argument(
        '--step',
        default='prepare_inventory',
        help='Which step to execute. '
        'The steps can be any of prepare_inventory | '
        'filter_inventory | shutdown_instances | create_machine_images |  '
        'delete_instances | release_ip_for_subnet | release_ip '
        '| clone_subnet | create_instances | create_instances_without_ip')
    args = parser.parse_args()

main(args.project, args.source_zone, args.source_zone_2, args.source_zone_3,
     args.source_subnet, args.machine_image_region, args.target_subnet,
     args.target_region, args.source_region, args.subnet_name, args.step,
     args.log, args.export_file, args.filter_file)
