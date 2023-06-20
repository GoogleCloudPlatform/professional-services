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


_LOGGER = logging.getLogger(__name__)


def get_compute():
    compute = googleapiclient.discovery.build('compute', 'beta', cache_discovery=False)
    logging.getLogger('googleapiclient.discovery_cache').setLevel(logging.ERROR)
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
    except KeyError as err:
        _LOGGER.warning('Could not check if instance "%s" is hosted in sole tenant. Error: %s', instance, err)
        return False


def get_node_group(instance):
    _LOGGER.info('Getting node group with: %s', locals())
    if is_hosted_on_sole_tenant(instance):
        return instance['scheduling']['nodeAffinities'][0]['values'][0]
    return None


def get_updated_node_group(node_group) -> Optional[object]:
    _LOGGER.info('Updating node group with: %s', locals())
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
            _LOGGER.info('Found a matching node group %s for %s', node_group, node_group_mapping.FIND.get(node_group))
            return config
        else:
            return None
    except KeyError as err:
        _LOGGER.warning('Could not update node group "%s". Error: %s', node_group, err)
        return None


def shutdown(instance_uri: uri.Instance) -> str:
    _LOGGER.info('Shutting down image with: %s', locals())
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        _LOGGER.debug('  task: waited for %s secs', waited_time)
        compute = get_compute()
        _LOGGER.debug('Shutting Down Instance "%s"', instance_uri)
        result = compute.instances().stop(project=instance_uri.project,
                                          zone=instance_uri.zone,
                                          instance=instance_uri.name).execute()
        wait_for_zonal_operation(compute, instance_uri, result['name'])
        return instance_uri.name
    except Exception as ex:
        _LOGGER.error('Could not shutdown instance "%s". Error: %s', instance_uri, ex)
        raise ex


def disable_deletionprotection(instance_uri: uri.Instance) -> str:
    _LOGGER.info('Disabling delete protection with: %s', locals())
    try:
        compute = get_compute()
        result = compute.instances().setDeletionProtection(
            project=instance_uri.project,
            zone=instance_uri.zone,
            resource=instance_uri.name,
            deletionProtection=False).execute()
        wait_for_zonal_operation(compute, instance_uri, result['name'])
        return instance_uri.name
    except googleapiclient.discovery.HttpError as ex:
        if ex.status_code == 404:
            _LOGGER.warning(
                '[INSTANCE NOT FOUND] Could not disable delete protection in instance "%s". Ignoring. Error: %s',
                instance_uri, ex
            )
        else:
            _LOGGER.error('Could not disable delete protection in instance "%s". Error: %s', instance_uri, ex)
            raise ex
    except Exception as ex:
        _LOGGER.error('Could not disable delete protection in instance "%s". Error: %s', instance_uri, ex)
        raise ex


def start(instance_uri: uri.Instance) -> str:
    _LOGGER.info('Starting image with: %s', locals())
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        _LOGGER.debug('  task: waited for %s secs', waited_time)
        compute = get_compute()
        _LOGGER.debug('Starting Instance "%s"', instance_uri)
        result = compute.instances().start(
            project=instance_uri.project,
            zone=instance_uri.zone,
            instance=instance_uri.name).execute()
        wait_for_zonal_operation(compute, instance_uri, result['name'])
        return instance_uri.name
    except Exception as ex:
        _LOGGER.error('Could not start instance "%s". Error: %s', instance_uri, ex)
        raise ex


def delete_instance(compute, instance_uri: uri.Instance):
    _LOGGER.info('Deleting Instance "%s"', instance_uri)
    return compute.instances().delete(project=instance_uri.project,
                                      zone=instance_uri.zone,
                                      instance=instance_uri.name).execute()


def wait_for_zonal_operation(compute, project_zone_uri: uri.ProjectZone, operation):
    _LOGGER.info('Waiting for zonal operation "%s" in project "%s" to finish', operation, project_zone_uri)
    while True:
        result = compute.zoneOperations().get(project=project_zone_uri.project,
                                              zone=project_zone_uri.zone,
                                              operation=operation).execute()

        if result['status'] == 'DONE':
            _LOGGER.info('Finished zonal operation "%s" in project "%s"', operation, project_zone_uri)
            if 'error' in result:
                _LOGGER.error('Error in zonal operation "%s" in project "%s". Result: "%s"',
                              operation, project_zone_uri, result)
                raise GCPOperationException(result['error'])
            return result
        time.sleep(10)


