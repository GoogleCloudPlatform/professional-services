# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import base64
import collections
import itertools
import json
import logging
import mimetypes
import os
import re
import time
import urllib

from google.cloud import datastore
from googleapiclient import errors
import webapp2

from dns_sync import api
from dns_sync import audit_log
from dns_sync import auth
from dns_sync import zones


class CreatedDnsResource(datastore.Entity):
    """Store resource data upon creation.

    When a delete event is received we won't have resource data anymore so it's
    not possible to delete the A record. This stores the resource in datastore
    Need the resource upon resource deletion, so save the created resource
    keyed by the string 'project_id:resource_type:resource_id'.
    """
    KIND = 'CreatedDnsResource'

    def __init__(self, entity_id, project_id, resource_name, resource_string,
                 event):
        """Save event received and resource data.

        Args:
            entity_id: should be '<project_id>:<resource_type>:<resource_id>'.
            project_id: id of the project.
            resource_name: name of the resource.
            resource_string: json (as string) of the resource
            event: string of the creation event received.
        """
        super(CreatedDnsResource, self).__init__(
            key=api.CLIENTS.datastore.key(CreatedDnsResource.KIND, entity_id),
            exclude_from_indexes=['resource_string', 'event'])
        self.update({
            'project_id': project_id,
            'resource_name': resource_name,
            'resource_string': resource_string,
            'event': json.dumps(event)
        })

    @classmethod
    def get_by_id(cls, entity_id):
        """Lookup a CreatedDnsResource by id.

        Args:
            entity_id: string id of the entity.

        Returns:
            The found CreatedDnsResource or None.
        """
        entity = api.CLIENTS.datastore.get(
            api.CLIENTS.datastore.key(CreatedDnsResource.KIND, entity_id))
        if entity:
            return CreatedDnsResource(
                entity_id, entity['project_id'], entity['resource_name'],
                entity['resource_string'], entity['event'])
        else:
            return None

    def put(self):
        """Saves entity in datastore."""
        return api.CLIENTS.datastore.put(self)

    def delete(self):
        """Deletes entity from datastore."""
        return api.CLIENTS.datastore.delete(self.key)


def wait_for_dns_operation_completion(operation, zone_name, retry_count=0):
    """Wait for the dns operation to complete.

    Args:
        operation: the operation object to wait on.
        zone_name: dns zone operation is for.
        retry_count: times this operation was waited on.

    Raises:
        Exception: If the operation failed due to an error.
    """
    change = api.CLIENTS.dns.changes().get(
        changeId=operation['id'],
        managedZone=zone_name,
        project=zones.CONFIG.managed_zone_project).execute()
    if change['status'] == 'pending':
        # Retry with backoff and max of 10 seconds.
        time.sleep(min(1.5**retry_count, 10))
        wait_for_dns_operation_completion(
            change, zone_name, retry_count=retry_count + 1)
    elif change['status'] == 'done':
        logging.info('dns change %s completed successfully.',
                     json.dumps(change))
    else:
        raise Exception('dns change {} failed.'.format(json.dumps(change)))


def change_dns_record(change, zone_name, wait_for_operation=True):
    """Apply the input DNS change.

    Calls the dns.change.create API.

    Args:
        change: The change object to apply.
        zone_name: Name of the DNS zone
        wait_for_operation: True if the operation needs to complete before
            returning. If the operation fails, an exception is raised.
    """
    operation = api.CLIENTS.dns.changes().create(
        managedZone=zone_name,
        project=zones.CONFIG.managed_zone_project,
        body=change).execute()
    if wait_for_operation:
        wait_for_dns_operation_completion(operation, zone_name)


def get_a_record(dns_name, zone_name):
    """Lookup an 'A' record with the supplied name.

    Args:
        dns_name: DNS nname of the resource.
        zone_name: Cloud DNS managed zone name.

    Returns:
        The first A record for the DNS resource. None if not found
    """
    rr_set_response = api.CLIENTS.dns.resourceRecordSets().list(
        managedZone=zone_name,
        project=zones.CONFIG.managed_zone_project,
        name=dns_name,
        type='A').execute()
    # There should only be one with this name.
    rr_set = rr_set_response.get('rrsets', [])
    if len(rr_set) >= 1:
        return rr_set[0]
    else:
        return None


