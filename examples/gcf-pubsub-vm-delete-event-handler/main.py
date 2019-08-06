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

__author__ = ('Jeff McCune <jeff@openinfrastructure.co>, '
              'Gary Larizza <gary@openinfrastructure.co>')

import base64
import json
import logging
import os
import google.cloud.logging
from enum import Enum
from google.cloud.logging.resource import Resource
from googleapiclient import discovery
from googleapiclient.errors import HttpError
from typing import List


class RuntimeState:
    """Stores App instance for the lifetime of the process"""
    pass


RuntimeState.app = None


class Result(Enum):
    """The overall result of the DNS cleanup for user reporting

    An OK result indicates the cleanup completed normally.

    A NOT_PROCESSED results is likely a result of losing the race against the
    VM delete operation and is intended to signal to the user they may need to
    cleanup DNS records using another mechanism (e.g. manually).
    """
    OK = 0
    NOT_PROCESSED = 1


class Severity(Enum):
    """Stackdriver severity levels

    See https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry
    """
    DEFAULT = 0
    DEBUG = 100
    INFO = 200
    NOTICE = 300
    WARNING = 400
    ERROR = 500
    CRITICAL = 600
    ALERT = 700
    EMERGENCY = 800


class Detail(Enum):
    """Detailed results of the cleanup

    A LOST_RACE result indicates user intervention is necessary.
    """
    NO_OP = 0
    NO_MATCHES = 1
    RR_DELETED = 2
    VM_NO_IP = 3
    IGNORED_EVENT = 4
    LOST_RACE = 5
    RR_MISMATCH = 6
    RR_NOT_A_RECORD = 7
    RR_NAME_MISMATCH = 8
    RR_IP_MISMATCH = 9


class StructuredLog(object):
    """Base class to report structured log events

    Sub classes are expected to override MESSAGE (str), RESULT (Result), and
    DETAIL (Detail).

    """
    MESSAGE = '{} mark'
    RESULT = None
    DETAIL = None
    SEVERITY = Severity.NOTICE
    LEVEL = logging.INFO

    def __init__(self, vm_uri: str, event_id: str):
        self.vm_uri = vm_uri
        self.event_id = event_id
        self.function_project = os.getenv('GCP_PROJECT')
        self.function_region = os.getenv('FUNCTION_REGION')
        self.function_name = os.getenv('FUNCTION_NAME')
        stream = os.getenv('DNS_VM_GC_REPORTING_LOG_STREAM')
        # The log stream structured reports are sent to.
        # https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry
        if stream:
            self.log_name = stream
        else:
            self.log_name = (
                'projects/{}/logs/{}'
            ).format(self.function_project, self.function_name)

    def message(self):
        """Returns a human readable log message"""
        return self.MESSAGE.format(self.vm_uri)

    def result(self):
        """Result code of the DNS cleanup, e.g. OK or NOT_PROCESSED"""
        return self.RESULT.name

    def detail(self):
        """Detail code of the DNS cleanup, e.g. NO_OP, RR_DELETED, LOST_RACE"""
        return self.DETAIL.name

    def severity(self):
        """Stackdriver Log Severity

        https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry
        """
        return self.SEVERITY.name

    def info(self):
        """Assembles dict intended for jsonPayload"""
        return {
            'message': self.message(),
            'vm_uri': self.vm_uri,
            'result': self.result(),
            'detail': self.detail(),
        }

    def log_entry(self):
        """Assembles dict intended for use as LogEntry

        This structure is generally passed as keyword arguments to the
        google.cloud.logging.log_struct() function.
        """
        resource_labels = {
            'function_name': self.function_name,
            'project_id': self.function_project,
            'region': self.function_region,
        }
        resource = Resource(labels=resource_labels, type='cloud_function')
        log_entry = {
            'log_name': self.log_name,
            'labels': {
                'event_id': self.event_id,
            },
            'severity': self.severity(),
            'resource': resource,
        }
        return log_entry