def wait_for_regional_operation(compute, project_region_uri: uri.ProjectRegion, operation):
    _LOGGER.info('Waiting for regional operation "%s" in project "%s" to finish', operation, project_region_uri)
    while True:
        result = compute.regionOperations().get(
            project=project_region_uri.project,
            region=project_region_uri.region,
            operation=operation).execute()

        if result['status'] == 'DONE':
            _LOGGER.info('Finished regional operation "%s" in project "%s"', operation, project_region_uri)
            if 'error' in result:
                _LOGGER.error('Error in regional operation "%s" in project "%s". Result: "%s"',
                              operation, project_region_uri, result)
                raise GCPOperationException(result['error'])
            return result

        time.sleep(10)


def delete(instance_uri: uri.Instance) -> str:
    _LOGGER.info('Deleting image with: %s', locals())
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        _LOGGER.debug('  task: waited for %s secs', waited_time)
        compute = get_compute()
        image = machine_image.get(instance_uri.project, instance_uri.name)
        if image:
            _LOGGER.info('Found machine image "%s", can safely delete the instance "%s"', image, instance_uri)
            delete_operation = delete_instance(compute, instance_uri)
            wait_for_zonal_operation(compute, instance_uri, delete_operation['name'])
            return instance_uri.name
        else:
            raise NotFoundException(f'Cannot delete instance "{instance_uri}" as machine image not found')
    except googleapiclient.discovery.HttpError as ex:
        if ex.status_code == 404:
            _LOGGER.warning(
                '[INSTANCE NOT FOUND] Could not delete instance "%s". Ignoring. Error: %s',
                instance_uri, ex
            )
        else:
            _LOGGER.error('Could not delete instance "%s". Error: %s', instance_uri, ex)
            raise ex
    except Exception as ex:
        _LOGGER.error('Could not delete instance "%s". Error: %s', instance_uri, ex)
        raise ex


def get_ip(compute, instance_uri: uri.Instance, address) -> str:
    result = compute.addresses().get(project=instance_uri.project,
                                     region=instance_uri.region,
                                     address=address).execute()
    return result['address']


def reserve_internal_ip(compute, instance_uri: uri.Instance, name, subnet_uri: uri.Subnet, ip) -> str:
    config = {
        'address': ip,
        'addressType': 'INTERNAL',
        'name': name,
        'subnetwork': subnet_uri.uri
    }
    _LOGGER.debug('Reserving internal ip "%s" with name "%s" for instance "%s" in subnet "%s"',
                 ip, name, instance_uri, subnet_uri)
    try:
        insert_operation = compute.addresses().insert(project=instance_uri.project,
                                                      region=instance_uri.region,
                                                      body=config).execute()
        wait_for_regional_operation(compute, instance_uri, insert_operation['name'])
    except googleapiclient.discovery.HttpError as err:
        if err.status_code == 409:
            _LOGGER.warning(
                '[INSTANCE ALREADY EXISTS] Could not reserve IP address "%s" for instance "%s". Ignoring. Error: %s',
                config, instance_uri, err)
            return None
        else:
            raise err
    return insert_operation['selfLink']


def prepare_create_instance(compute, instance_uri: uri.Instance, network, subnet_uri: uri.Subnet, alias_ip_ranges,
                            node_group, disk_names, ip, target_machine_type_uri: uri.MachineType, image_project,
                            target_service_account, target_scopes) -> object:
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
        'sourceMachineImage': 'projects/' + image_project + '/global/machineImages/' + instance_uri.name,
        'machineType': target_machine_type_uri.uri
    }

    # Reserve the static ip before creating the instance
    # If we get ip variable set, we expect to use the same ip in the
    # destination subnet
    if ip:
        _LOGGER.info('Trying to create instance "%s" while preserving its ips', instance_uri)
        reserve_internal_ip(compute, instance_uri, instance_uri.name, subnet_uri, ip)
    else:
        # Since we cant reserve the same ip address passing
        # None as the ip to reserve random IP
        # The internal ip address is reserved with the same name
        # as machine name
        _LOGGER.info('Reserving random ip for instance %s ', instance_uri)
        reserve_internal_ip(compute, instance_uri, instance_uri.name, subnet_uri, None)
        config['networkInterfaces'][0]['networkIP'] = get_ip(compute, instance_uri, instance_uri.name)

    if node_group and get_updated_node_group(node_group):
        _LOGGER.info('Found a sole tenant matching running on node group "%s"', node_group)
        config['scheduling'] = get_updated_node_group(node_group)['scheduling']

    if target_service_account and target_scopes:
        config['serviceAccounts'] = [{
            'email': target_service_account,
            'scopes': target_scopes,
        }]

    i = 1
    if len(alias_ip_ranges) > 0:
        _LOGGER.info('Found alias ip ranges "%s", reserving it', alias_ip_ranges)
        for alias_ip in alias_ip_ranges:
            # If the alias ip is from the primary range then reserve it
            if not alias_ip.get('subnetworkRangeName') and alias_ip['ipCidrRange'].endswith('/32'):

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
                _LOGGER.info('Reserving alias "%s" for ip "%s" for instance "%s" in subnet "%s"',
                             alias_ip_name, actual_ip, instance_uri, subnet_uri)
                reserve_internal_ip(compute, instance_uri, alias_ip_name, subnet_uri, actual_ip)
                # Since we are not retaining the ip we will use the
                # random reserved ip
                if not actual_ip:
                    alias_ip['ipCidrRange'] = get_ip(compute, instance_uri, alias_ip_name) + '/32'
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
    _LOGGER.info('Waiting for instance "%s" to start', instance_uri)
    while True:
        result = compute.instances().get(project=instance_uri.project,
                                         zone=instance_uri.zone,
                                         instance=instance_uri.name).execute()
        if result['status'] == 'RUNNING':
            # _LOGGER.info("VM", name, "created and running")
            if 'error' in result:
                _LOGGER.error('Instance "%s" did not start. Result: %s', instance_uri, result)
                raise GCPOperationException(result['error'])
            return result

        time.sleep(10)