def delete_dns_a_records(dns_names, zone_name):
    """Removed the DNS A records from the zone.

    Args:
        dns_names: List of strings. The name of the A records to remove.
        zone_name: Cloud DNS managed zone name.
    """
    # We must get the a_record first to obtain the ip address as we can't
    # delete the dns record with just the name, it requires all data.
    rr_sets = []
    for dns_name in dns_names:
        rr_set = get_a_record(dns_name, zone_name)
        if rr_set:
            rr_sets.append(rr_set)
    # Are there existing records?
    if rr_sets:
        body = {'deletions': rr_sets}
        change_dns_record(body, zone_name)


def get_dns_names(resource, project):
    """Get the DNS Names of a resource.

    Args:
        resource: GCE resource object (like an instance or forwarding rule).
        project: The resource owning project.

    Returns:
        A tuple of three strings: the DNS name of any external IPs
    addresses for the resource, the DNS name for any internal IPs, and the
    Cloud DNS zone name.
    """
    zone_name, zone_dns_name = get_dns_zone(resource)
    resource_name = resource['name']
    return ('{0}.{1}.{2}'.format(resource_name, project, zone_dns_name),
            '{0}.internal.{1}.{2}'.format(resource_name, project,
                                          zone_dns_name),
            zone_name)


def get_dns_zone(resource):
    """Gets the DNS zone and DNS name of the resource.

    Uses the regular_expression_zone_mapping to map the resource to a zone.
    Will use the resource subnet first, otherwise the resource name to match
    against the zone regular expressions. if
    CONFIG.regular_expression_zone_mapping is None or no matches are found.
    then configured default_zone is used.

    Args:
        resource: The GCE resource object, like an instance or forwarding rule.

    Returns:
        Two item tuple of the Cloud DNS zone name and Cloud DNS zone DNS name.
    """
    def find_matching_zone_name(resource_name):
        if resource_name and zones.CONFIG.regular_expression_zone_mapping:
            for reg_expression, zone in iter(
                    zones.CONFIG.regular_expression_zone_mapping):
                if re.search(reg_expression, resource_name):
                    return zone
        return None

    # ForwardingRules have subnet at top level.
    matching_zone_name = find_matching_zone_name(
        resource.get('subnetwork', None))

    # Instance have network in networkInterfaces.
    if not matching_zone_name:
        for network_interface in resource.get('networkInterfaces', []):
            matching_zone_name = find_matching_zone_name(
                network_interface.get('subnetwork', None))
            if matching_zone_name:
                break
    # Otherwise use name.
    if not matching_zone_name:
        matching_zone_name = find_matching_zone_name(
            resource.get('name', None))
    # Rr full link.
    if not matching_zone_name:
        matching_zone_name = find_matching_zone_name(
            resource.get('selfLink', None))
    # Give up and use default.
    if not matching_zone_name:
        matching_zone_name = zones.CONFIG.default_zone
    return (matching_zone_name,
            zones.CONFIG.get_zone_dns_name(matching_zone_name))


def create_dns_a_record(dns_name, ip_addresses, zone_name):
    """Adds a single dns A record with the name and IP addresses.

    Will take care to delete the record of the same name if it exists with
    incorrect IPs.

    Args:
        dns_name: DNS name of the A record
        ip_addresses: List of IP addresses to define the record rrdatas.
        zone_name: Cloud DNS zone name to create the records in.
    """
    rr_set = get_a_record(dns_name, zone_name)
    body = {}
    # Record present and is wrong.
    if rr_set and ip_addresses != rr_set.get('rrdatas', []):
        body['deletions'] = [rr_set]
    if not rr_set or ('deletions' in body):
        body['additions'] = [{
            'name': dns_name,
            'type': 'A',
            'ttl': 300,
            'rrdatas': ip_addresses
        }]
    # Is there any work to do? body is empty if the record already exists.
    if body:
        change_dns_record(body, zone_name)


