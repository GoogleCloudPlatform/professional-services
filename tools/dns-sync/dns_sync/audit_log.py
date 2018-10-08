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

import datetime
import json
import logging
import time

from google.cloud import datastore
from googleapiclient import errors

from dns_sync import api
from dns_sync import auth
from dns_sync import config


class UTC(datetime.tzinfo):
    """UTC Time Zone."""

    def utcoffset(self, _):
        return datetime.timedelta(0)

    def tzname(self, _):
        return 'UTC'

    def dst(self, _):
        return datetime.timedelta(0)


UTC_INSTANCE = UTC()


def utcnow():
    """Current time in UTC.

    Returns:
        Current time in UTC.
    """
    return datetime.datetime.now(UTC_INSTANCE)


class AuditLogLoop(datastore.Entity):
    """Manage the audit loop.

    In order to verify proper functioning of the system we'll constantly create
    and destroy a coumpute instance the cloud-dns project and check how long it
    takes for the audit event to be received writing a custom metric for the
    results.
    """
    KEY = api.CLIENTS.datastore.key('AuditLogState', 'audit_log_state')
    RESOURCE_NAME = 'dns-sync-test'
    ZONE = 'us-central1-a'
    CUSTOM_METRIC_TYPE = 'custom.googleapis.com/audit_event_delay'

    @classmethod
    def get_state_entity(cls):
        """Returns the AuditLoop state entity.

        Creates the datastore entity if it doesn't exist.

        Returns:
            instance of AuditLogLoop
        """
        state = api.CLIENTS.datastore.get(AuditLogLoop.KEY)
        if state is None:
            state = AuditLogLoop(None)
        else:
            state = AuditLogLoop(state)
        return state

    @classmethod
    def is_audit_log_test_event(cls, message_payload):
        """True if the supplied event is for the test resource.

        Args:
           message_payload: Dictionary populated from audit log message.

        Returns:
            Boolean.
        """
        resource_name = message_payload['resource']['name']
        if resource_name == AuditLogLoop.RESOURCE_NAME:
            return True
        return False

    @classmethod
    def get_custom_metric(cls):
        """Query for and return the Stackdriver audit loop custom metric.

        Returns:
            Dictionary representing the custom metric.
        """
        filter_str = 'metric.type=starts_with("{}")'.format(
            AuditLogLoop.CUSTOM_METRIC_TYPE)
        descriptors = api.CLIENTS.metrics.projects().metricDescriptors().list(
            name='projects/' + config.get_project_id(),
            filter=filter_str).execute()
        return descriptors.get('metricDescriptors', None)

    @classmethod
    def create_custom_metric(cls):
        """Create Stackdriver audit log custom metric.

        Returns:
            Operation for creating the custom metric.
        """
        body = {
            'type': AuditLogLoop.CUSTOM_METRIC_TYPE,
            'labels': [{
                'key': 'call',
                'valueType': 'STRING',
                'description': 'the API call the delay is for. (insert/delete)'
            }],
            'metricKind': 'GAUGE',
            'valueType': 'INT64',
            'unit': 'msecs',
            'description': 'ms delay for receiving GCE audit log events.',
            'displayName': 'dns sync gce audit log delay '
        }
        operation = api.CLIENTS.metrics.projects().metricDescriptors().create(
            name='projects/' + config.get_project_id(), body=body).execute()
        return operation

    @classmethod
    def write_custom_metric(cls, call, value):
        """Writes a value to the audit loop custom metric.

        Args:
            call: The call the metric is for. A string like insert or delete.
            value: Number of milliseconds latency.

        Returns:
            An empty dictionary.
        """
        now = utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        body = {
            'timeSeries': [{
                'metric': {
                    'type': AuditLogLoop.CUSTOM_METRIC_TYPE,
                    'labels': {
                        'call': call
                    }
                },
                'points': [{
                    'interval': {
                        'startTime': now,
                        'endTime': now
                    },
                    'value': {
                        'int64Value': value
                    }
                }]
            }]
        }
        response = api.CLIENTS.metrics.projects().timeSeries().create(
            name='projects/' + config.get_project_id(), body=body).execute()
        return response

    @classmethod
    def get_test_resource(cls):
        """Return the GCE Instance the audit loop uses.

        Returns:
            Dictionary representing the GCE instance, None if not found.

        Raises:
            errors.HttpError: On a failed API call.
        """
        try:
            resource = api.CLIENTS.compute.instances().get(
                instance=AuditLogLoop.RESOURCE_NAME,
                project=config.get_project_id(),
                zone=AuditLogLoop.ZONE).execute()
        except errors.HttpError as e:
            if e.resp.status == 404:
                return None
            else:
                raise
        return resource

    def __init__(self, entity):
        """Create the AuditLogLoop instance.

        Shouldn't be called, use AuditLogLoop.get_entity().

        Args:
            entity: datastore entity holding state.
        """
        if entity:
            super(AuditLogLoop,
                  self).__init__(entity.key, list(entity.exclude_from_indexes))
            self.update(entity)
        else:
            super(AuditLogLoop, self).__init__(AuditLogLoop.KEY, [
                'running', 'current_operation', 'last_call', 'last_call_time',
                'last_event', 'last_event_time', 'last_call_event_received'
            ])
            self.update({
                'running': False,
                'current_operation': None,
                'last_call': None,
                'last_call_time': None,
                'last_event': None,
                'last_event_time': None,
                'last_call_event_received': False
            })

    def start_test_resource(self):
        """Call GCE API to start the test resource.

        Returns:
            GCE operation.
        """
        operation = api.CLIENTS.compute.instances().start(
            instance=AuditLogLoop.RESOURCE_NAME,
            project=config.get_project_id(),
            zone=AuditLogLoop.ZONE).execute()
        self.record_call('start', operation)
        return operation

    def stop_test_resource(self):
        """Call GCE API to stop the test resource.

        Returns:
            GCE operation.
        """
        operation = api.CLIENTS.compute.instances().stop(
            instance=AuditLogLoop.RESOURCE_NAME,
            project=config.get_project_id(),
            zone=AuditLogLoop.ZONE).execute()
        self.record_call('stop', operation)
        return operation

    def delete_test_resource(self):
        """Call GCE API to delete the test resource.

        Returns:
            GCE operation.

        Raises:
            errors.HttpError: On a failed API call.
        """
        request = api.CLIENTS.compute.instances().delete(
            instance=AuditLogLoop.RESOURCE_NAME,
            project=config.get_project_id(),
            zone=AuditLogLoop.ZONE)
        try:
            operation = request.execute()
        except errors.HttpError as e:
            if e.resp.status == 404:
                logging.warning('test resource does not exist')
                return None
            else:
                raise
        self.record_call('delete', operation)
        return operation

    def create_test_resource_body(self):
        """Creates the body of a request to create the test resource.

        Returns:
            A dictionary for supplying as the body parameter of a
            compute.instances.insert call.
        """
        machine_type = ('https://www.googleapis.com/compute/v1/projects/'
                        '{}/zones/{}/machineTypes/f1-micro').format(
                            config.get_project_id(), AuditLogLoop.ZONE)

        network = ('https://www.googleapis.com/compute/v1/projects/'
                   '{}/global/networks/default').format(
                       config.get_project_id())
        image = ('https://www.googleapis.com/compute/v1/projects/'
                 'ubuntu-os-cloud/global/images/family/ubuntu-1604-lts')

        body = {
            'zone': AuditLogLoop.ZONE,
            'machineType': machine_type,
            'name': AuditLogLoop.RESOURCE_NAME,
            'networkInterfaces': [{
                'network': network
            }],
            'disks': [{
                'type': 'PERSISTENT',
                'boot': True,
                'autoDelete': True,
                'initializeParams': {
                    'sourceImage': image
                }
            }]
        }
        return body

    def insert_test_resource(self):
        """Call GCE API to create the test resource.

        Returns:
           GCE operation.

        Raises:
           errors.HttpError: On a failed API call.
        """
        body = self.create_test_resource_body()
        try:
            request = api.CLIENTS.compute.instances().insert(
                project=config.get_project_id(),
                zone=AuditLogLoop.ZONE,
                body=body)
            operation = request.execute()
        except errors.HttpError as e:
            if e.resp.status == 409:
                logging.warning('test resource already exists')
                return None
            else:
                raise
        self.record_call('insert', operation)
        return operation

    def handle_delete_event(self):
        """Handle the delete event.

        The resource was successfully stopped, so wait 30 seconds, then
        start it again.
        """
        if self['running']:
            time.sleep(30)
            self.insert_test_resource()

    def handle_create_event(self):
        """Handle create event.

        The resource was successfully created, so wait 30 seconds, then
        delete it again.
        """
        if self['running']:
            time.sleep(30)
            self.delete_test_resource()

    def record_event(self, message_payload):
        """"Record the event in our metric."""
        self['last_event'] = json.dumps(message_payload)
        now = utcnow()
        self['last_event_time'] = now
        self['last_call_event_received'] = True
        last_call_time = self['last_call_time']
        if last_call_time is not None:
            audit_log_delay_delta = now - last_call_time
            audit_log_delay_seconds = audit_log_delay_delta.total_seconds()
            audit_log_delay_msecs = round(audit_log_delay_seconds * 1000)
            AuditLogLoop.write_custom_metric(self['last_call'],
                                             audit_log_delay_msecs)

    def record_call(self, call, operation):
        """Save the call information in the entity fields."""
        self['last_call'] = call
        self['current_operation'] = json.dumps(operation)
        self['last_call_time'] = utcnow()
        self['last_call_event_received'] = False

    def put(self):
        """Save audit loop state in the datastore."""
        api.CLIENTS.datastore.put(self)


