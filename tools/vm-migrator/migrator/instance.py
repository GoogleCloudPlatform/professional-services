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
# limitations under the License..
"""
This file is used to create instance from a machine image.
"""

import time
import re
import googleapiclient.discovery
import logging
from . import node_group_mapping
from . import machine_type_mapping
from . import machine_image
from .exceptions import InvalidFormatException, GCPOperationException, \
                        NotFoundException
from ratemate import RateLimit

RATE_LIMIT = RateLimit(max_count=2000, per=100)


def get_compute():
    compute = googleapiclient.discovery.build('compute',
                                              'beta',
                                              cache_discovery=False)
    logging.getLogger('googleapiclient.discovery_cache').setLevel(
        logging.ERROR)
    return compute


def is_hosted_on_sole_tenant(instance):
    try:
        if instance.get('scheduling'):
            if instance.get('scheduling').get('nodeAffinities'):
                if (isinstance(instance['scheduling']['nodeAffinities'], list)
                        and len(instance['scheduling']['nodeAffinities']) > 0):
                    if (instance['scheduling']['nodeAffinities'][0].get('key')
                            == 'compute.googleapis.com/node-group-name'):
                        return True
        return False
    except KeyError:
        return False


def get_node_group(instance):
    if is_hosted_on_sole_tenant(instance):
        return instance['scheduling']['nodeAffinities'][0]['values'][0]
    return None


def get_updated_node_group(node_group):
    try:
        if node_group_mapping.FIND.get(node_group):
            config = {
                'scheduling': {
                    'nodeAffinities': [{
                        'key':
                        'compute.googleapis.com/node-group-name',
                        'operator':
                        'IN',
                        'values': [node_group_mapping.FIND[node_group]]
                    }]
                }
            }
            logging.info('Found a matching node group %s for %s', node_group,
                         node_group_mapping.FIND.get(node_group))
            return config
        else:
            return None
    except KeyError:
        return None


def parse_self_link(self_link):
    if self_link.startswith('projects'):
        self_link = '/' + self_link
    response = re.search(r'\/projects\/(.*?)\/zones\/(.*?)\/instances\/(.*?)$',
                         self_link)
    if len(response.groups()) != 3:
        raise InvalidFormatException('Invalid SelfLink Format')
    return {
        'instance_id': response.group(3),
        'zone': response.group(2),
        'project': response.group(1)
    }


def shutdown_instance(compute, project, zone, instance_name):
    result = compute.instances().stop(project=project,
                                      zone=zone,
                                      instance=instance_name).execute()
    return result


def shutdown(project, zone, instance_name):
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        logging.info('  task: waited for %s secs', waited_time)
        compute = get_compute()
        logging.info('Shutting Down Instance %s ', instance_name)
        result = shutdown_instance(compute, project, zone, instance_name)
        wait_for_zonal_operation(compute, project, zone, result['name'])
        return instance_name
    except Exception as ex:
        logging.error(ex)
        raise ex


def start(project, zone, instance_name):
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        logging.info('  task: waited for %s secs', waited_time)
        compute = get_compute()
        logging.info('Starting Instance %s ', instance_name)
        result = compute.instances().start(project=project,
                                           zone=zone,
                                           instance=instance_name).execute()
        wait_for_zonal_operation(compute, project, zone, result['name'])
        return instance_name
    except Exception as ex:
        logging.error(ex)
        raise ex


def delete_instance(compute, project, zone, name):
    logging.info('Deleting Instance %s ', name)
    return compute.instances().delete(project=project,
                                      zone=zone,
                                      instance=name).execute()


def wait_for_zonal_operation(compute, project, zone, operation):
    logging.info('Waiting for operation to finish...')
    while True:
        result = compute.zoneOperations().get(project=project,
                                              zone=zone,
                                              operation=operation).execute()

        if result['status'] == 'DONE':
            logging.info('done.')
            if 'error' in result:
                raise GCPOperationException(result['error'])
            return result

        time.sleep(10)


