#!/usr/bin/env python
# Copyright 2020 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.
"""
This file is used to create a machine image for an instance
"""

import time
import googleapiclient.discovery
import logging
from ratemate import RateLimit
rate_limit = RateLimit(max_count=2000, per=100)

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
    logging.info("looking for machine image %s", (name))
    try:
        result = compute.machineImages().get(project=project,
                                             machineImage=name).execute()
        if (result['selfLink']):
            return result
    except:
        return None


# [START wait_for_operation]


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
                raise Exception(result['error'])
            return result

        time.sleep(30)


# [END wait_for_operation]


def get_compute():
    compute = googleapiclient.discovery.build('compute',
                                              'beta',
                                              cache_discovery=False)
    logging.getLogger('googleapiclient.discovery_cache').setLevel(logging.ERROR)
    return compute


# main function
def create(project, target_region, source_instance, name, wait=True):
    try:
        waited_time = rate_limit.wait()  # wait before starting the task
        logging.info(f"  task: waited for {waited_time} secs")
        logging.info('Creating Machine Image %s from source %s' %
                     (name, source_instance))
        compute = get_compute()
        machine_image(compute, project, target_region, source_instance, name)
        if wait:
            wait_for_operation(compute, project, name)
        logging.info('Machine Image %s Created' % (name))
        return name
    except Exception as exc:
        logging.error(exc)
        raise exc