class NoOp(StructuredLog):
    MESSAGE = "{} No action taken (NO_OP)"


class IgnoredEventSubtype(StructuredLog):
    """Log for when pub/sub event subtype is ignored e.g. GCE_OPERATION_DONE"""
    MESSAGE = "No action taken, event_type is not GCE_API_CALL for {}"
    SEVERITY = Severity.DEBUG
    RESULT = Result.OK
    LEVEL = logging.DEBUG
    DETAIL = Detail.IGNORED_EVENT


class NoMatches(StructuredLog):
    MESSAGE = "{} matches no DNS records (NO_MATCHES)"
    SEVERITY = Severity.DEBUG
    RESULT = Result.OK
    LEVEL = logging.DEBUG
    DETAIL = Detail.NO_MATCHES


class LostRace(StructuredLog):
    MESSAGE = "{} does not exist, likely lost race (LOST_RACE)"
    SEVERITY = Severity.WARNING
    RESULT = Result.NOT_PROCESSED
    LEVEL = logging.WARNING
    DETAIL = Detail.LOST_RACE


class VmNoIp(StructuredLog):
    MESSAGE = "{} has no IP address (VM_NO_IP)"
    SEVERITY = Severity.INFO
    RESULT = Result.OK
    LEVEL = logging.INFO
    DETAIL = Detail.VM_NO_IP


class RecordSkipped(StructuredLog):
    MESSAGE = "{} does not match DNS record {} ({})"
    SEVERITY = Severity.DEBUG
    RESULT = Result.OK
    LEVEL = logging.DEBUG
    DETAIL = Detail.RR_MISMATCH

    def __init__(self, vm_uri: str, event_id: str, record: dict):
        super().__init__(vm_uri, event_id)
        self.record = record

    def message(self):
        return self.MESSAGE.format(self.vm_uri, self.record['name'],
                                   self.DETAIL.name)


class NotARecord(RecordSkipped):
    DETAIL = Detail.RR_NOT_A_RECORD


class NameMismatch(RecordSkipped):
    DETAIL = Detail.RR_NAME_MISMATCH


class IpMismatch(RecordSkipped):
    DETAIL = Detail.RR_IP_MISMATCH


class RecordDeleted(StructuredLog):
    MESSAGE = "{} matches DNS record {} deleted (RR_DELETED)"
    SEVERITY = Severity.NOTICE
    RESULT = Result.OK
    LEVEL = logging.INFO
    DETAIL = Detail.RR_DELETED

    def __init__(self, vm_uri: str, event_id: str, dns_project: str,
                 dns_managed_zone: str, record: dict, response: dict):
        """The structure of record is a dns#resourceRecordSet

        See: https://cloud.google.com/dns/docs/reference/v1/resourceRecordSets
        """
        super().__init__(vm_uri, event_id)
        self.dns_project = dns_project
        self.dns_managed_zone = dns_managed_zone
        self.record = record
        self.response = response

    def message(self):
        return self.MESSAGE.format(self.vm_uri, self.record['name'])

    def info(self):
        info = super().info()
        info.update({
            'dns_project': self.dns_project,
            'dns_managed_zone': self.dns_managed_zone,
            'dns_record': self.record,
            'response': self.response,
        })
        return info


