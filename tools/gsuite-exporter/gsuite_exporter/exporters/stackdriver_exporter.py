# Copyright 2018 Google Inc.
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

import time
import logging
import math
import dateutil.parser
from gsuite_exporter import auth
from gsuite_exporter.exporters.base import BaseExporter

LOGGER = logging.getLogger(__name__)

class StackdriverExporter(BaseExporter):
    """Convert Admin SDK logs to logging entries and send them to Stackdriver
    Logging API.

    Args:
        api (`googleapiclient.discovery.Resource`): The Admin SDK API to fetch
            records from.
        version (str): The Admin SDK API version.
        credentials_path (str, optional): The path to the GSuite Admin credentials.
    """
    SCOPES = [
        'https://www.googleapis.com/auth/logging.read',
        'https://www.googleapis.com/auth/logging.write'
    ]
    LOGGING_API_VERSION = 'v2'
    def __init__(self,
                 project_id,
                 credentials_path=None):
        LOGGER.debug("Initializing Stackdriver Logging API ...")
        self.api = auth.build_service(
            api='logging',
            version=StackdriverExporter.LOGGING_API_VERSION,
            credentials_path=credentials_path,
            scopes=StackdriverExporter.SCOPES)
        self.project_id = "projects/{}".format(project_id)

    def send(self, records, log_name, dry=False):
        """Writes a list of Admin SDK records to Stackdriver Logging API.

        Args:
            records (list): A list of log records.
            log_name (str): The log name to write (e.g: 'logins').
            dry (bool): Toggle dry-run mode (default: False).

        Returns:
            `googleapiclient.http.HttpRequest`: The API response object.
        """
        res = None
        destination = self.get_destination(log_name)
        if records:
            entries = self.convert(records)
            body = {
                'entries': entries,
                'logName': '{}'.format(destination),
                'dryRun': dry
            }
            LOGGER.debug("Writing %s entries to Stackdriver Logging API @ '%s'",
                         len(entries),
                         destination)
            res = self.api.entries().write(body=body).execute()
        return res

    def convert(self, records):
        """Convert a bunch of Admin API records to Stackdriver Logging API
        entries.

        Args:
            records (list): A list of Admin API records.

        Returns:
            list: A list of Stackdriver Logging API entries.
        """
        return [self.__convert(i) for i in records]

    def get_destination(self, log_name):
        """Get log full resource name (with project id)"""
        return "{}/logs/{}".format(self.project_id, log_name)

    def get_last_timestamp(self, log_name):
        """Last log timestamp from Stackdriver Logging API given our project id
        and log name.
        """
        destination = self.get_destination(log_name)
        query = {
            'orderBy': 'timestamp desc',
            'pageSize': 1,
            'resourceNames': [self.project_id],
            'filter': 'logName={}'.format(destination)
        }
        log = self.api.entries().list(body=query).execute()
        try:
            timestamp = log['entries'][0]['timestamp']
        except (KeyError, IndexError):
            timestamp = None
        return timestamp

    def __convert(self, record):
        """Converts an Admin SDK log entry to a Stackdriver Log entry.

        Args:
            record (dict): The Admin SDK record as JSON.

        Returns:
            dict: The Stackdriver Logging entry as JSON.
        """
        return {
            'timestamp': {'seconds': int(time.time())},
            'insertId': record['etag'],
            'jsonPayload': {
                'requestMetadata': {'callerIp': record.get('ipAddress')},
                'authenticationInfo': {
                    'callerType': record['actor'].get('callerType'),
                    'principalEmail': record['actor'].get('email')
                },
                'methodName': record['events'][0]['name'],
                'parameters': record['events'][0].get('parameters'),
                'report_timestamp': self.get_time_dict(record)
            },
            'resource': {'type': 'global'}
        }

    @staticmethod
    def get_time_dict(record):
        """Converts timestamp for an Admin API record into a time dict.

        Args:
            record (dict): An Admin API record.

        Returns:
            dict: A dict with a key 'seconds' containing the record timestamp.
        """
        _, seconds = math.modf(time.mktime(
            dateutil.parser.parse(record['id']['time']).timetuple()
        ))
        return {'seconds': int(seconds)}
