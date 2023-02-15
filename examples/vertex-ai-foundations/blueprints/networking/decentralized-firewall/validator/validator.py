#!/usr/bin/env python3
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import glob
import ipaddress
import json
import sys

import click
import yaml
import yamale

from fnmatch import fnmatch
from types import SimpleNamespace
from yamale.validators import DefaultValidators, Validator


class Netmask(Validator):
  """ Custom netmask validator """
  tag = 'netmask'
  settings = {}
  mode = None
  _type = None

  def __init__(self, *args, **kwargs):
    self._type = kwargs.pop('type', 'source-or-dest')
    super().__init__(*args, **kwargs)

  def fail(self, value):
    dir_str = 'source or destination'
    mode_str = 'allowed'
    if self._type == 'source':
      dir_str = 'source'
    elif self._type == 'destination':
      dir_str = 'destination'
    if self.mode == 'approve':
      mode_str = 'automatically approved'
    return '\'%s\' is not an %s %s network.' % (value, mode_str, dir_str)

  def _is_valid(self, value):
    is_ok = False
    network = ipaddress.ip_network(value)
    if self._type == 'source' or self._type == 'source-or-dest':
      for ip_range in self.settings['allowedSourceRanges']:
        allowed_network = ipaddress.ip_network(ip_range['cidr'])
        if network.subnet_of(allowed_network):
          if self.mode != 'approve' or ip_range['approved']:
            is_ok = True
          break
    if self._type == 'destination' or self._type == 'source-or-dest':
      for ip_range in self.settings['allowedDestinationRanges']:
        allowed_network = ipaddress.ip_network(ip_range['cidr'])
        if network.subnet_of(allowed_network):
          if self.mode != 'approve' or ip_range['approved']:
            is_ok = True
          break

    return is_ok


class NetworkTag(Validator):
  """ Custom network tag validator """
  tag = 'networktag'
  settings = {}
  mode = None
  _type = None

  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)

  def fail(self, value):
    mode_str = 'allowed'
    if self.mode == 'approve':
      mode_str = 'automatically approved'
    return '\'%s\' is not an %s network tag.' % (value, mode_str)

  def _is_valid(self, value):
    is_ok = False
    for tag in self.settings['allowedNetworkTags']:
      if fnmatch(value, tag['tag']):
        if self.mode != 'approve' or tag['approved']:
          is_ok = True
          break
    return is_ok


class ServiceAccount(Validator):
  """ Custom service account validator """
  tag = 'serviceaccount'
  settings = {}
  mode = None
  _type = None

  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)

  def fail(self, value):
    mode_str = 'allowed'
    if self.mode == 'approve':
      mode_str = 'automatically approved'
    return '\'%s\' is not an %s service account.' % (value, mode_str)

  def _is_valid(self, value):
    is_ok = False
    for sa in self.settings['allowedServiceAccounts']:
      if fnmatch(value, sa['serviceAccount']):
        if self.mode != 'approve' or sa['approved']:
          is_ok = True
          break
    return is_ok


class NetworkPorts(Validator):
  """ Custom ports validator """
  tag = 'networkports'
  settings = {}
  mode = None
  _type = None
  allowed_port_map = []
  approved_port_map = []

  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)

    for port in self.settings['allowedPorts']:
      ports = self._process_port_definition(port['ports'])
      self.allowed_port_map.extend(ports)
      if port['approved']:
        self.approved_port_map.extend(ports)

  def _process_port_definition(self, port_definition):
    ports = []
    if not isinstance(port_definition, int) and '-' in port_definition:
      start, end = port_definition.split('-', 2)
      for port in range(int(start), int(end) + 1):
        ports.append(int(port))
    else:
      ports.append(int(port_definition))
    return ports

  def fail(self, value):
    mode_str = 'allowed'
    if self.mode == 'approve':
      mode_str = 'automatically approved'
    return '\'%s\' is not an %s IP port.' % (value, mode_str)

  def _is_valid(self, value):
    ports = self._process_port_definition(value)
    is_ok = True
    for port in ports:
      if self.mode == 'approve' and port not in self.approved_port_map:
        is_ok = False
        break
      elif port not in self.allowed_port_map:
        is_ok = False
        break

    return is_ok


class FirewallValidator:
  schema = None
  settings = None
  validators = None

  def __init__(self, settings, mode):
    self.settings = settings

    self.validators = DefaultValidators.copy()
    Netmask.settings = self.settings
    Netmask.mode = mode
    self.validators[Netmask.tag] = Netmask

    NetworkTag.settings = self.settings
    NetworkTag.mode = mode
    self.validators[NetworkTag.tag] = NetworkTag

    ServiceAccount.settings = self.settings
    ServiceAccount.mode = mode
    self.validators[ServiceAccount.tag] = ServiceAccount

    NetworkPorts.settings = self.settings
    NetworkPorts.mode = mode
    self.validators[NetworkPorts.tag] = NetworkPorts

  def set_schema_from_file(self, schema):
    self.schema = yamale.make_schema(path=schema, validators=self.validators)

  def set_schema_from_string(self, schema):
    self.schema = yamale.make_schema(
        content=schema, validators=self.validators)

  def validate_file(self, file):
    print('Validating %s...' % (file), file=sys.stderr)
    data = yamale.make_data(file)
    yamale.validate(self.schema, data)


@click.command()
@click.argument('files')
@click.option('--schema',
              default='/schemas/firewallSchema.yaml',
              help='YAML schema file')
@click.option('--settings',
              default='/schemas/firewallSchemaSettings.yaml',
              help='schema configuration file')
@click.option('--mode',
              default='validate',
              help='select mode (validate or approve)')
@click.option('--github',
              is_flag=True,
              default=False,
              help='output GitHub action compatible variables')
def main(**kwargs):
  args = SimpleNamespace(**kwargs)
  files = [args.files]
  if '*' in args.files:
    files = glob.glob(args.files, recursive=True)

  print('Arguments: %s' % (str(sys.argv)), file=sys.stderr)

  f = open(args.settings)
  settings = yaml.load(f, Loader=yaml.SafeLoader)

  firewall_validator = FirewallValidator(settings, args.mode)
  firewall_validator.set_schema_from_file(args.schema)
  output = {'ok': True, 'errors': {}}
  for file in files:
    try:
      firewall_validator.validate_file(file)
    except yamale.yamale_error.YamaleError as e:
      if file not in output['errors']:
        output['errors'][file] = []
      output['ok'] = False
      for result in e.results:
        for err in result.errors:
          output['errors'][file].append(err)

  if args.github:
    print('::set-output name=ok::%s' % ('true' if output['ok'] else 'false'))
    print('::set-output name=errors::%s' % (json.dumps(output['errors'])))
    print(json.dumps(output), file=sys.stderr)
  else:
    print(json.dumps(output))
  if not output['ok'] and not args.github:
    sys.exit(1)


if __name__ == '__main__':
  main()
