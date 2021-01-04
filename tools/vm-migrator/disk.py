#!/usr/bin/env python
# Copyright 2020 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.
"""
This file provides functionality related to disks
"""

import re
import logging
import instance
import machine_image
from ratemate import RateLimit
disk_rate_limit = RateLimit(max_count=2000, per=100)

def parse_self_link(self_link):
    if (self_link.startswith('projects')):
        self_link = "/" + self_link
    response = re.search(r"\/projects\/(.*?)\/zones\/(.*?)\/disks\/(.*?)$",
                         self_link)
    if (len(response.groups()) != 3):
        raise Exception('Invalid SelfLink Format')
    return {
        'name': response.group(3),
        'zone': response.group(2),
        'project': response.group(1)
    }


def delete_disk(disk, project, zone, name):
    logging.info("Deleting Disk %s ", (name))
    return disk.delete(project=project, zone=zone, disk=name).execute()


def delete(project, zone, instance_name, disk_name):
    try:
        waited_time = disk_rate_limit.wait()  # wait before starting the task
        logging.info(f"  task: waited for {waited_time} secs")
        compute = instance.get_compute()
        image = machine_image.get(project, instance_name)
        if (image):
            logging.info("Found machine image can safely delete the disk %s"
                % disk_name)
            disks = compute.disks()
            try:
                disk = disks.get(project=project, zone=zone, disk=disk_name).execute()
            except:
                disk = None
            if disk:
                delete_operation = delete_disk(disks, project, zone, disk_name)
                instance.wait_for_zonal_operation(compute, project, zone,
                    delete_operation['name'])
            return disk_name
        else:
            raise Exception(
                "Can't delete the disk as machine image not found")
    except Exception as ex:
        logging.error(ex)
        print(ex)
        raise ex