def append_records(a_records, prefix, network_interface, dns_name,
                  dns_internal_name):
    """Append a tuple of dns_name and ip address to the input a_records list.

    Args:
       a_records: List to append to.
       prefix: Prefix to use when appending records.
       network_interface: Network interface on the GCE instance.
       dns_name: DNS suffix for external IPs.
       dns_internal_name: DNS suffix for internal IPs.
    """
    internal_ip = network_interface['networkIP']
    a_records.append((prefix + dns_internal_name, [internal_ip]))
    external_ips = []
    for access_config in network_interface.get('accessConfigs', []):
        external_ip = access_config.get('natIP', None)
        if external_ip:
            external_ips.append(external_ip)
    if external_ips:
        a_records.append((prefix + dns_name, external_ips))


def get_zone_name_and_ips_for_resource(resource, project):
    """Get Cloud DNS zone name and list of dns name and IPs for a resource.

    Args:
        resource: GCE resource.
        project: Name of the project.

    Returns:
        A tuple containing zone_name and list of tuples of dns_name and ip
        associated with a resource.
        For example:
        (zone_name, [(dns_name, [ip,ip]), (dns_name, [ip,ip])])
    """
    a_records = []
    dns_name, dns_internal_name, zone_name = get_dns_names(resource, project)
    # Perhaps we deleted the datastore entry already and this is a delete
    # attempt. Just delete everything then.
    if 'kind' not in resource:
        prefix = ''
        for i in xrange(0, 10):
            if i > 0:
                prefix = 'nic{}.'.format(i)
            a_records.append((prefix + dns_name, []))
            a_records.append((prefix + dns_internal_name, []))
        return zone_name, a_records

    if resource['kind'] == 'compute#instance':

        # Process all IP addresses, but the first IP address is considered the
        # primary doesn't have an interface prefixed. for example, an instance
        # with three intrfaces will have the dns names:
        #
        #         instance-1.project.mydns.com
        #    nic0.instance-1.project.mydns.com
        #    nic1.instance-1.project.mydns.com
        #    nic2.instance-1.project.mydns.com
        #
        #    with ip for instance-1.project.mydns.com equal to
        #    nic0.instance-1.project.mydns.com
        for i, interface in enumerate(resource['networkInterfaces']):
            if i == 0:
                append_records(a_records, '', interface, dns_name,
                               dns_internal_name)
            prefix = interface.get('name', 'nic{}'.format(i)) + '.'
            append_records(a_records, prefix, interface, dns_name,
                           dns_internal_name)
    elif resource['kind'] == 'compute#forwardingRule':
        a_records.append((dns_name, [resource['IPAddress']]))
    return zone_name, a_records


def create_dns_a_records_for_resource(resource, project):
    """Create the dns records for a GCE resource.

    Args:
       resource: The resource object, like a instance or forwardingRule.
       project: Project ID that owns the resource.
    """
    zone_name, a_records = get_zone_name_and_ips_for_resource(
        resource, project)
    logging.debug('creating records %s for resource %s in zone %s', a_records,
                  resource, zone_name)
    deletions = []
    additions = []
    for (dns_name, ip_addresses) in a_records:
        rr_set = get_a_record(dns_name, zone_name)
        # Record present and wrong.
        if rr_set and ip_addresses != rr_set.get('rrdatas', []):
            deletions.append(rr_set)
        elif not rr_set:
            additions.append({
                'name': dns_name,
                'type': 'A',
                'ttl': 300,
                'rrdatas': ip_addresses
            })

    body = {}
    if deletions:
        body['deletions'] = deletions
    if additions:
        body['additions'] = additions
    # When body is empty, there is no work to do.
    if body:
        change_dns_record(body, zone_name)


def get_project_from_dns_name(dns_name, zone_name):
    """Find the project a DNS name is for.

    Args:
        dns_name: The name of the A record.
        zone_name: Cloud DNS zone name.

    Returns:
        The project ID parsed out of the DNS name. None if no project ID could
        be found.
    """
    # Strip the zone dns name suffix.
    instance_project = dns_name[:-len(
        zones.CONFIG.get_zone_dns_name(zone_name)) + 1]
    match = re.match(r'[^.]+(?:\.internal)?\.([^.]+)', instance_project)
    if match:
        return match.groups(0)[0]
    return None


