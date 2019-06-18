# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License.  You may obtain a copy
# of the License at http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
# License for the specific language governing permissions and limitations under
# the License.


__author__ = 'Jeff McCune <jeff@openinfrastructure.co>'

import base64
import json
import logging
import os
from googleapiclient import discovery
from googleapiclient.errors import HttpError
from typing import List, Optional

LOGNAME = __name__


def compute(http=None):
    return discovery.build('compute', 'v1', http=http)


def dns(http=None):
    return discovery.build('dns', 'v1', http=http)


def setup_logging(context=None):
    """Sets up logging"""
    if os.getenv('DEBUG'):
        level = logging.DEBUG
    else:
        level = logging.INFO
    # Make googleapiclient less noisy.
    # See https://github.com/googleapis/google-api-python-client/issues/299
    api_logger = logging.getLogger('googleapiclient')
    api_logger.setLevel(logging.ERROR)
    # Set level of our logger.
    logger = logging.getLogger(LOGNAME)
    logger.setLevel(level)
    return logger


def get_instance(project, compute_zone, instance, http=None):
    """Return the results of the compute.instances.get API call
    Args:
        project (string): The project
        compute_zone (string): The compute_zone
        instance (string): The instance name
        http: httplib2.Http, An instance of httplib2.Http or something that
            acts like it that HTTP requests will be made through.
    Returns:
        (dict) De-serialized JSON API response as a Dictionary.
    """
    service = compute(http=http)
    log = logging.getLogger(LOGNAME)
    try:
        result = service.instances().get(
            project=project,
            zone=compute_zone,
            instance=instance).execute()
    except HttpError as err:
        log.error(json.dumps({'message': str(err)}))
        result = {}
    log.debug(json.dumps({'message': 'get_instance()',
                          'project': project,
                          'compute_zone': compute_zone,
                          'instance': instance,
                          'result': result}))
    return result


def dns_records(project: str, managed_zone: str, http=None) -> List[dict]:
    """Obtain a collection of A records from Cloud DNS.

    See https://cloud.google.com/dns/docs/reference/v1/resourceRecordSets/list

    Args:
        project: The project containing the Cloud DNS managed zone.  Typically
        the VPC Host project.
        managed_zone: The Cloud DNS managed zone to scan for records.
        http: httplib2.Http, An instance of httplib2.Http or something that
            acts like it that HTTP requests will be made through.
    """
    log = logging.getLogger(LOGNAME)
    service = dns(http=http)
    request = service.resourceRecordSets().list(
        project=project,
        managedZone=managed_zone)
    records = []
    while request is not None:
        try:
            response = request.execute()
            for resource_record_set in response['rrsets']:
                records.append(resource_record_set)
            request = service.resourceRecordSets().list_next(
                previous_request=request,
                previous_response=response)
        except HttpError as err:
            log.error(json.dumps({
                'message': 'Could not get DNS records',
                'managed_zone': managed_zone,
                'suggestion': ('Check managed zones specified '
                               'in DNS_VM_GC_DNS_ZONES exist '
                               'in DNS_VM_GC_DNS_PROJECT'),
                'error': str(err)}))
            request = None
    return records


def delete_record(project: str, managed_zone: str, record: dict, http=None):
    """Deletes a DNS Resource Record Set.

    See https://cloud.google.com/dns/docs/reference/v1/changes

    Args:
        project: The project containing the Cloud DNS managed zone.  Typically
        the VPC Host project.
        managed_zone: The Cloud DNS managed zone to scan for records.
        record: A DNS record dictionary, must have at least 'name' key and
        value.
        http: httplib2.Http, An instance of httplib2.Http or something that
            acts like it that HTTP requests will be made through.
    """
    log = logging.getLogger(LOGNAME)
    log.debug(json.dumps({
        'message': 'BEGIN Deleting record',
        'project': project,
        'managed_zone': managed_zone,
        'record': record}))
    change = {"kind": "dns#change", "deletions": [record]}
    service = dns(http=http)
    request = service.changes().create(
        project=project,
        managedZone=managed_zone,
        body=change)
    response = request.execute()
    log.debug(json.dumps({
        'message': 'END Deleting record',
        'project': project,
        'managed_zone': managed_zone,
        'record': record,
        'response': response}))
    log.info(json.dumps({
        'message': "DNS RECORD DELETED",
        'project': project,
        'managed_zone': managed_zone,
        'record': record,
        'response': response}))
    return response