def wait_for_regional_operation(compute, project, region, operation):
    logging.info('Waiting for operation to finish...')
    while True:
        result = compute.regionOperations().get(project=project,
                                                region=region,
                                                operation=operation).execute()

        if result['status'] == 'DONE':
            logging.info('done.')
            if 'error' in result:
                raise GCPOperationException(result['error'])
            return result

        time.sleep(10)


def delete(project, zone, name):
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        logging.info('  task: waited for %s secs', waited_time)
        compute = get_compute()
        image = machine_image.get(project, name)
        if image:
            logging.info('Found machine image can safely delete the instance')
            delete_operation = delete_instance(compute, project, zone, name)
            wait_for_zonal_operation(compute, project, zone,
                                     delete_operation['name'])
            return name
        else:
            raise NotFoundException(
                'Cant Delete the instance as machine image not found')
    except Exception as ex:
        logging.error(ex)
        raise ex


def get_region_from_zone(zone):
    match = re.search(r'(\w+)-(\w+)-(\w+)', zone)
    if len(match.groups()) != 3:
        raise InvalidFormatException('Invalid Zone Format')
    return match.group(1) + '-' + match.group(2)


def get_ip(compute, project, address, region):
    result = compute.addresses().get(project=project,
                                     region=region,
                                     address=address).execute()
    return result['address']


def reserve_internal_ip(compute, project, name, region, subnet, ip):
    config = {
        'address': ip,
        'addressType': 'INTERNAL',
        'name': name,
        'subnetwork': subnet
    }
    logging.info('Reserving internal ip %s and %s', name, ip)
    insert_operation = compute.addresses().insert(project=project,
                                                  region=region,
                                                  body=config).execute()
    wait_for_regional_operation(compute, project, region,
                                insert_operation['name'])

    return insert_operation['selfLink']


def upgrade_machine_type(machine_type, destination_zone):
    #  the machine type is of the form
    # https://www.googleapis.com/compute/beta/projects/pso-suchit/zones/us-east1-c/machineTypes/n1-standard-4
    logging.info('looking for upgrading the machine type')
    if machine_type.startswith('projects'):
        machine_type = '/' + machine_type

    response = re.search(
        r'\/projects\/(.*?)\/zones\/(.*?)\/machineTypes\/(.*?)$', machine_type)
    if len(response.groups()) != 3:
        raise InvalidFormatException('Invalid Machine Type Format')

    original_machine_type = response.group(3)
    original_zone = response.group(2)
    destination_machine_type = machine_type_mapping.FIND.get(
        original_machine_type)
    if destination_machine_type:
        logging.info('found a match to upgrade the machine type %s with %s',
                     machine_type, destination_machine_type)
        machine_type = machine_type.replace(original_machine_type,
                                            destination_machine_type)
        machine_type = machine_type.replace(original_zone, destination_zone)
        logging.info('upgrading machine to %s', machine_type)
        return machine_type

    # could not find the mapping so dont change the machine type
    return None


