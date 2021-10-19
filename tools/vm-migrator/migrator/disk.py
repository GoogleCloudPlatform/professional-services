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

import re
import logging
from . import instance
from . import machine_image
from .exceptions import InvalidFormatException, NotFoundException
from ratemate import RateLimit

DISK_RATE_LIMIT = RateLimit(max_count=2000, per=100)


def parse_self_link(self_link):
    if self_link.startswith('projects'):
        self_link = '/' + self_link
    response = re.search(r'\/projects\/(.*?)\/zones\/(.*?)\/disks\/(.*?)$',
                         self_link)
    if len(response.groups()) != 3:
        raise InvalidFormatException('Invalid SelfLink Format')
    return {
        'name': response.group(3),
        'zone': response.group(2),
        'project': response.group(1)
    }


def delete_disk(disk, project, zone, name):
    logging.info('Deleting Disk %s ', name)
    return disk.delete(project=project, zone=zone, disk=name).execute()


def delete(project, zone, instance_name, disk_name):
    try:
        waited_time = DISK_RATE_LIMIT.wait()  # wait before starting the task
        logging.info('  task: waited for %s secs', waited_time)
        compute = instance.get_compute()
        image = machine_image.get(project, instance_name)
        if image:
            logging.info('Found machine image can safely delete the disk %s',
                         disk_name)
            disks = compute.disks()
            try:
                disk = disks.get(project=project, zone=zone,
                                 disk=disk_name).execute()
            except Exception:
                disk = None
            if disk:
                delete_operation = delete_disk(disks, project, zone, disk_name)
                instance.wait_for_zonal_operation(compute, project, zone,
                                                  delete_operation['name'])
            return disk_name
        else:
            raise NotFoundException(
                'Can\'t delete the disk as machine image not found')
    except Exception as ex:
        logging.error(ex)
        raise ex
