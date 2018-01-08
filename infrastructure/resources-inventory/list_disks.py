# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Sample script that lists disk info for all disks that the user has access to.
Only projects that the user has access to will be introspected
This can be used to check which boots disk are using which sourceImages and the instances that
these disks are linked to.
"""

import logging
import inventory_service

logger = logging.getLogger()
logging.basicConfig()
logger.setLevel(logging.ERROR)

if __name__ == '__main__':

    inventory_service = inventory_service.InventoryService()

    # Exclude these projects.. maybe these are incorrectly configured projects?
    project_exclude_list = ["my-exclude-project-id"]

    try:
        projects = inventory_service.list_projects()
        for project in projects:
            projectId = project['projectId']
            if projectId in project_exclude_list:
                continue
            else:
                zones = inventory_service.list_zones(projectId)
                for zone in zones:
                    disks = inventory_service.list_disks(projectId, zone['name'])
                    for disk in disks:
                        # https://cloud.google.com/compute/docs/reference/latest/disks#resource
                        # The 'users' refers to the instances that the disk is attached to
                        # Disks can be created as blank disks, in which case there is "No sourceImage'
                        print('%s,%s,%s,%s,%s' %
                              (projectId,
                               zone['name'],
                               disk['name'],
                               disk['sourceImage'] if 'sourceImage' in disk else 'No sourceImage',
                               disk['users'] if 'users' in disk else 'No instances attached'))
    except inventory_service.InventoryServiceException as e:
        logger.fatal("Processing stopped due to an unhandled exception")
        logger.fatal(e)

    for error in inventory_service.errors:
        logger.error(error)
