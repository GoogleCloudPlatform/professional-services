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

import logging
import os
import yaml

from google.cloud import datastore
from googleapiclient import http


class LoggingHttpMockSequence(http.HttpMockSequence):
    """Log the mock request and responses for debugging purposes."""

    def __init__(self, iterable):
        """Construct from a list of request response pairs.

        Args:
            iterable: iterable, a sequence of pairs of (headers, body)
        """
        super(LoggingHttpMockSequence, self).__init__(iterable)
        self.requests = []

    def request(self,
                uri,
                method='GET',
                body=None,
                headers=None,
                redirections=1,
                connection_type=None):
        """Override to log request and response."""

        self.requests.append((uri, method, body, headers))
        logging.debug('mock request: request(%s, %s, %s, %s, %s, %s)', method,
                      uri, body, headers, redirections, connection_type)
        response, content = super(LoggingHttpMockSequence, self).request(
            uri, method, body, headers, redirections, connection_type)
        logging.debug('mock response %s, %s', response, content[:200])

        return response, content


def read_data_files(files):
    """Read in all files and provide a map of the results keyed by filename."""
    read_files = dict()
    for f in files:
        with open(f, 'rb') as of:
            read_files[os.path.basename(f)] = of.read()
    return read_files


def config_entity():
    config = None
    with open('tests/data/config-default-zone.yaml') as f:
        config = yaml.load(f.read())
        entity = datastore.Entity()
        entity.update(config)
    return entity
