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
This file provides functionality related to migrating disks.
"""

import logging
from . import instance
from . import machine_image
from .exceptions import NotFoundException
from . import uri


def delete_disk(disk, project_zone: uri.ProjectZone, disk_name: str):
    logging.info('Deleting Disk %s ', disk_name)
    return disk.delete(project=project_zone.project, zone=project_zone.zone,
                       disk=disk_name).execute()


def delete(instance_uri: uri.Instance, disk_name, source_project):
    try:
        waited_time = instance.RATE_LIMIT.wait()  # wait before starting the task
        logging.info('  task: waited for %s secs', waited_time)
        compute = instance.get_compute()
        image = machine_image.get(instance_uri.project, instance_uri.name)
        if image:
            logging.info('Found machine image can safely delete the disk %s',
                         disk_name)
            disks = compute.disks()
            try:
                disk = disks.get(project=instance_uri.project,
                                 zone=instance_uri.zone,
                                 disk=disk_name).execute()
            except Exception:
                disk = None
            if disk:
                delete_operation = delete_disk(disks, instance_uri, disk_name)
                instance.wait_for_zonal_operation(compute, instance_uri,
                                                  delete_operation['name'])
            return disk_name
        else:
            raise NotFoundException(
                'Can\'t delete the disk {} as machine image {} was not found. '
                ' (machine project = {}, source project = {}, please report '
                'if these values differ)'.format(disk_name, instance_uri.name,
                                                 instance_uri.project,
                                                 source_project))
    except Exception as ex:
        logging.error(ex)
        raise ex


def setLabels(disk_uri: uri.Disk, labels):
    logging.getLogger().setLevel(logging.DEBUG)
    try:
        # wait before starting the task
        waited_time = instance.RATE_LIMIT.wait()
        logging.info('  task: waited for %s secs', waited_time)
        compute = instance.get_compute()
        disk = compute.disks().get(project=disk_uri.project,
                                   zone=disk_uri.zone,
                                   disk=disk_uri.name).execute()
        update_operation = compute.disks() \
            .setLabels(project=disk_uri.project, zone=disk_uri.zone,
                       resource=disk_uri.name, body={
                           'labels': labels,
                           'labelFingerprint': disk['labelFingerprint']
                       }).execute()
        instance.wait_for_zonal_operation(compute, disk_uri,
                                          update_operation['name'])
        return disk_uri.name
    except Exception as ex:
        logging.error(ex)
        raise ex
