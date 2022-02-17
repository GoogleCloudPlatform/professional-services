#!/usr/bin/env python
# Copyright 2021 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License..
"""
This file is used to create instance from a machine image.
"""

import re
from .exceptions import InvalidFormatException


class Project:

    def __init__(self, project: str):
        self._project = project

    def __str__(self):
        return self.uri

    @property
    def uri(self):
        return 'projects/{}'.format(self.project)

    @property
    def abs_beta_uri(self):
        return 'https://www.googleapis.com/compute/beta/{}'.format(self.uri)

    @property
    def project(self):
        return self._project


class ProjectRegion(Project):

    def __init__(self, project: str, region: str):
        self._region = region

        super().__init__(project)

    @property
    def uri(self):
        return 'projects/{}/regions/{}'.format(self.project, self.region)

    @property
    def region(self):
        return self._region


class ProjectZone(ProjectRegion):

    def __init__(self, project: str, zone: str):

        match = re.search(r'^(\w+)-(\w+)-(\w+)$', zone)

        if not match or len(match.groups()) != 3:
            raise InvalidFormatException('Invalid zone format {}'.format(zone))

        self._zone = zone

        super().__init__(project, match.group(1) + '-' + match.group(2))

    @property
    def zone(self):
        return self._zone

    @property
    def uri(self):
        return 'projects/{}/zones/{}'.format(self.project, self.zone)


class Instance(ProjectZone):

    @classmethod
    def from_uri(cls, uri):

        if not uri:
            return None

        match = \
            re.search(
                r'(?:\/|^)projects\/(.*?)\/zones\/(.*?)\/instances\/(.*?)$',
                uri)

        if not match or len(match.groups()) != 3:
            raise InvalidFormatException(
                'Invalid instance URI format {}'.format(uri))

        return cls(match.group(1), match.group(2), match.group(3))

    def __init__(self, project: str, zone: str, name: str):
        self._name = name
        super().__init__(project, zone)

    @property
    def name(self):
        return self._name

    @property
    def uri(self):
        return 'projects/{}/zones/{}/instances/{}'.format(self.project,
                                                          self.zone,
                                                          self.name)


class Subnet(ProjectRegion):

    @classmethod
    def from_uri(cls, uri):

        if not uri:
            return None

        match = \
            re.search(
                r'(?:\/|^)projects\/(.*?)\/regions'
                r'\/(.*?)\/subnetworks\/(.*?)$',
                uri)

        if not match or len(match.groups()) != 3:
            raise InvalidFormatException(
                'Invalid subnet URI format {}'.format(uri))

        return cls(match.group(1), match.group(2), match.group(3))

    def __init__(self, project: str, region: str, name: str):
        self._name = name
        super().__init__(project, region)

    @property
    def name(self):
        return self._name

    @property
    def uri(self):
        return 'projects/{}/regions/{}/subnetworks/{}'.format(self.project,
                                                              self.region,
                                                              self.name)


class Disk(ProjectZone):

    @classmethod
    def from_uri(cls, uri):

        if not uri:
            return None

        match = \
            re.search(
                r'(?:\/|^)projects\/(.*?)\/zones\/(.*?)\/disks\/(.*?)$',
                uri)

        if not match or len(match.groups()) != 3:
            raise InvalidFormatException(
                'Invalid disk URI format {}'.format(uri))

        return cls(match.group(1), match.group(2), match.group(3))

    def __init__(self, project: str, zone: str, name: str):
        self._name = name
        super().__init__(project, zone)

    @property
    def name(self):
        return self._name

    @property
    def uri(self):
        return 'projects/{}/zones/{}/disks/{}'.format(self.project,
                                                      self.zone,
                                                      self.name)


class MachineType(ProjectZone):

    @classmethod
    def from_uri(cls, uri):

        if not uri:
            return None

        match = \
            re.search(
                r'(?:\/|^)projects\/(.*?)\/zones\/(.*?)\/machineTypes\/(.*?)$',
                uri)

        if not match or len(match.groups()) != 3:
            raise InvalidFormatException(
                'Invalid machine type URI format {}'.format(uri))

        return cls(match.group(1), match.group(2), match.group(3))

    def __init__(self, project: str, zone: str, machine_type: str):
        self._machine_type = machine_type
        super().__init__(project, zone)

    @property
    def machine_type(self):
        return self._machine_type

    @property
    def uri(self):
        return 'projects/{}/zones/{}/machineTypes/{}'.format(self.project,
                                                             self.zone,
                                                             self.machine_type)


class MachineImage(Project):

    @classmethod
    def from_uri(cls, uri):

        if not uri:
            return None

        match = \
            re.search(
                r'(?:\/|^)projects\/(.*?)\/global\/machineImages\/(.*?)$',
                uri)

        if not match or len(match.groups()) != 2:
            raise InvalidFormatException(
                'Invalid machine image URI format {}'.format(uri))

        return cls(match.group(1), match.group(2))

    def __init__(self, project: str, name: str):
        self._name = name

        super().__init__(project)

    @property
    def name(self):
        return self._name

    @property
    def uri(self):
        return 'projects/{}/global/machineImages/{}'.format(self.project,
                                                            self.name)
