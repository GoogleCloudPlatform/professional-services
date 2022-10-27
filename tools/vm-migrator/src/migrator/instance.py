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
import googleapiclient.discovery
import logging
import re

from . import node_group_mapping
from . import machine_image
from .exceptions import GCPOperationException, NotFoundException
from ratemate import RateLimit
from . import uri
from typing import Optional

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


def get_updated_node_group(node_group) -> Optional[object]:
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


def shutdown(instance_uri: uri.Instance) -> str:
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        logging.info('  task: waited for %s secs', waited_time)
        compute = get_compute()
        logging.info('Shutting Down Instance %s ', instance_uri)
        result = compute.instances().stop(project=instance_uri.project,
                                          zone=instance_uri.zone,
                                          instance=instance_uri.name).execute()
        wait_for_zonal_operation(compute, instance_uri, result['name'])
        return instance_uri.name
    except Exception as ex:
        logging.error(ex)
        raise ex


def disable_deletionprotection(instance_uri: uri.Instance) -> str:
    try:
        compute = get_compute()
        logging.info('Disabling delete protection for instance %s ',
                     instance_uri)
        result = compute.instances().setDeletionProtection(
            project=instance_uri.project, zone=instance_uri.zone,
            resource=instance_uri.name, deletionProtection=False).execute()
        wait_for_zonal_operation(compute, instance_uri, result['name'])
        return instance_uri.name
    except Exception as ex:
        logging.error(ex)
        raise ex


def start(instance_uri: uri.Instance) -> str:
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        logging.info('  task: waited for %s secs', waited_time)
        compute = get_compute()
        logging.info('Starting Instance %s ', instance_uri.name)
        result = compute.instances().start(
            project=instance_uri.project, zone=instance_uri.zone,
            instance=instance_uri.name).execute()
        wait_for_zonal_operation(compute, instance_uri, result['name'])
        return instance_uri.name
    except Exception as ex:
        logging.error(ex)
        raise ex


def delete_instance(compute, instance_uri: uri.Instance):
    logging.info('Deleting Instance %s ', instance_uri)
    return compute.instances().delete(project=instance_uri.project,
                                      zone=instance_uri.zone,
                                      instance=instance_uri.name).execute()


def wait_for_zonal_operation(compute, project_zone_uri: uri.ProjectZone,
                             operation):
    logging.info('Waiting for operation to finish...')
    while True:
        result = compute.zoneOperations().get(project=project_zone_uri.project,
                                              zone=project_zone_uri.zone,
                                              operation=operation).execute()

        if result['status'] == 'DONE':
            logging.info('done.')
            if 'error' in result:
                raise GCPOperationException(result['error'])
            return result

        time.sleep(10)


def wait_for_regional_operation(compute, project_region_uri: uri.ProjectRegion,
                                operation):
    logging.info('Waiting for operation to finish...')
    while True:
        result = compute.regionOperations() \
            .get(project=project_region_uri.project,
                 region=project_region_uri.region,
                 operation=operation).execute()

        if result['status'] == 'DONE':
            logging.info('done.')
            if 'error' in result:
                raise GCPOperationException(result['error'])
            return result

        time.sleep(10)


def delete(instance_uri: uri.Instance) -> str:
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        logging.info('  task: waited for %s secs', waited_time)
        compute = get_compute()
        image = machine_image.get(instance_uri.project, instance_uri.name)
        if image:
            logging.info('Found machine image can safely delete the instance')
            delete_operation = delete_instance(compute, instance_uri)
            wait_for_zonal_operation(compute, instance_uri,
                                     delete_operation['name'])
            return instance_uri.name
        else:
            raise NotFoundException(
                'Cant Delete the instance as machine image not found')
    except Exception as ex:
        logging.error(ex)
        raise ex


def get_ip(compute, instance_uri: uri.Instance, address) -> str:
    result = compute.addresses().get(project=instance_uri.project,
                                     region=instance_uri.region,
                                     address=address).execute()
    return result['address']


def reserve_internal_ip(compute, instance_uri: uri.Instance, name,
                        subnet_uri: uri.Subnet, ip) -> str:
    config = {
        'address': ip,
        'addressType': 'INTERNAL',
        'name': name,
        'subnetwork': subnet_uri.uri
    }
    logging.info('Reserving internal ip with name=%s and ip=%s', name, ip)
    insert_operation = compute.addresses().insert(project=instance_uri.project,
                                                  region=instance_uri.region,
                                                  body=config).execute()
    wait_for_regional_operation(compute, instance_uri, insert_operation['name']
                                )

    return insert_operation['selfLink']