class SyncProjectsWithDns(auth.AdminRequestHandler):
    """Sync a cloud DNS zone with the GCE resources.

    Accepts one or more project IDs in the request and syncs the Cloud DNS zone
    with those resources creating and deleting DNS 'A' records in the zone.
    """

    def get_project_instances(self, project):
        """List all GCE instances in the project.

        Args:
            project: Project id.

        Returns:
            List of GCE instances.
        """
        instances = []

        def instance_pager(page_token):
            return api.CLIENTS.compute.instances().aggregatedList(
                project=project,
                filter='status eq RUNNING',
                pageToken=page_token)

        for _, instance_list in api.resource_iterator(instance_pager):
            for instance in instance_list.get('instances', []):
                instances.append(instance)
        return instances

    def get_project_forwarding_rules(self, project):
        """List all forwarding rules in the project.

        Args:
            project: Project id.

        Returns:
            List of forwarding rules.
        """
        forwarding_rules = []

        def rules_pager(page_token):
            return api.CLIENTS.compute.forwardingRules().aggregatedList(
                project=project, pageToken=page_token)

        for _, forwarding_rules_list in api.resource_iterator(rules_pager):
            for rule in forwarding_rules_list.get('forwardingRules', []):
                forwarding_rules.append(rule)
        return forwarding_rules

    def translate_to_a_records(self, project, instances, forwarding_rules):
        """Convert project resources into A records.

        Args:
            project: Project id.
            instances: List of GCE instances.
            forwarding_rules: List of forwarding rules.

        Returns:
            A dictionary mapping a Cloud DNS zone name to list of A records
            that should exist in that zone.
        """
        a_records_to_add = collections.defaultdict(list)
        # Translate all project resources into a list of A records to
        # create.
        for resource in itertools.chain(instances, forwarding_rules):
            zone_name, a_records = get_zone_name_and_ips_for_resource(
                resource, project)
            # Add CreatedDnsResource.
            create_dns_rsource_id = '{}:{}:{}'.format(
                project, resource['kind'][8:], resource['id'])
            if not CreatedDnsResource.get_by_id(create_dns_rsource_id):
                CreatedDnsResource(
                    entity_id=create_dns_rsource_id,
                    project_id=project,
                    resource_string=json.dumps(resource),
                    resource_name=resource['name'],
                    event='synced').put()

            for dns_name, ip_addresses in a_records:
                a_records_to_add[zone_name].append({
                    'name': dns_name,
                    'type': 'A',
                    'ttl': 300,
                    'rrdatas': ip_addresses
                })
        return a_records_to_add

    def get_a_records_to_add(self, project):
        """Returns all A records that should be added for a project.

        Args:
            project: Project id.

        Returns:
            A dictionary mapping a Cloud DNS zone name to list of A records
            that should exist in that zone.
        """
        return self.translate_to_a_records(
            project,
            self.get_project_instances(project),
            self.get_project_forwarding_rules(project))

    def merge_with_existing_records(self, records_to_add, records_to_delete,
                                    projects, zone_name):
        """Determine the change to be made to a Cloud DNS zone.

        Loop through all Cloud DNS records in the zone modifying the input
        records_to_add and records_to_delete lists to contain the changes that
        need to be made. For example, not creating a record that already
        exists, deleting records that need to be changed or aren't in the list
        to add.

        Args:
            records_to_add: List of A records to add.
            records_to_delete: List of A records to delete.
            projects: List of project ids.
            zone_name: Cloud DNS name of the zone to sync to.
        """
        def rr_set_pager(page_token):
            return api.CLIENTS.dns.resourceRecordSets().list(
                managedZone=zone_name,
                project=zones.CONFIG.managed_zone_project,
                type='A',
                pageToken=page_token)

        # Loop through all existing dns a records, if it's for a
        # project we are syncing determine if we should delete the
        # record or keep it by removing it from list to add.
        for existing_a_record in api.resource_iterator(rr_set_pager):
            logging.debug('existing a record %s', existing_a_record)
            record_project = get_project_from_dns_name(
                existing_a_record['name'], zone_name)
            logging.debug('record project %s', record_project)
            # If the record isn't for a project we are syncing
            # ignore it.
            if record_project not in projects:
                continue

            matching_record = None
            logging.debug('zone records to add %s', records_to_add)
            for a_record_to_add in records_to_add:
                if (a_record_to_add['name'] == existing_a_record['name'] and
                        a_record_to_add['rrdatas'] ==
                        existing_a_record['rrdatas']):
                    matching_record = a_record_to_add
                    break

            if matching_record:
                logging.debug('record exists for resource %s',
                              matching_record['name'])
                records_to_add.remove(matching_record)
                break

            # existing record has no matching resource
            if not matching_record:
                logging.debug('no resource forrecord %s. deleting it',
                              existing_a_record['name'])
                records_to_delete.append(existing_a_record)

    def post(self):
        """Sync projects webhook.

        Accepts the 'projects' multi value request parameter to determine
        projects to sync, when not supplied, it syncs all projects we have
        access to.
        """
        projects = self.request.get_all('projects', [])
        # Get list of projects we have access to.
        if not projects:
            projects = [
                project.project_id
                for project in api.CLIENTS.crm.list_projects()
            ]

        logging.info('syncing projects: ' + str(projects))
        # From zone_name->a_records for all projects we are syncing.
        a_records_to_add = collections.defaultdict(list)
        for project in projects:
            a_records = self.get_a_records_to_add(project)
            for zone, records in a_records.iteritems():
                a_records_to_add[zone].extend(records)

        # Determine what records need to be deleted,
        a_records_to_delete = collections.defaultdict(list)

        # Get all the a records in all managed zones.
        managed_zones = [zones.CONFIG.default_zone]
        if zones.CONFIG.regular_expression_zone_mapping:
            for _, zone in iter(zones.CONFIG.regular_expression_zone_mapping):
                if zone not in managed_zones:
                    managed_zones.append(zone)

        for zone_name in managed_zones:
            logging.debug('processing zone %s', managed_zones)
            records_to_add = a_records_to_add[zone_name]
            records_to_delete = a_records_to_delete[zone_name]
            self.merge_with_existing_records(records_to_add, records_to_delete,
                                             projects, zone_name)

            # Are there records to add or delete in the zone?
            if records_to_add or records_to_delete:
                changes = {
                    'additions': records_to_add,
                    'deletions': records_to_delete
                }
                # But don't wait for operation to complete.
                # as there are many of them to send.
                change_dns_record(changes, zone_name, False)