class StartAuditLogLoop(auth.AdminRequestHandler):
    """Web handler to start the audit loop."""

    def post(self):
        """HTTP endpoint to start the audit loop."""
        StartAuditLogLoop.start_audit_log()
        self.response.write('Started')

    @classmethod
    def start_audit_log(cls):
        """Start the audit loop."""
        # Ensure we have a custom metric descriptor.
        metrics = AuditLogLoop.get_custom_metric()
        if metrics is None:
            AuditLogLoop.create_custom_metric()

        # Set AuditLogState's running property to True.
        state = AuditLogLoop.get_state_entity()
        state['running'] = True
        # Check if the resource exists
        instance = AuditLogLoop.get_test_resource()
        # If not then we create it.
        if instance is None:
            state.insert_test_resource()
        # If it does, toggle it. Stop if started.
        elif instance['status'] == 'RUNNING':
            state.stop_test_resource()
        # Start if stopped.
        elif instance['status'] == 'TERMINATED':
            state.start_test_resource()
        state.put()


class StopAuditLogLoop(auth.AdminRequestHandler):
    """Web handler to stop the audit loop."""

    def post(self):
        """HTTP endpoint to stop the audit loop."""
        StopAuditLogLoop.stop_audit_log()
        self.response.write('Stopped')

    @classmethod
    def stop_audit_log(cls):
        """Stop the audit log loop."""
        state = AuditLogLoop.get_state_entity()
        state['running'] = False
        # Check if the resource exists.
        instance = AuditLogLoop.get_test_resource()
        # If so then we delete it.
        if instance is not None:
            state.delete_test_resource()
        state.put()


class GetAuditLogState(auth.AdminRequestHandler):
    """Web handler to return audit loop state."""

    def get(self):
        """Returns json for audit loop state."""
        state = AuditLogLoop.get_state_entity()
        self.response.content_type = 'application/json'

        def datetime_handler(x):
            if isinstance(x, datetime.datetime):
                return x.isoformat()
            raise TypeError("Unknown type")

        self.response.write(json.dumps(state, default=datetime_handler))
