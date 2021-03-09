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
This file deals with operations on subnets.
"""
import time
import re
import logging
import googleapiclient.discovery
from googleapiclient.errors import HttpError
from csv import DictWriter
from .exceptions import GCPOperationException, InvalidFormatException
from . import instance
from . import disk
from . import fields


def get_compute():
    compute = googleapiclient.discovery.build('compute',
                                              'beta',
                                              cache_discovery=False)
    logging.getLogger('googleapiclient.discovery_cache').setLevel(
        logging.ERROR)
    return compute


def get_alias_ip_name(project, region, subnet, ip):
    compute = get_compute()
    subnet = 'https://www.googleapis.com/compute/beta/' + subnet

    if ip.endswith('/32'):
        # Extract the ip address from something like 10.0.0.2/32
        length_ip = len(ip) - 3
        ip = ip[0:length_ip]
    else:
        return None
    # Subnet should be of the form
    # https://www.googleapis.com/compute/beta/projects/pso-suchit/regions/us-east1/subnetworks/sub-01
    ips = compute.addresses().list(project=project,
                                   region=region,
                                   filter='(subnetwork="' + subnet +
                                   '") (address="' + ip + '")').execute()
    if ips.get('items') and len(ips.get('items')) == 1:
        ip_details = ips.get('items')[0]
        return ip_details['name']
    else:
        logging.info('Alias ip %s was not reserved', ip)
        return None


def export_instances(project, zone, zone_2, zone_3, subnet, file_name):
    compute = get_compute()

    result_zone_2 = {}
    result_zone_3 = {}

    logging.info('fetching the inventory for the source subnet %s and zone %s',
                 subnet, zone)
    result = compute.instances().list(project=project,
                                      zone=zone,
                                      maxResults=10000).execute()
    if not result.get('items'):
        result = {'items': []}

    if zone_2:
        logging.info(
            'fectching the inventory for the source subnet %s and zone %s',
            subnet, zone_2)
        result_zone_2 = compute.instances().list(project=project,
                                                 zone=zone_2,
                                                 maxResults=10000).execute()
    if zone_3:
        logging.info(
            'fectching the inventory for the source subnet %s and zone %s',
            subnet, zone_3)
        result_zone_3 = compute.instances().list(project=project,
                                                 zone=zone_3,
                                                 maxResults=10000).execute()

    mydict = []

    if result_zone_2.get('items') and zone_2:
        result['items'] = result['items'] + result_zone_2.get('items')

    if result_zone_3.get('items') and zone_3:
        result['items'] = result['items'] + result_zone_3.get('items')

    for instances in result['items']:

        headers = fields.HEADERS
        if instances['networkInterfaces'][0]['subnetwork'].endswith(subnet):
            csv = {
                'name': instances['name'],
                'id': instances['id'],
                'machine_type': instances['machineType'],
                'self_link': instances['selfLink'],
                'network': instances['networkInterfaces'][0]['network'],
                'internal_ip': instances['networkInterfaces'][0]['networkIP'],
                'subnet': instances['networkInterfaces'][0]['subnetwork']
            }

            for i, disks in enumerate(instances['disks']):
                if i < 9:
                    csv['device_name_' + str(i + 1)] = disks['deviceName']
                    csv['disk_name_' + str(i + 1)] = disk.parse_self_link(
                        disks['source'])['name']
                else:
                    logging.warning(
                        'Too many disks: dropping disk name %s with and '
                        'device name %s',
                        disk.parse_self_link(disks['source'])['name'],
                        disks['deviceName'])

            alias_ips = instances['networkInterfaces'][0].get('aliasIpRanges')
            if alias_ips:
                logging.info('Found Alias IP for %s', instances['name'])
                for i in range(len(alias_ips)):
                    csv['alias_ip_' + str(i + 1)] = alias_ips[i]['ipCidrRange']

                    ip_name = get_alias_ip_name(
                        project,
                        instance.get_region_from_zone(instances['zone']),
                        subnet, alias_ips[i]['ipCidrRange'])
                    if ip_name:
                        csv['alias_ip_name_' + str(i + 1)] = ip_name

                    if alias_ips[i].get('subnetworkRangeName'):
                        csv['range_name_' +
                            str(i + 1)] = alias_ips[i]['subnetworkRangeName']

            if instance.is_hosted_on_sole_tenant(instances):
                csv['node_group'] = instance.get_node_group(instances)

            mydict.append(csv)
        with open(file_name, 'w') as csvfile:

            writer = DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            writer.writerows(mydict)

        logging.info('Successfully written %i records to %s', len(mydict),
                     file_name)


def release(compute, project, region, address):
    try:
        logging.info('Releasing ip %s', address)
        result = compute.addresses().delete(project=project,
                                            region=region,
                                            address=address).execute()
        wait_for_operation(compute, project, region, result['name'])
    except HttpError as err:
        logging.error('The IP address %s was not found', address)
        logging.error(err)
        print(err)


def release_specific_ips(project, region, ips):
    compute = get_compute()
    for address in ips:
        release(compute, project, region, address)


def release_ip(project, region, subnet):
    compute = get_compute()
    subnet = 'https://www.googleapis.com/compute/beta/' + subnet
    # Subnet should be of the form
    # https://www.googleapis.com/compute/beta/projects/pso-suchit/regions/us-east1/subnetworks/sub-01
    ips = compute.addresses().list(project=project,
                                   region=region,
                                   filter='subnetwork="' + subnet +
                                   '"').execute()
    if ips.get('items'):
        for addresses in ips['items']:
            ip_name = addresses['name']
            release(compute, project, region, ip_name)
    else:
        logging.warn(
            'No reserved internal IP addresses found in the subnet %s', subnet)


def wait_for_operation(compute, project, region, operation):
    logging.info('Waiting for operation to finish...')
    while True:
        result = compute.regionOperations().get(project=project,
                                                region=region,
                                                operation=operation).execute()

        if result['status'] == 'DONE':
            logging.info('done.')
            if 'error' in result:
                print(result['error'])
                raise GCPOperationException(result['error'])
            return result

        time.sleep(5)


def duplicate(project, source_subnet_region, source_subnet,
              destination_project, destination_region, destination_subnet):
    compute = get_compute()
    subnet_request = compute.subnetworks().get(project=project,
                                               region=source_subnet_region,
                                               subnetwork=source_subnet)
    config = subnet_request.execute()
    config['region'] = destination_region
    logging.info('starting subnet %s deletion', source_subnet)
    delete_operation = delete_subnetwork(compute, project,
                                         source_subnet_region, source_subnet)
    wait_for_operation(compute, project, source_subnet_region,
                       delete_operation['name'])
    logging.info('subnet %s deleted successfully', source_subnet)

    logging.info('re creating subnet %s in region %s', source_subnet,
                 destination_region)
    del config["selfLink"]
    config["name"] = destination_subnet
    insert_operation = \
        compute.subnetworks() .insert(project=destination_project,
                                      region=destination_region,
                                      body=config).execute()
    wait_for_operation(compute, destination_project, destination_region,
                       insert_operation['name'])
    logging.info('new subnet added successfully')


def get_network(subnet_selflink):
    if subnet_selflink.startswith('projects'):
        subnet_selflink = '/' + subnet_selflink
    response = \
        re.search(r'\/projects\/(.*?)\/regions\/(.*?)\/subnetworks\/(.*?)$',
                  subnet_selflink)
    if len(response.groups()) != 3:
        raise InvalidFormatException('Invalid SelfLink Format')

    'projects/{project}/regions/{region}/subnetworks/{resourceId}'
    result = \
        get_compute().subnetworks().get(project=response.group(1),
                                        region=response.group(2),
                                        subnetwork=response.group(3)).execute()
    return result['network'] if 'network' in result else None


def list_subnets(compute, project, region):
    result = compute.subnetworks().list(project=project,
                                        region=region).execute()
    return result['items'] if 'items' in result else None


def delete_subnetwork(compute, project, region, subnetwork):
    return compute.subnetworks().delete(project=project,
                                        region=region,
                                        subnetwork=subnetwork).execute()
