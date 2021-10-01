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
import logging
import googleapiclient.discovery
from googleapiclient.errors import HttpError
from csv import DictWriter
from .exceptions import GCPOperationException
from . import instance
from . import fields
from . import uri


def get_compute():
    compute = googleapiclient.discovery.build('compute',
                                              'beta',
                                              cache_discovery=False)
    logging.getLogger('googleapiclient.discovery_cache').setLevel(
        logging.ERROR)
    return compute


def get_alias_ip_name(instance_uri: uri.Instance, subnet_uri: uri.Subnet, ip):
    compute = get_compute()

    if ip.endswith('/32'):
        # Extract the ip address from something like 10.0.0.2/32
        length_ip = len(ip) - 3
        ip = ip[0:length_ip]
    else:
        return None
    # Subnet should be of the form
    # https://www.googleapis.com/compute/beta/projects/pso-suchit/regions/us-east1/subnetworks/sub-01
    ips = compute.addresses().list(project=instance_uri.project,
                                   region=instance_uri.region,
                                   filter='(subnetwork="' +
                                   subnet_uri.abs_beta_uri +
                                   '") (address="' + ip + '")').execute()
    if ips.get('items') and len(ips.get('items')) == 1:
        ip_details = ips.get('items')[0]
        return ip_details['name']
    else:
        logging.info('Alias ip %s was not reserved', ip)
        return None


def export_instances(project, zone, zone_2, zone_3, subnet_uri: uri.Subnet,
                     file_name):
    compute = get_compute()

    result_zone_2 = {}
    result_zone_3 = {}

    logging.info('fetching the inventory for the source subnet %s and zone %s',
                 subnet_uri.uri, zone)
    result = compute.instances().list(project=project,
                                      zone=zone,
                                      maxResults=10000).execute()
    if not result.get('items'):
        result = {'items': []}

    if zone_2:
        logging.info(
            'fetching the inventory for the source subnet %s and zone %s',
            subnet_uri.uri, zone_2)
        result_zone_2 = compute.instances().list(project=project,
                                                 zone=zone_2,
                                                 maxResults=10000).execute()
    if zone_3:
        logging.info(
            'fetching the inventory for the source subnet %s and zone %s',
            subnet_uri.uri, zone_3)
        result_zone_3 = compute.instances().list(project=project,
                                                 zone=zone_3,
                                                 maxResults=10000).execute()

    mydict = []

    if result_zone_2.get('items') and zone_2:
        result['items'] = result['items'] + result_zone_2.get('items')

    if result_zone_3.get('items') and zone_3:
        result['items'] = result['items'] + result_zone_3.get('items')

    logging.info('Identified %i potential instance(s) in the given zones',
                 len(result['items']))

    for instances in result['items']:

        headers = fields.HEADERS
        if instances['networkInterfaces'][0]['subnetwork'] \
                .endswith(subnet_uri.uri):
            csv = {
                'name': instances['name'],
                'id': instances['id'],
                'machine_type': instances['machineType'],
                'self_link': instances['selfLink'],
                'network': instances['networkInterfaces'][0]['network'],
                'internal_ip': instances['networkInterfaces'][0]['networkIP'],
                'subnet': instances['networkInterfaces'][0]['subnetwork']
            }
            instance_uri = uri.Instance.from_uri(instances['selfLink'])

            for i, disks in enumerate(instances['disks']):
                disk_uri = uri.Disk.from_uri(disks['source'])
                if i < 9:
                    csv['device_name_' + str(i + 1)] = disks['deviceName']
                    csv['disk_name_' + str(i + 1)] = disk_uri.name
                else:
                    logging.warning(
                        'Too many disks: dropping disk name %s with and '
                        'device name %s', disk_uri.name, disks['deviceName'])

            alias_ips = instances['networkInterfaces'][0].get('aliasIpRanges')
            if alias_ips:
                logging.info('Found Alias IP for %s', instances['name'])
                for i in range(len(alias_ips)):
                    csv['alias_ip_' + str(i + 1)] = alias_ips[i]['ipCidrRange']

                    ip_name = get_alias_ip_name(instance_uri, subnet_uri,
                                                alias_ips[i]['ipCidrRange'])
                    if ip_name:
                        csv['alias_ip_name_' + str(i + 1)] = ip_name

                    if alias_ips[i].get('subnetworkRangeName'):
                        csv['range_name_' +
                            str(i + 1)] = alias_ips[i]['subnetworkRangeName']

            if instance.is_hosted_on_sole_tenant(instances):
                csv['node_group'] = instance.get_node_group(instances)

            mydict.append(csv)
        else:
            logging.debug(
                'Ignoring VM {} in subnet {} (looking for subnet {})'.format(
                    instances['name'],
                    instances['networkInterfaces'][0]['subnetwork'],
                    subnet_uri.uri))

    with open(file_name, 'w') as csvfile:

        writer = DictWriter(csvfile, fieldnames=headers)
        writer.writeheader()
        writer.writerows(mydict)

    logging.info('Successfully written %i records to %s', len(mydict),
                 file_name)

    return True


