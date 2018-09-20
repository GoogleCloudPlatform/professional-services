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
import math
import dateutil.parser
import logging
from gsuite_exporter import auth
from gsuite_exporter.exporters.base import BaseExporter

logger = logging.getLogger(__name__)

class StackdriverExporter(BaseExporter):
    """Convert Admin SDK logs to logging entries and sends them to Stackdriver
    Logging API.

    Args:
        api (`googleapiclient.discovery.Resource`): The Admin SDK API to fetch
            records from.
        version (str): The Admin SDK API version.
        credentials_path (str): The path to the GSuite Admin credentials.
        scopes (list): A list of scopes to grant the API requests.
    """
    SCOPES = [
        'https://www.googleapis.com/auth/logging.read',
        'https://www.googleapis.com/auth/logging.write'
    ]
    LOGGING_API_VERSION = 'v2'
    def __init__(self,
                 project_id,
                 destination_name,
                 credentials_path=None):
        logger.info("Initializing Stackdriver Logging API ...")
        self.api = auth.build_service(
            api='logging',
            version=StackdriverExporter.LOGGING_API_VERSION,
            credentials_path=credentials_path,
            scopes=StackdriverExporter.SCOPES)
        self.project_id = "projects/{}".format(project_id)
        self.log_name = "{}/logs/{}".format(self.project_id, destination_name)

    def send(self, records, dry=False):
        """Writes a list of Admin SDK records to Stackdriver Logging API.

        Args:
            records (list): A list of log records.
            dry (bool): Toggle dry-run mode (default: False).

        Returns:
            `googleapiclient.http.HttpRequest`: The API response object.
        """
        entries = self.convert(records)
        body = {
            'entries': entries,
            'logName': '{}'.format(self.log_name),
            'dryRun': dry
        }
        logger.info("Writing {} entries to Stackdriver Logging API @ '{}'".format(
            len(entries),
            self.log_name))
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
        return map(lambda i: self.__convert(i), records)

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
                'report_timestamp': self.__convert_timestamp(record)
            },
            'resource': { 'type': 'global' }
        }

    def __convert_timestamp(self, record):
        """Converts timestamp for an Admin API record into a time dict.

        Args:
            record (dict): An Admin API record.

        Returns:
            dict: A dict with a key 'seconds' containing the record timestamp.
        """
        (remainder, seconds) = math.modf(time.mktime(
            dateutil.parser.parse(record['id']['time']).timetuple()
        ))
        return {'seconds': int(seconds)}

    @property
    def last_timestamp(self):
        """Last log timestamp from Stackdriver Logging API given our project id
        and log name.
        """
        query = {
          'orderBy': 'timestamp desc',
          'pageSize': 1,
          'resourceNames': [self.project_id],
          'filter': 'logName={}'.format(self.log_name)
        }
        log = self.api.entries().list(body=query).execute()
        timestamp = log['entries'][0]['timestamp'] if 'entries' in log else None
        logger.info("Last log timestamp for '{}' --> {}".format(
            self.log_name,
            timestamp))
        return timestamp