class EventHandler():
    """Handles a single event.

    Intended to follow the lifecycle of a single trigger event.
    """

    def __init__(self, app, data, context=None):
        self.config = self.load_configuration()
        self.log = app.log
        self.cloud_log = app.cloud_log
        self.compute = app.compute
        self.dns = app.dns
        self.event_id = context.event_id if context else context
        self.validate_data(data)
        event = self.parse_data(data)
        self.type = event['type']
        self.event_subtype = event['event_subtype']
        self.resource_type = event['resource_type']
        self.project = event['project']
        self.zone = event['zone']
        self.vm_name = event['vm_name']
        self.vm_uri = "projects/{}/zones/{}/instances/{}".format(
            self.project, self.zone, self.vm_name
        )
        # https://cloud.google.com/functions/docs/env-var
        self.function_project = os.getenv('GCP_PROJECT')
        self.function_region = os.getenv('FUNCTION_REGION')
        self.function_name = os.getenv('FUNCTION_NAME')
        self.debug = True if os.getenv('DEBUG') else False

    def load_configuration(self):
        """Loads configuration from the environment

        Returns:
          Dictionary of config key/values.
        """
        dns_project = os.getenv('DNS_VM_GC_DNS_PROJECT')
        if not dns_project:
            raise(EnvironmentError(
                'Env var DNS_VM_GC_DNS_PROJECT is required.'
            ))
        dns_zones = os.getenv('DNS_VM_GC_DNS_ZONES')
        if not dns_zones:
            raise(EnvironmentError('Env var DNS_VM_GC_DNS_ZONES is required'))
        zones = [v.strip() for v in dns_zones.split(',')]
        return {
            'dns_project': dns_project,
            'dns_zones': zones,
        }

    def log_event(self, event: StructuredLog):
        """Logs a structured event intended for end user reporting"""
        if event.SEVERITY == Severity.DEBUG and not self.debug:
            return
        self.log.log(event.LEVEL, event.message())
        self.cloud_log.log_struct(info=event.info(), **event.log_entry())

    def run(self):
        """Processes an event"""
        valid_event = self.validate_event_type(
            event_type=self.type,
            event_subtype=self.event_subtype,
            resource_type=self.resource_type,
        )
        if not valid_event:
            self.log_event(IgnoredEventSubtype(self.vm_uri, self.event_id))
            return 0

        msg = "Handling event_id='{}' vm='{}'".format(
            self.event_id,
            self.vm_uri
        )
        self.log.info(msg)

        instance = self.get_instance(self.project, self.zone, self.vm_name)
        if not instance:
            self.log_event(LostRace(self.vm_uri, self.event_id))
            return 0

        ip = self.ip_address(instance)
        if not ip:
            self.log_event(VmNoIp(self.vm_uri, self.event_id))
            return 0

        num_deleted = 0
        dns_project = self.config['dns_project']
        for zone in self.config['dns_zones']:
            records = self.dns_records(dns_project, zone)
            candidates = self.find_garbage(self.vm_name, ip, records)
            for record in candidates:
                self.delete_record(dns_project, zone, record)
                num_deleted += 1
        return num_deleted

    def log_struct(self, msg: str, struct: dict = {}, **kw):
        """Logs a structured message

        Annotated with metadata about the event being handled.

        Args:
          msg: Text message to log via message key in log structure.
          struct: Additional key/value attributes to log in the log structure.
          **kw: (optional) additional keyword arguments for the entry.  See
            :class:`~google.cloud.logging.entries.LogEntry`.
        """
        # Note: If the log name has a prefix of
        # `cloudfunctions.googleapis.com/cloud-functions` then message will not
        # be parsed from jsonPayload in the Console UI.
        log_name = (
            'projects/{}/logs/reports%2F{}'
        ).format(self.function_project, self.function_name)
        jsonPayload = {'vm_uri': self.vm_uri}
        jsonPayload.update(struct)
        resource_labels = {
            'function_name': self.function_name,
            'project_id': self.function_project,
            'region': self.function_region,
        }
        resource = Resource(labels=resource_labels, type='cloud_function')
        log_entry = {
            'log_name': log_name,
            'labels': {
                'event_id': self.event_id,
            },
            'severity': 'INFO',
            'resource': resource,
        }
        log_entry.update(kw)
        jsonPayload['message'] = msg
        self.cloud_log.log_struct(info=jsonPayload, **log_entry)

    def dns_records(self, project: str, managed_zone: str) -> List[dict]:
        """Obtain a collection of A records from Cloud DNS.

        See
        https://cloud.google.com/dns/docs/reference/v1/resourceRecordSets/list

        Args:
            project: The project containing the Cloud DNS managed zone.
              Typically the VPC Host project.
            managed_zone: The Cloud DNS managed zone to scan for records.
        """
        request = self.dns.resourceRecordSets().list(
            project=project,
            managedZone=managed_zone
        )
        records = []
        while request is not None:
            try:
                response = request.execute()
                for resource_record_set in response['rrsets']:
                    records.append(resource_record_set)
                request = self.dns.resourceRecordSets().list_next(
                    previous_request=request,
                    previous_response=response)
            except HttpError as err:
                msg = (
                    'Could not get DNS records.  Check managed '
                    'zones specified in DNS_VM_GC_DNS_ZONES '
                    'exist in DNS_VM_GC_DNS_PROJECT.  Detail: {}'
                ).format(err)
                self.log.error(msg)
                request = None
        return records

    def delete_record(self, project: str, managed_zone: str, record: dict):
        """Deletes a DNS Resource Record Set.

        See https://cloud.google.com/dns/docs/reference/v1/changes

        Args:
            project: The project containing the Cloud DNS managed zone.
              Typically the VPC Host project.
            managed_zone: The Cloud DNS managed zone to scan for records.
            record: A DNS record dictionary, must have at least 'name' key and
              value.
        """
        change = {"kind": "dns#change", "deletions": [record]}
        request = self.dns.changes().create(
            project=project,
            managedZone=managed_zone,
            body=change)
        response = request.execute()

        event = RecordDeleted(self.vm_uri, self.event_id, project,
                              managed_zone, record, response,)
        self.log_event(event)
        return response

    def find_garbage(self,
                     instance: str,
                     ip: str,
                     records: List[dict]) -> List[dict]:
        """Identifies DNS records to delete.

        Records are included in the results to be deleted if:
        1. The leftmost portion of the DNS Record name matches the vm name.
        2. AND the rrdatas value has exactly one value matching the ip.
        3. AND the DNS record type is 'A'

        Args:
            instance: The name of the instance.
            ip: The IP address of the VM being deleted.
            records: A list of DNS records as returned from the dns v1 API.
        """
        candidates = []

        for record in records:
            if 'A' != record['type']:
                self.log_event(NotARecord(self.vm_uri, self.event_id, record))
                continue
            if instance != record['name'].split('.')[0]:
                self.log_event(NameMismatch(self.vm_uri, self.event_id,
                                            record))
                continue
            if [ip] != record['rrdatas']:
                self.log_event(IpMismatch(self.vm_uri, self.event_id, record))
                continue
            candidates.append(record)
        return candidates

    def ip_address(self, instance):
        """Parses the primary network IP from a VM instance Resource.

        Args:
        Returns: (string) ip address or None if IP not found
        """
        ip = None
        if 'networkInterfaces' in instance:
            networkInterfaces = instance['networkInterfaces']
            if networkInterfaces:
                if 'networkIP' in networkInterfaces[0]:
                    ip = networkInterfaces[0]['networkIP']
        return ip

    def get_instance(self, project, compute_zone, instance):
        """Return the results of the compute.instances.get API call
        Args:
            project (string): The project
            compute_zone (string): The compute_zone
            instance (string): The instance name
        Returns:
            (dict) De-serialized JSON API response as a Dictionary.
        """
        try:
            result = self.compute.instances().get(
                project=project,
                zone=compute_zone,
                instance=instance).execute()
        except HttpError as err:
            self.log.error("Getting {}: {}".format(self.vm_uri, err))
            result = {}
        return result

    def validate_data(self, data):
        """Validates event data passed in"""
        if 'data' not in data:
            raise KeyError(
                "Error: Expected data dictionary contains key 'data'"
            )

    def parse_data(self, data):
        """Parses event data

        Args:
          data (dict): The value of the data key of the trigger event.

        Returns a dictionary with the following keys:
          project: The project the VM resided in.
          zone: The compute zone the VM resided in.
          instance: The name of the VM instance.
          type: The event type, e.g. GCE_API_CALL
          event_subtype: The event subtype, e.g. compute.instances.delete
          resource_type: The resource type, e.g. gce_instance
        """
        # Event metadata comes from Stackdriver as a JSON string
        event_json = base64.b64decode(data['data']).decode('utf-8')
        event = json.loads(event_json)

        struct = {
            'project': event['resource']['labels']['project_id'],
            'zone': event['resource']['labels']['zone'],
            'vm_name': event['labels'][
                'compute.googleapis.com/resource_name'
            ],
            'type': event['jsonPayload']['event_type'],
            'event_subtype': event['jsonPayload']['event_subtype'],
            'resource_type': event['resource']['type'],
        }

        return struct

    def validate_event_type(self, event_type: str, event_subtype: str,
                            resource_type: str):
        """Validates the event type is one which should be handled.

        Events must match the following filter to trigger the cleanup process:

                resource.type="gce_instance"
                jsonPayload.event_type="GCE_API_CALL"
                jsonPayload.event_subtype="compute.instances.delete"

        Returns (bool): True if the event should be handled.
        """
        if event_type == 'GCE_API_CALL':
            if event_subtype == 'compute.instances.delete':
                if resource_type == 'gce_instance':
                    return True
        return False


