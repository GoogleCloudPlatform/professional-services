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
import threading

from google.cloud import datastore
from google.cloud import resource_manager
from googleapiclient import discovery
from googleapiclient import errors
import httplib2
from oauth2client import client
import webapp2


def resource_iterator(next_page_function):
    """Loop through resources from a Google API.

    An iterator that returns all of the resources from a Google API 'list'
    operation paging through each set.

    Args:
        next_page_function: A function that when called will return the next
        page of results.

    Yields:
        A list if resources, which are typically dictionaries.
    """
    next_page_token = None
    more_results = True
    while more_results:
        resource_response = None
        try:
            resource_response = next_page_function(next_page_token).execute()
        except errors.HttpError:
            # Some projects throw a 403. (compute engine isn't enabled)
            # just ignore those resources.
            logging.debug('skipping resources.', exc_info=True)
            return

        for items_field in ['items', 'rrsets', 'managedZones']:
            items = resource_response.get(items_field, {})
            if items and (type(items) == dict):
                for item in items.iteritems():
                    yield item
            if items and (type(items) == list):
                for item in items:
                    yield item
        if 'nextPageToken' in resource_response:
            next_page_token = resource_response['nextPageToken']
        else:
            more_results = False


class ThreadsafeClientLocal(object):
    """A thread local Google API client descriptor.

    Httplib2 is not threadsafe so each request thread requires it's own
    threadlocal client object which this creates.

    Attributes:
        service: String name of the API to create the client for.
        version: String version of the API client.
    """

    _class_thread_local = threading.local()

    def __init__(self, service, version):
        """Create a thread local API client.

        Will create the underlying httplib2.Http object on construction, but
        the underlying API client is lazy constructed.

        Args:
            service: Name of API.
            version: Version of the api.
        """
        self.service = service
        self.version = version
        self.http = httplib2.Http(timeout=60)
        self.cache_discovery = True

    def __get__(self, instance, instance_type):
        """Construct the API client."""
        if instance is None:
            return self

        thread_local = None
        try:
            app = webapp2.get_app()
            # Python Google API clients aren't threadsafe as they use httplib2
            # which isn't threadsafe.
            thread_local = app.registry.get(self)
            if thread_local is None:
                thread_local = threading.local()
                app.registry[self] = thread_local
        except AssertionError:
            # When not in a request context, use class thread local.
            thread_local = ThreadsafeClientLocal._class_thread_local

        cached_client = getattr(thread_local, 'api', None)
        if cached_client is None:
            credentials = client.GoogleCredentials.get_application_default()
            if credentials.create_scoped_required():
                credentials = credentials.create_scoped(
                    'https://www.googleapis.com/auth/cloud-platform')
            cached_client = discovery.build(
                self.service,
                self.version,
                http=credentials.authorize(self.http),
                cache_discovery=self.cache_discovery)
            thread_local.api = cached_client
        return cached_client


class Clients(object):
    """Holds API clients.

    For Google API clients, we use thread local descriptors which creates the
    client on first access. The "google.cloud" clients are threadsafe and are
    simple properties.
    """
    metrics = ThreadsafeClientLocal('monitoring', 'v3')
    compute = ThreadsafeClientLocal('compute', 'v1')
    dns = ThreadsafeClientLocal('dns', 'v1')
    iam = ThreadsafeClientLocal('cloudresourcemanager', 'v1')

    def __init__(self):
        self.datastore = datastore.Client()
        self.crm = resource_manager.Client()


CLIENTS = Clients()