def prepare_create_instance(compute, instance_uri: uri.Instance, network,
                    subnet_uri: uri.Subnet, alias_ip_ranges, node_group,
                    disk_names, ip, target_machine_type_uri: uri.MachineType,
                    image_project, target_service_account, target_scopes) \
        -> object:
    """
    Create Instance method create a new GCP VM from the machine image.
    """
    config = {
        'name': instance_uri.name,
        'networkInterfaces': [{
            'network': network,
            'subnetwork': subnet_uri.uri,
            'networkIP': ip
        }],
        'disks': [{
            'deviceName': device_name,
            'initializeParams': {
                'diskName': disk_name
            }
        } for (device_name, disk_name) in disk_names.items()],
        'sourceMachineImage': 'projects/' + image_project +
                              '/global/machineImages/' + instance_uri.name,
        'machineType': target_machine_type_uri.uri
    }

    # Reserve the static ip before creating the instance
    # If we get ip variable set, we expect to use the same ip in the
    # destination subnet
    if ip:
        logging.info(
            'Trying to create the machine %s while preserving its ips',
            instance_uri.name
        )
        reserve_internal_ip(compute, instance_uri, instance_uri.name,
                            subnet_uri, ip)
    else:
        # Since we cant reserve the same ip address passing
        # None as the ip to reserve random IP
        # The internal ip address is reserved with the same name
        # as machine name
        logging.info('Reserving random ip for machine %s ', instance_uri.name)
        reserve_internal_ip(compute, instance_uri, instance_uri.name,
                            subnet_uri, None)
        config['networkInterfaces'][0]['networkIP'] = \
            get_ip(compute, instance_uri, instance_uri.name)

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
                    alias_ip_name = instance_uri.name + '-alias-ip-' + str(i)

                # Passing None in actual ip will reserve a
                # random ip for the name
                logging.info('reserving alias ip %s for machine %s', actual_ip,
                             instance_uri.name)
                reserve_internal_ip(compute, instance_uri, alias_ip_name,
                                    subnet_uri, actual_ip)
                # Since we are not retaining the ip we will use the
                # random reserved ip
                if not actual_ip:
                    alias_ip['ipCidrRange'] = get_ip(compute, instance_uri,
                                                     alias_ip_name) + '/32'
                i = i + 1
        config['networkInterfaces'][0]['aliasIpRanges'] = alias_ip_ranges

    return {
        'project': instance_uri.project,
        'zone': instance_uri.zone,
        'body': config
    }


def wait_for_instance(compute, instance_uri: uri.Instance):
    """
    Function to wait for creation of machine image.
    """
    logging.info('Waiting for VM to start...')
    while True:
        result = compute.instances().get(project=instance_uri.project,
                                         zone=instance_uri.zone,
                                         instance=instance_uri.name).execute()
        if result['status'] == 'RUNNING':
            # logging.info("VM", name, "created and running")
            if 'error' in result:
                raise GCPOperationException(result['error'])
            return result

        time.sleep(10)


def move_to_subnet_and_rename(instance_uri: uri.Instance, row,
                             to_subnet_uri, direction: str) \
        -> str:
    if direction not in ['backup', 'rollback']:
        logging.error(
            "move_to_subnet_and_rename: specify a direction"
            "('backup' or 'rollback')"
        )
        return False
    # ONLY DEALING WITH ONE ZONE SO FAR!
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        logging.info('  task: waited for %s secs', waited_time)
        compute = get_compute()
        logging.info('Updating Network Interface for Instance %s ',
                     instance_uri.name)
        request_body = {
            'network': row['network'],
            'subnetwork': to_subnet_uri.uri,
            'fingerprint': row['fingerprint'],
        }
        if 'previous_internal_ip' in row \
            and row['previous_internal_ip'] is not None:
            request_body['networkIP'] = row['previous_internal_ip']
        kwargs_base = {
            'project': instance_uri.project,
            'zone': instance_uri.zone,
            'instance': instance_uri.name
        }
        kwargs = kwargs_base.copy()
        kwargs['networkInterface'] = 'nic0'
        kwargs['body'] = request_body

        result = compute.instances().updateNetworkInterface(**kwargs).execute()
        wait_for_zonal_operation(compute, instance_uri, result['name'])

        kwargs = kwargs_base.copy()
        # rename
        if direction == 'backup':
            new_name = kwargs['instance'] + '0'
        else: # rollback
            new_name = kwargs['instance'][:-1]
        kwargs['body'] = {
            'currentName': kwargs['instance'],
            'name': new_name
        }
        result = compute.instances().setName(**kwargs).execute()
        wait_for_zonal_operation(compute, instance_uri, result['name'])

        return instance_uri.name
    except Exception as ex:
        logging.error(ex)
        raise ex


def create(instance_uri: uri.Instance,
           network,
           subnet: uri.Subnet,
           alias_ip_ranges,
           node_group,
           disk_names,
           ip,
           machine_type_uri: uri.MachineType,
           image_project,
           target_service_account,
           target_scopes,
           wait=True) -> str:
    """
    Main function to create the instance.
    """
    waited_time = RATE_LIMIT.wait()  # wait before starting the task
    logging.info('  task: waited for %s secs', waited_time)
    compute = get_compute()
    logging.info('Creating instance %s', instance_uri.name)

    kwargs = prepare_create_instance(compute, instance_uri, network, subnet,
                                alias_ip_ranges, node_group, disk_names,
                                ip, machine_type_uri, image_project,
                                target_service_account, target_scopes)

    retry_count=0
    while True:
        try:
            if 0 < retry_count:
                wait_time = min(retry_count * 30, 300)
                logging.info(
                    'Retry #{} for instance {}: Waiting {} seconds.'
                    .format(retry_count, instance_uri.name, wait_time)
                )
                time.sleep(wait_time)
                logging.info(
                    'Retry #{} for instance {}: Sleeping finished,'
                    'attempting creation...'
                    .format(retry_count, instance_uri.name)
                )

            operation = compute.instances().insert(**kwargs).execute()

            if wait:
                wait_for_zonal_operation(
                    compute, instance_uri, operation['name']
                )
                result = wait_for_instance(compute, instance_uri)
            created_instance_uri = uri.Instance.from_uri(result['selfLink'])
            logging.info('Instance %s created from source MachineImage %s and '
                        'successfully started', created_instance_uri,
                        instance_uri.name)
            return created_instance_uri.name
        except Exception as ex:
            if re.search('INTERNAL_ERROR', str(ex)):
                if retry_count < 5:
                    logging.warning(
                        'Retry #{} for instance {} failed.'
                        .format(retry_count, instance_uri.name)
                    )
                    retry_count += 1
                    continue
                else:
                    logging.error(
                        'Retry #{} for instance {} failed.'
                        .format(retry_count, instance_uri.name)
                    )
            logging.error(ex)
            raise ex