def create_instance(compute, project, zone, network, subnet, name,
                    alias_ip_ranges, node_group, disk_names, ip, machine_type,
                    image_project, target_service_account, target_scopes):
    """
    Create Instance method create a new GCP VM from the machine image.
    """
    config = {
        'name':
        name,
        'networkInterfaces': [{
            'network': network,
            'subnetwork': subnet,
            'networkIP': ip
        }],
        'disks': [{
            'deviceName': device_name,
            'initializeParams': {
                'diskName': disk_name
            }
        } for (device_name, disk_name) in disk_names.items()],
        'sourceMachineImage': 'projects/' + image_project +
                              '/global/machineImages/' + name
    }

    # upgrade the machine type in the destination zone
    new_machine_type = upgrade_machine_type(machine_type, zone)
    if new_machine_type:
        config['machineType'] = new_machine_type

    # Reserve the static ip before creating the instance
    # If we get ip variable set, we expect to use the same ip in the
    # destination subnet
    if ip:
        logging.info(
            'Trying to create the machine %s while preserving its ips', name)
        reserve_internal_ip(compute, project, name, get_region_from_zone(zone),
                            subnet, ip)
    else:
        # Since we cant reserve the same ip address passing
        # None as the ip to reserve random IP
        # The internal ip address is reserved with the same name
        # as machine name
        logging.info('Reserving random ip for machine %s ', name)
        reserve_internal_ip(compute, project, name, get_region_from_zone(zone),
                            subnet, None)
        config['networkInterfaces'][0]['networkIP'] = get_ip(
            compute, project, name, get_region_from_zone(zone))

    if node_group and get_updated_node_group(node_group):
        logging.info('Found a sole tenant maching running on node group %s',
                     node_group)
        config['scheduling'] = get_updated_node_group(node_group)['scheduling']

    if target_service_account and target_scopes:
        config['serviceAccounts'] = [{
            'email': target_service_account,
            'scopes': target_scopes,
        }]

    i = 1
    if len(alias_ip_ranges) > 0:
        logging.info('Found alias ip ranges, reserving it')
        for alias_ip in alias_ip_ranges:
            # If the alias ip is from the primary range then reserve it
            if (not alias_ip.get('subnetworkRangeName')
                    and alias_ip['ipCidrRange'].endswith('/32')):

                # Extract the ip address from something like 10.0.0.2/32
                length_ip = len(alias_ip['ipCidrRange']) - 3

                # Retain existing alias ip or create a random ip and use that
                if ip:
                    actual_ip = alias_ip['ipCidrRange'][0:length_ip]
                else:
                    actual_ip = None

                # Reserve the alias ip

                alias_ip_name = alias_ip.get('aliasIpName')
                if not alias_ip_name:
                    alias_ip_name = name + '-alias-ip-' + str(i)

                # Passing None in actual ip will reserve a
                # random ip for the name
                logging.info('reserving alias ip %s for machine %s', actual_ip,
                             name)
                reserve_internal_ip(compute, project, alias_ip_name,
                                    get_region_from_zone(zone), subnet,
                                    actual_ip)
                # Since we are not retaining the ip we will use the
                # random reserved ip
                if not actual_ip:
                    alias_ip['ipCidrRange'] = get_ip(
                        compute, project, alias_ip_name,
                        get_region_from_zone(zone)) + '/32'
                i = i + 1
        config['networkInterfaces'][0]['aliasIpRanges'] = alias_ip_ranges

    return compute.instances().insert(project=project,
                                      zone=zone,
                                      body=config).execute()


def wait_for_instance(compute, project, zone, name):
    """
    Function to wait for creation of machine image.
    """
    logging.info('Waiting for VM to start...')
    while True:
        result = compute.instances().get(project=project,
                                         zone=zone,
                                         instance=name).execute()
        if result['status'] == 'RUNNING':
            # logging.info("VM", name, "created and running")
            if 'error' in result:
                raise GCPOperationException(result['error'])
            return result

        time.sleep(10)


def create(project,
           target_zone,
           network,
           subnet,
           instance_name,
           alias_ip_ranges,
           node_group,
           disk_names,
           ip,
           machine_type,
           image_project,
           target_service_account,
           target_scopes,
           wait=True):
    """
    Main function to create the instance.
    """
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        logging.info('  task: waited for %s secs', waited_time)
        compute = get_compute()
        logging.info('Creating instance %s', instance_name)

        create_instance(compute, project, target_zone, network, subnet,
                        instance_name, alias_ip_ranges, node_group, disk_names,
                        ip, machine_type, image_project,
                        target_service_account, target_scopes)
        if wait:
            wait_for_instance(compute, project, target_zone, instance_name)
        logging.info(
            'Instance %s created and running form source MachineImage %s',
            instance_name, instance_name)
        return instance_name

    except Exception as ex:
        logging.error(ex)
        raise ex