def move_to_subnet_and_rename(instance_uri: uri.Instance, row, to_subnet_uri, direction: str) -> str:
    _LOGGER.info('Moving to subnet and renaming with: %s', locals())
    if direction not in ['backup', 'rollback']:
        _LOGGER.error('move_to_subnet_and_rename: specify a direction("backup" or "rollback"). Got "%s"', direction)
        return False
    # ONLY DEALING WITH ONE ZONE SO FAR!
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        _LOGGER.debug('  task: waited for %s secs', waited_time)
        compute = get_compute()
        _LOGGER.debug('Updating network interface "%s" in row "%s" for instance "%s"',
                     to_subnet_uri, row, instance_uri)
        request_body = {
            'network': row['network'],
            'subnetwork': to_subnet_uri.uri,
            'fingerprint': row['fingerprint'],
        }
        if 'previous_internal_ip' in row and row['previous_internal_ip'] is not None:
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
        _LOGGER.error(ex)
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
    _LOGGER.info('Creating image with: %s', locals())
    waited_time = RATE_LIMIT.wait()  # wait before starting the task
    _LOGGER.debug('  task: waited for %s secs', waited_time)
    compute = get_compute()
    _LOGGER.debug('Creating instance "%s" in network "%s", subnet "%s", '
                 'alias IP "%s", node group "%s", disks "%s", IPs "%s",'
                 'machine type "%s", image "%s", target SA "%s", targe scopes "%s"',
                 instance_uri, network, subnet,
                 alias_ip_ranges, node_group, disk_names, ip,
                 machine_type_uri, image_project, target_service_account, target_scopes)

    kwargs = prepare_create_instance(compute, instance_uri, network, subnet,
                                    alias_ip_ranges, node_group, disk_names,
                                    ip, machine_type_uri, image_project,
                                    target_service_account, target_scopes)

    retry_count=0
    while True:
        try:
            if 0 < retry_count:
                wait_time = min(retry_count * 30, 300)
                _LOGGER.info('Retry #%d: Creating instance "%s", waiting "%d"', retry_count, instance_uri, wait_time)
                time.sleep(wait_time)

            operation = compute.instances().insert(**kwargs).execute()

            if wait:
                wait_for_zonal_operation(compute, instance_uri, operation['name'])
                result = wait_for_instance(compute, instance_uri)
            created_instance_uri = uri.Instance.from_uri(result['selfLink'])
            _LOGGER.info('Instance "%s" created from source instance "%s" and successfully started',
                         created_instance_uri, instance_uri)
            return created_instance_uri.name
        except Exception as ex:
            msg = f'Retry #{retry_count}: Creating instance "{instance_uri}" failed. Error: {ex}'
            if isinstance(ex, googleapiclient.discovery.HttpError) and ex.status_code == 409 :
                _LOGGER.warning('Instance "%s" already exists. Ignoring. Error: %s', instance_uri, ex)
                break
            if re.search('INTERNAL_ERROR', str(ex)) and retry_count < 5:
                _LOGGER.warning(msg)
                retry_count += 1
                continue
            _LOGGER.error(msg)
            raise ex