def release(compute, project_region_uri: uri.ProjectRegion, address) \
        -> bool:

    try:
        logging.info('Releasing IP address %s in project %s', address,
                     project_region_uri)
        result = compute.addresses().delete(project=project_region_uri.project,
                                            region=project_region_uri.region,
                                            address=address).execute()
        wait_for_operation(compute, project_region_uri, result['name'])
    except HttpError as err:
        logging.error('Error while releasing IP address %s: %s', address, err)
        return False
    return True


def release_individual_ips(subnet_uri: uri.Subnet, instance_uri: uri.Instance,
                           ips) -> bool:
    result = True
    compute = get_compute()
    for ip in ips:
        ips_result = compute.addresses() \
            .list(project=instance_uri.project, region=instance_uri.region,
                  filter='(address="{}") AND (subnetwork="{}")'
                  .format(ip, subnet_uri.abs_beta_uri)).execute()
        if 'items' in ips_result and 1 == len(ips_result['items']):
            result = release(compute, instance_uri,
                             ips_result['items'][0]['name']) and result
        else:
            logging.info('Deletion of internal ip %s for instance %s not '
                         'needed (no reserved static ip found)', ip,
                         instance_uri.uri)
    return result


def release_ip(project: str, subnet_uri: uri.Subnet) -> bool:
    compute = get_compute()

    # Subnet should be of the form
    # https://www.googleapis.com/compute/beta/projects/pso-suchit/regions/us-east1/subnetworks/sub-01
    # The project is where the VMs are,
    # which can be different from the host project where the subnet lives
    ips = compute.addresses().list(project=project,
                                   region=subnet_uri.region,
                                   filter='subnetwork="' +
                                   subnet_uri.abs_beta_uri + '"').execute()

    if ips.get('items'):
        for addresses in ips['items']:
            ip_name = addresses['name']
            return release(compute,
                           uri.ProjectRegion(project, subnet_uri.region),
                           ip_name)
    else:
        logging.warn(
            'No reserved internal IP addresses found in the subnet %s',
            subnet_uri.uri)
        return True


def wait_for_operation(compute, project_region_uri: uri.ProjectRegion,
                       operation) -> object:
    logging.info('Waiting for operation to finish...')
    while True:
        result = compute.regionOperations() \
            .get(project=project_region_uri.project,
                 region=project_region_uri.region,
                 operation=operation).execute()

        if result['status'] == 'DONE':
            logging.info('done.')
            if 'error' in result:
                print(result['error'])
                raise GCPOperationException(result['error'])
            return result

        time.sleep(5)


def duplicate(source_subnet_uri: uri.Subnet, target_subnet_uri: uri.Subnet) \
        -> bool:
    compute = get_compute()
    subnet_request = compute.subnetworks() \
        .get(project=source_subnet_uri.project,
             region=source_subnet_uri.region,
             subnetwork=source_subnet_uri.name)
    config = subnet_request.execute()
    config['region'] = target_subnet_uri.region
    logging.info('starting subnet %s deletion', source_subnet_uri.uri)
    delete_operation = delete_subnetwork(compute, source_subnet_uri)
    try:
        wait_for_operation(compute, source_subnet_uri, delete_operation['name']
                           )
    except HttpError as err:
        logging.error('Deleting subnetwork %s failed with %s',
                      source_subnet_uri, err)
        return False

    logging.info('subnet %s deleted successfully', source_subnet_uri.uri)

    logging.info('re creating subnet %s', target_subnet_uri.uri)
    del config['selfLink']
    config['name'] = target_subnet_uri.name
    insert_operation = \
        compute.subnetworks().insert(project=target_subnet_uri.project,
                                     region=target_subnet_uri.region,
                                     body=config).execute()
    try:
        wait_for_operation(compute, target_subnet_uri, insert_operation['name']
                           )
    except HttpError as err:
        logging.error('Creating subnetwork %s failed with %s',
                      target_subnet_uri, err)
        return False
    return True


def get_network(subnet_uri: uri.Subnet):
    result = \
        get_compute().subnetworks().get(project=subnet_uri.project,
                                        region=subnet_uri.region,
                                        subnetwork=subnet_uri.name).execute()
    return result['network'] if 'network' in result else None


def delete_subnetwork(compute, subnet_uri: uri.Subnet):
    return compute.subnetworks().delete(project=subnet_uri.project,
                                        region=subnet_uri.region,
                                        subnetwork=subnet_uri.name).execute()
