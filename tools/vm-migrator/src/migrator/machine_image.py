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
This file is used to create a machine image for an instance.
"""

import time
import googleapiclient.discovery
import logging
from ratemate import RateLimit
from .exceptions import GCPOperationException

RATE_LIMIT = RateLimit(max_count=2000, per=100)


# machineImage
def machine_image(compute, project, target_region, source_instance, name):
    """
    This method creates machine image for an instance.
    """
    config = {'name': name, 'storageLocations': target_region}
    return compute.machineImages().insert(
        project=project,
        body=config,
        requestId=None,
        sourceInstance=source_instance).execute()


def get(project, name):
    compute = get_compute()
    logging.info('looking for machine image %s', name)
    try:
        result = compute.machineImages().get(project=project,
                                             machineImage=name).execute()
        if result['selfLink']:
            return result
    except Exception:
        return None


def wait_for_operation(compute, project, name):
    """
    This methods waits untill the operation is complete.
    """
    logging.info('Waiting for machine image creation to finish...')
    while True:
        result = compute.machineImages().get(project=project,
                                             machineImage=name).execute()

        if result['status'] == 'READY':
            if 'error' in result:
                raise GCPOperationException(result['error'])
            return result

        time.sleep(30)


def get_compute():
    compute = googleapiclient.discovery.build('compute',
                                              'beta',
                                              cache_discovery=False)
    logging.getLogger('googleapiclient.discovery_cache').setLevel(
        logging.ERROR)
    return compute


# main function
def create(project, target_region, source_instance, name, wait=True):
    try:
        waited_time = RATE_LIMIT.wait()  # wait before starting the task
        logging.info('  task: waited for %s secs', waited_time)
        logging.info('Creating Machine Image %s from source %s', name,
                     source_instance)
        compute = get_compute()
        machine_image(compute, project, target_region, source_instance, name)
        if wait:
            wait_for_operation(compute, project, name)
        logging.info('Machine Image %s Created', name)
        return name
    except Exception as exc:
        logging.error(exc)
        raise exc


def set_iam_policy(source_project, name, target_service_account):
    compute = get_compute()
    body = {
        "bindings": [
            {
                "role": "roles/compute.admin",
                "members": [
                    "serviceAccount:{}".format(target_service_account),
                ],
            },
        ],
        "version": 3
    }
    self_link = 'projects/{}/global/machineImages/{}'.format(source_project,
                                                             name)
    logging.info('Setting IAM policy for machine image %s', self_link)
    compute.machineImages().setIamPolicy(project=source_project,
                                         resource=name,
                                         body=body).execute()
    return self_link