def find_garbage(instance: str, ip: str, records: List[dict]) -> List[str]:
    """Identifies DNS records to delete.

    Records are included in the results to be deleted if:
    1. The leftmost portion of the DNS Record name matches the instance name.
    2. AND the rrdatas value has exactly one value matching the ip.
    3. AND the DNS record type is 'A'

    Args:
        instance: The name of the instance.
        ip: The IP address of the VM being deleted.
        records: A list of DNS records as returned from the dns v1 API.
    """
    candidates = []
    log = logging.getLogger(LOGNAME)

    log.debug(json.dumps({'message': 'BEGIN search for deletion candidates',
                          'instance': instance,
                          'ip': ip}))
    for record in records:
        if 'A' != record['type']:
            log.debug(json.dumps({'message': 'Skipped, not an A record',
                                  'record': record}))
            continue
        if instance != record['name'].split('.')[0]:
            log.debug(json.dumps({'message': 'Skipped, shortname != instance',
                                  'record': record}))
            continue
        if [ip] != record['rrdatas']:
            log.debug(json.dumps({'message': 'Skipped, ip does not match',
                                  'record': record}))
            continue
        log.debug(json.dumps({'message': 'MATCHED, record to be deleted',
                             'record': record}))
        candidates.append(record)
    log.debug(json.dumps({'message': 'END search for deletion candidates',
                          'candidates': candidates}))
    return candidates


def ip_address(instance):
    """Given a deserialized instance resource dictionary, return the primary
    network interface IP address as a string"""
    if 'networkInterfaces' in instance:
        networkInterfaces = instance['networkInterfaces']
        if not networkInterfaces:
            return None
        if 'networkIP' in networkInterfaces[0]:
            ip = networkInterfaces[0]['networkIP']
            return ip


def dns_vm_gc(data, context=None, ip_provided: Optional[str] = None,
              http=None):
    """Background Cloud Function to delete DNS A records when VM is deleted.

    Args:
        data (dict): The dictionary with data specific to this type of event.
        context (google.cloud.functions.Context): The Cloud Functions event
            metadata.
        ip_provided (string): Optionally inject the IP address.  Mainly used
            for testing when a VM has already been deleted and the IP cannot be
            obtained.
        http: httplib2.Http, An instance of httplib2.Http or something that
            acts like it that HTTP requests will be made through.
    Returns:
        Number of records deleted across all managed zones.
    """
    setup_logging(context)
    log = logging.getLogger(LOGNAME)

    num_deleted = 0
    dns_project = os.getenv('DNS_VM_GC_DNS_PROJECT')
    if not dns_project:
        raise(EnvironmentError('Env var DNS_VM_GC_DNS_PROJECT is required.'))

    dns_zones = os.getenv('DNS_VM_GC_DNS_ZONES')
    if not dns_zones:
        raise(EnvironmentError('Env var DNS_VM_GC_DNS_ZONES is required'))

    if 'data' not in data:
        raise KeyError("Error: Expected data dictionary contains key 'data'")

    # Event metadata comes from Stackdriver as a JSON string
    event_json = base64.b64decode(data['data']).decode('utf-8')
    event = json.loads(event_json)

    project = event['resource']['labels']['project_id']
    zone = event['resource']['labels']['zone']
    instance = event['labels']['compute.googleapis.com/resource_name']

    event_type = event['jsonPayload']['event_type']
    log.info(json.dumps({
        'message': 'Processing VM deletion event',
        'event_type': event_type,
        'project': project,
        'zone': zone,
        'instance': instance,
    }))

    if event_type != 'GCE_API_CALL':
        log.info(json.dumps({
            'message': 'No action taken.  Event type is not GCE_API_CALL'}))
        return 0

    if ip_provided is None:
        # There is no guarantee the IP will be obtained.  Obtaining the IP is a
        # race against the GCE VM Deletion operation, which typically takes
        # about 30 seconds from the time the delete API call is made.
        # In practice, the get_instance() API call often wins the race.
        ip = ip_address(get_instance(project, zone, instance, http))
    else:
        # This is intended solely for rapid development
        ip = ip_provided

    if not ip:
        msg = ("Could not get IP address. "
               "Obtaining the IP is not guaranteed because of "
               "race condition with VM deletion. "
               "Aborting with no action taken").format(instance)
        log.warning(json.dumps({'instance': instance, 'message': msg}))
        return 0

    zones = [v.strip() for v in dns_zones.split(',')]
    for zone in zones:
        log.debug(json.dumps({
            'message': 'BEGIN Zone cleanup', 'managed_zone': zone}))
        records = dns_records(dns_project, zone, http=http)
        candidates = find_garbage(instance, ip, records)
        for record in candidates:
            delete_record(dns_project, zone, record, http=http)
            num_deleted += 1
        log.debug(json.dumps({
            'message': 'END Zone cleanup', 'managed_zone': zone}))
    return num_deleted


def main(data, context):
    dns_vm_gc(data, context)
