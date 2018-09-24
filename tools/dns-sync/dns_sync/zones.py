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

import json
import threading
import uuid

from google.cloud import datastore
import webapp2

from dns_sync import api
from dns_sync.auth import AdminRequestHandler
from dns_sync.config import get_project_id


class RegistryCachedPropertyBaseClass(object):
    """A property cached in a dictionary returned by the "registry" method.

    The registry method is implemented in base classes.
    """

    _DEFAULT_VALUE = object()

    def registry(self):
        """implemented by subclasses."""
        pass

    def __init__(self, func, name=None, doc=None):
        self.__name__ = name or func.__name__
        self.__module__ = func.__module__
        self.__doc__ = doc or func.__doc__
        self.func = func
        self.lock = threading.RLock()

    def __get__(self, obj, _):
        if obj is None:
            return self
        with self.lock:
            cache = self.registry().get(obj)
            if cache is None:
                cache = dict()
                self.registry()[obj] = cache
            value = cache.get(self.__name__, self._DEFAULT_VALUE)
            if value is self._DEFAULT_VALUE:
                value = self.func(obj)
                cache[self.__name__] = value
            return value


class AppCachedProperty(RegistryCachedPropertyBaseClass):
    """Caches property value in global memory (application cache)."""

    GLOBAL_CACHE = {}

    def registry(self):
        """Return the application registry, or a global cache."""
        if webapp2.get_app().registry:
            return webapp2.get_app().registry
        else:
            return AppCachedProperty.GLOBAL_CACHE


class RequestCachedProperty(RegistryCachedPropertyBaseClass):
    """Cache a property value in request registry."""

    def registry(self):
        """Return request registry."""
        try:
            return webapp2.get_request().registry
        except AssertionError:
            return {}


class ZoneConfigEntity(datastore.Entity):
    """Configuration settings for the application.

    Stored in datastore.
    """

    KEY = api.CLIENTS.datastore.key('ZoneConfigEntity', 'config_entity')

    @classmethod
    def get_entity(cls):
        """Returns the one config entity, get or create it."""
        config_entity = api.CLIENTS.datastore.get(ZoneConfigEntity.KEY)
        if config_entity is None:
            config_entity = ZoneConfigEntity(None)
            config_entity.put()
        else:
            config_entity = ZoneConfigEntity(config_entity)
        return config_entity

    def __init__(self, entity):
        """Construct from an entity, call get_entity instead."""
        if entity:
            super(ZoneConfigEntity, self).__init__(
                entity.key, list(entity.exclude_from_indexes))
            self.update(entity)
            mapping = self['regular_expression_zone_mapping']
            if isinstance(mapping, basestring):
                self['regular_expression_zone_mapping'] = json.loads(mapping)
        else:
            super(ZoneConfigEntity, self).__init__(ZoneConfigEntity.KEY, [
                'regular_expression_zone_mapping', 'default_zone',
                'dns_project', 'pubsub_shared_secret', 'subscription_endpoint'
            ])
            self.update({
                'regular_expression_zone_mapping': None,
                'dns_project': None,
                'default_zone': None,
                'pubsub_shared_secret': str(uuid.uuid4()),
                'subscription_endpoint': None
            })

    def put(self):
        """Store in datastore."""
        # Must first change list of lists property into something Datastore can
        # accept (a json string).
        mapping = self['regular_expression_zone_mapping']
        if type(mapping) == list:
            self['regular_expression_zone_mapping'] = json.dumps(mapping)
        try:
            api.CLIENTS.datastore.put(self)
        finally:
            self['regular_expression_zone_mapping'] = mapping

    @property
    def managed_zone_project(self):
        """Returns either the DNS project, or the current project."""
        return (self.get('dns_project', None) or get_project_id())


class ZoneConfig(object):
    """Application DNS Zone configuration."""

    @RequestCachedProperty
    def config(self):
        """Return the configuration from the datastore.

        Will be cached in the current request registry.
        """
        return ZoneConfigEntity.get_entity()

    @RequestCachedProperty
    def regular_expression_zone_mapping(self):
        """Mapping from regular expression to DNS Cloud Zone."""
        if self.config['regular_expression_zone_mapping']:
            return json.loads(self.config['regular_expression_zone_mapping'])
        else:
            return []

    @RequestCachedProperty
    def default_zone(self):
        """Return the Cloud DNS default zone."""
        return self.config['default_zone']

    @RequestCachedProperty
    def pubsub_shared_secret(self):
        """Return pub/sub shared secret."""
        return self.config['pubsub_shared_secret']

    @RequestCachedProperty
    def managed_zone_project(self):
        """Return project owning all Cloud DNS zones."""
        return self.config.get('dns_project', None) or get_project_id()

    @AppCachedProperty
    def managed_zone_dns_name_cache(self):
        """cache used to store Cloud DNS zone name to DNS name mapping."""
        return dict()

    def get_zone_dns_name(self, managed_zone_name):
        """"Get dns name of the manged zone.

        Requires an API call to look it up. Cache in instance memory.
        """
        if managed_zone_name in self.managed_zone_dns_name_cache:
            return self.managed_zone_dns_name_cache[managed_zone_name]

        managed_zone = api.CLIENTS.dns.managedZones().get(
            managedZone=managed_zone_name,
            project = self.config.managed_zone_project).execute()
        dns_name = managed_zone['dnsName']
        self.managed_zone_dns_name_cache[managed_zone_name] = dns_name
        return dns_name


class GetZoneConfig(AdminRequestHandler):
    """Return json describing current configuration."""

    def get(self):
        config_entity = ZoneConfigEntity.get_entity()
        self.response.content_type = 'application/json'
        self.response.write(json.dumps(config_entity))


class GetProjects(AdminRequestHandler):
    """ Return list of projects application has access to."""

    def get(self):
        projects = [project.project_id for project in
                    api.CLIENTS.crm.list_projects()]
        projects = sorted(projects)
        self.response.content_type = 'application/json'
        self.response.write(json.dumps(projects))


class GetProjectZones(AdminRequestHandler):
    """Returns list of Cloud DNS zones for the input project."""

    def post(self):
        project = self.request.body

        def zone_pager(page_token):
            return api.CLIENTS.dns.managedZones().list(
                project=project,
                pageToken=page_token)

        zones = [zone['name'] for zone in api.resource_iterator(zone_pager)]
        self.response.content_type = 'application/json'
        self.response.write(json.dumps(zones))


class SetZoneConfig(AdminRequestHandler):
    """Save new configuration values input from the request."""

    def post(self):
        new_config = json.loads(self.request.body)
        old_config = ZoneConfigEntity.get_entity()
        old_config.update(new_config)
        old_config.put()
        self.response.content_type = 'application/json'
        self.response.write(json.dumps(new_config))


CONFIG = ZoneConfig()