class DnsVmGcApp():
    """Holds state for the lifetime of a function

    Application controller holding state which persists across multiple trigger
    events.  Primarily configuration, network API clients, and logging API
    clients.
    """
    LOGNAME = 'dns-vm-gc'

    def __init__(self, http=None, session=None):
        """Initializes the app to handle multiple events

        Args:
            http: httplib2.Http, An instance of httplib2.Http or something that
                acts like it that HTTP requests will be made through.
            session: A requests.Session instance intended for mocking out the
                Stackdriver API when under test.
        """
        # Log clients
        self.log = self.setup_python_logging()
        self.cloud_log = self.setup_cloud_logging(session=session)
        # API clients
        self.compute = discovery.build('compute', 'v1', http=http)
        self.dns = discovery.build('dns', 'v1', http=http)

    def setup_python_logging(self):
        """Configures Python logging system

        Python logs are sent to STDOUT and STDERR by default.  In GCF, these
        logs are associated on execution_id.
        """
        if os.getenv('DEBUG'):
            level = logging.DEBUG
        else:
            level = logging.INFO
        # Make googleapiclient less noisy.
        # See https://github.com/googleapis/google-api-python-client/issues/299
        api_logger = logging.getLogger('googleapiclient')
        api_logger.setLevel(logging.ERROR)
        # Set level of our logger.
        log = logging.getLogger(self.LOGNAME)
        log.setLevel(level)
        return log

    def setup_cloud_logging(self, session=None):
        """Configures Structured Logging for results reporting

        Structured logs are used to report the results of execution.  This is
        different from Python logging used to report step by step progress of a
        single execution.

        Args:
            session: A requests.Session instance intended for mocking out the
                Stackdriver API when under test.
        """
        if session:
            client = google.cloud.logging.Client(
                _http=session,
                _use_grpc=False
            )
        else:
            client = google.cloud.logging.Client()
        logger = client.logger(self.LOGNAME)
        return logger

    def handle_event(self, data, context=None):
        """Background Cloud Function to delete DNS A records when VM is deleted.

        Args:
            data (dict): The dictionary with data specific to this type of
                event.
            context (google.cloud.functions.Context): The Cloud Functions event
                metadata.
        Returns:
            Number of records deleted across all managed zones.
        """
        handler = EventHandler(app=self, data=data, context=context)
        result = handler.run()
        return result


def main(data, context=None, http=None, session=None):
    if RuntimeState.app is None:
        RuntimeState.app = DnsVmGcApp(http=http, session=session)
    result = RuntimeState.app.handle_event(data, context)
    return result


def dns_vm_gc(data, context=None):
    main(data, context)
