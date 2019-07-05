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

class BaseExporter(object):
    """Convert Admin SDK logs to a compatible format and sends them to an export
    destination.

    Args:
        api (`googleapiclient.discovery.Resource`): The Admin SDK API to fetch
            records from.
        version (str): The Admin SDK API version.
        credentials_path (str, optional): The path to the GSuite Admin credentials.
    """

    def __init__(self,
                 project_id,
                 destination_name,
                 credentials_path=None):
        raise NotImplementedError()

    def send(self, records, *args, **kwargs):
        """Writes a list of Admin SDK records to the export destination.

        Args:
            records (list): A list of log records.
            kwargs (dict): Additional exporter options.

        Raises:
            `NotImplementedError`: Method is implemented in a derived class.
        """
        raise NotImplementedError()

    def convert(self, records):
        """Convert a bunch of Admin API records to the destination format.

        Args:
            records (list): A list of Admin API records.

        Raises:
            `NotImplementedError`: Method is implemented in a derived class.
        """
        raise NotImplementedError()

    @property
    def last_timestamp(self):
        """Last timestamp synced.

        Raises:
            `NotImplementedError`: Method is implemented in a derived class.
        """
        raise NotImplementedError()