class ComputeEngineActivityPush(webapp2.RequestHandler):
    """Process a single compute engine activity record.

    The event is expected comes from an pub/sub push subscription which
    supplies the expected pubsub_shared_secret as a request parameter.
    """

    def handle_delete_activity(self, project, resource_type, resource_id,
                               message_payload):
        """Process a resource deleted event.

        Args:
            project: Name of project owning the resource.
            resource_type: Type of the resource like "instance" or
                           "forwardingRule".
            resource_id: unique id of the resource.
            message_payload: pubsub message payload.
        """
        # We need resource body (which isn't in the event), so lookup by key
        # saved from prior create event.
        stored_resource_id = '{}:{}:{}'.format(project, resource_type,
                                               resource_id)

        state = None
        if audit_log.AuditLogLoop.is_audit_log_test_event(message_payload):
            state = audit_log.AuditLogLoop.get_state_entity()
            state.record_event(message_payload)

        stored_resource = CreatedDnsResource.get_by_id(stored_resource_id)
        resource = None
        if stored_resource is None:
            resource_name = message_payload['resource']['name']
            logging.warning('no resource for delete %s, with name %s',
                            stored_resource_id, resource_name)
            resource = {'name': resource_name}
        else:
            resource = json.loads(stored_resource['resource_string'])

        # Lookup names for the resource
        zone_name, a_records = get_zone_name_and_ips_for_resource(
            resource, project)

        delete_dns_a_records([name for name, _ in a_records], zone_name)

        # Only delete the datastore record if the resource is deleted. (NOT
        # when the GCE instance is).
        event_subtype = message_payload['event_subtype']
        if (event_subtype != 'compute.instances.stop' and
            (stored_resource is not None)):
            stored_resource.delete()

        # Record this event if it's an audit log test loop for metrics
        # analysis.
        if state is not None:
            state.handle_delete_event()
            state.put()

    def handle_create_activity(self, project, resource_type, resource_id,
                               message_payload):
        """Process a resource created event.

        Args:
            project: Name of project owning the resource.
            resource_type: Type of the resource like "instance" or
                           "forwardingRule".
            resource_id: unique id of the resource.
            message_payload: pubsub message payload.
        """
        state = None
        if audit_log.AuditLogLoop.is_audit_log_test_event(message_payload):
            state = audit_log.AuditLogLoop.get_state_entity()
            state.record_event(message_payload)

        # If this is an insert operation lookup the resource to find via the
        # operation.
        operation_reference = message_payload['operation']
        operation_name = operation_reference['name']

        operation = None
        try:
            if 'global' in operation_reference:
                operation = api.CLIENTS.compute.globalOperations().get(
                    operation=operation_name, project=project).execute()
            elif 'region' in operation_reference:
                operation = api.CLIENTS.compute.regionOperations().get(
                    operation=operation_name,
                    project=project,
                    region=operation_reference['region']).execute()
            elif 'zone' in operation_reference:
                operation = api.CLIENTS.compute.zoneOperations().get(
                    operation=operation_name,
                    project=project,
                    zone=operation_reference['zone']).execute()
        except errors.HttpError as e:
            if e.resp.status == 404:
                # Don't raise exception on 404, some operations like GAE
                # Flexible operations can't be retrieved.
                logging.debug('unable to retreive operation %s/%s', project,
                              operation_name)
                return
            else:
                raise

        # Lookup the resource the operation was performed on
        # as we need external IP and perhaps subnet.
        resource_url = operation['targetLink']
        response, content = api.CLIENTS.compute._http.request(resource_url)
        if (response.status < 200) or (response.status >= 300):
            logging.error('unable %s to get resource from url %s: %s',
                          response.status, resource_url, content)
            return

        resource = json.loads(content)

        # Save the resource in the datastore so we can retrieve it upon
        # resource deletion. as we won't be able to lookup the resource again
        # when we get the delete operation notification.
        stored_resource_id = '{}:{}:{}'.format(project, resource_type,
                                               resource_id)
        logging.debug('adding stored resource with id %s', stored_resource_id)
        resource_name = message_payload['resource']['name']
        stored_resource = CreatedDnsResource(
            entity_id=stored_resource_id,
            project_id=project,
            resource_name=resource_name,
            resource_string=content,
            event=message_payload)
        stored_resource.put()

        create_dns_a_records_for_resource(resource, project)

        if state is not None:
            state.handle_create_event()
            state.put()

    def parse_audit_log_message(self, message_body):
        """Parse out useful values from the received message body.

        Handles boths logs v1 and v2 format messages.

        Args:
            message_body: The received message.

        Returns:
            Tuple of (resource_type, resource_id, project, message_payload)
            where the resource_type is the type of the resoruce like 'instance'
            or 'forwardingRule', resource_id is a unique identifier of the
            resource, project is id of the project owning the resource and
            message_payload is the decoded and parsed message body.
        """
        message_string = base64.b64decode(str(message_body['data']))
        logging.debug('decoded message %s', message_string)
        message = json.loads(message_string)

        attrs = message_body['attributes']
        resource_type = attrs.get('compute.googleapis.com/resource_type', None)
        # this is V1 format if we have a resource type
        if resource_type:
            message_payload = message['structPayload']
            project = message['metadata']['projectId']
            resource_id = attrs['compute.googleapis.com/resource_id']
        else:
            message_payload = message['jsonPayload']
            project = message['resource']['labels']['project_id']
            resource_id = message['labels'][
                'compute.googleapis.com/resource_id']

        resource_type = message_payload['resource']['type']
        return resource_type, resource_id, project, message_payload

    def post(self):
        """Accept and process the pub/sub exported log message.

        Expected to be the target of a pub/sub push endpoint feed from a logs
        export sink.
        """
        # Look for a shared secret.
        request_secret = self.request.params.get('secret')
        expected_secret = zones.CONFIG.pubsub_shared_secret

        # Require a configured secret.
        if not expected_secret:
            logging.error('no configured shared secret, rejecting request')
            self.response.status = 500
            return

        # Reject request if secret doesn't match.
        if request_secret != expected_secret:
            logging.info('request with unexpected secret token')
            self.response.status = 403
            return

        # pub/sub post body will be have request body
        #
        # {message:{ data: <base-64-string>
        #                        attributes: { <key>:<value>}
        #                        message_id: <message-id>}
        # subscription: <subscription-name>}
        #
        # ony processes messages that have associated DNS records

        logging.debug('received request_body %s', self.request.body)
        request_body = json.loads(
            urllib.unquote(self.request.body).rstrip('='))
        message_body = request_body['message']
        subscription = request_body['subscription']
        message_id = message_body['message_id']

        (resource_type, resource_id, project,
         message_payload) = self.parse_audit_log_message(message_body)

        errors = message_payload.get('error', ())
        if (resource_type not in ['instance', 'forwardingRule'] or errors):
            logging.info('message %s/%s for %s not interesting for dns sync',
                         subscription, message_id, resource_type)
            return

        event_type = message_payload['event_type']

        if event_type != 'GCE_OPERATION_DONE':
            logging.info('message %s/%s is not a completed operation',
                         subscription, message_id)
            return

        # if we are a delete operation, delete the dns name
        delete_types = [
            'compute.instances.stop', 'compute.instances.delete',
            'compute.forwardingRules.delete',
            'compute.globalForwardingRules.delete'
        ]
        event_subtype = message_payload['event_subtype']

        # TODO: Need to create/delete DNS records when assigning external IPs
        # to instances.
        #
        # TODO: only delete the record if we are stopping an instance with an
        # ephemeral IP?
        if event_subtype in delete_types:
            self.handle_delete_activity(project, resource_type, resource_id,
                                        message_payload)
        else:
            self.handle_create_activity(project, resource_type, resource_id,
                                        message_payload)


class AdminStaticFileHandler(auth.AdminRequestHandler):
    """Serve static connect.

    Super class AdminRequestHandler will verify the requestor has proper
    credentials.
    """

    def get(self, path):
        """Serve the requested resource to the client.

        Super class will validate credentials. Returns the file in the HTTP
        response, or a 404 if the resource can not be found.

        Args:
            path: path to the resource.
        """
        abs_path = os.path.abspath(os.path.join('static', path))
        if '..' in abs_path:
            self.response.set_status(400)
            return
        if os.path.isdir(abs_path) or abs_path.find(os.getcwd()) != 0:
            self.response.set_status(403)
            return
        try:
            with open(abs_path, 'r') as f:
                content_type = mimetypes.guess_type(abs_path)[0]
                self.response.content_type = content_type
                self.response.out.write(f.read())
        except IOError:
            self.response.set_status(404)


class DnsSyncApplication(webapp2.WSGIApplication):
    """The webapp2 application."""

    def __init__(self):
        """Define routes to handlers."""
        super(DnsSyncApplication, self).__init__([
            ('/push_notification', ComputeEngineActivityPush),
            ('/start_audit_log_loop', audit_log.StartAuditLogLoop),
            ('/logout', auth.Logout),
            ('/auth', auth.Oauth2Callback),
            ('/stop_audit_log_loop', audit_log.StopAuditLogLoop),
            ('/get_zone_config', zones.GetZoneConfig),
            ('/get_projects', zones.GetProjects),
            ('/get_project_zones', zones.GetProjectZones),
            ('/set_zone_config', zones.SetZoneConfig),
            ('/get_audit_log_state', audit_log.GetAuditLogState),
            ('/static/(.+)', AdminStaticFileHandler),
            ('/sync_projects', SyncProjectsWithDns),
            webapp2.Route(
                '/',
                webapp2.RedirectHandler,
                defaults={'_uri': '/static/index.html'}),
            webapp2.Route(
                '/index.html',
                webapp2.RedirectHandler,
                defaults={'_uri': '/static/index.html'}),
            webapp2.Route(
                '/favicon.ico',
                webapp2.RedirectHandler,
                defaults={'_uri': '/static/images/favicon.ico'}),
        ])


APP = DnsSyncApplication()

# Allow running as a stand alone server if run from the command line.
if __name__ == '__main__':
    from paste import httpserver
    logging.basicConfig(level=logging.DEBUG)
    httpserver.serve(APP, host='127.0.0.1', port='8080')
