#!/usr/bin/env python3

# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

'''Prepare OCP installation files for UPI installation on GCP.

This module helps generating installation files for OpenShift on GCP with User
Provided Infrastructure, leveraging variables set in the accompanying Terraform
files, that create the infrastructure for a cluster.

It helps supporting features like Shared VPC, CMEK encryption for disks, etc.
'''

import glob
import logging
import os
import pathlib
import re
import subprocess
import sys

import click
import hcl

from ruamel import yaml


__author__ = 'ludomagno@google.com'
__version__ = '1.0'


class Error(Exception):
  pass


def _parse_tfvars(tfvars=None, tfdir=None):
  'Parse vars and tfvars files and return variables.'
  logging.info('parsing tf variables')
  result = {}
  try:
    with open(os.path.join(tfdir, 'variables.tf')) as f:
      result = {k: v.get('default')
                for k, v in hcl.load(f)['variable'].items()}
    if tfvars:
      with open(os.path.join(tfdir, tfvars)) as f:
        result.update(hcl.load(f))
    else:
      logging.info('no tfvars file used')
  except (KeyError, ValueError) as e:
    raise Error(f'Wrong variable files syntax: {e}')
  except (IOError, OSError) as e:
    raise Error(f'Cannot open variable files: {e}')
  for k, v in result.items():
    if k == 'post_bootstrap_config':
      continue
    if v is None:
      raise Error(f'Terraform variable {k} not set.')
  return result


def _check_convert_paths(**paths):
  'Return dictionary of path objects, check they point to existing resources.'
  logging.info('checking paths')
  result = {}
  for k, v in paths.items():
    p = pathlib.Path(v).expanduser()
    if not p.exists():
      raise Error(f'Missing file/dir \'{p}\'.')
    result[k] = p
  return result


def _run_installer(cmdline, env=None):
  'Run command and catch errors.'
  logging.info(f'running command {" ".join(cmdline)}')
  try:
    p = subprocess.Popen(cmdline, stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE, env=env or {})
  except subprocess.CalledProcessError as e:
    raise Error(f'Error running command: {e.output}')
  out, err = p.communicate()
  out = out.decode('utf-8', errors='ignore')
  err = err.decode('utf-8', errors='ignore')
  retcode = p.returncode
  if retcode > 0:
    raise Error(f'Error in openshift-installer ({retcode}): {err}')


@click.group(invoke_without_command=True,
             help=f'{__doc__}\nWith no command, run through all stages.')
@click.option('--tfdir', type=click.Path(exists=True), default='./tf',
              help='Terraform folder.')
@click.option('--tfvars',
              help='Terraform vars file, relative to Terraform folder.')
@click.option('-v', '--verbosity', default='INFO',
              type=click.Choice(
                  ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']),
              help='Verbosity level (logging constant).')
@click.pass_context
def cli(ctx=None, credentials=None, tfdir=None, tfvars=None, verbosity='INFO'):
  'Program entry point.'
  logging.basicConfig(level=getattr(logging, verbosity))
  logging.info('program starting')
  ctx.ensure_object(dict)
  try:
    tfvars_ = _parse_tfvars(tfvars, tfdir)
    ctx.obj['tfvars'] = tfvars_
    ctx.obj['paths'] = _check_convert_paths(**tfvars_['fs_paths'])
  except Error as e:
    print(f'Error: {e.args[0]}')
    sys.exit(1)
  if ctx.invoked_subcommand is None:
    commands = ['install-config', 'manifests',
                'manifests-edit', 'ignition-configs']
  else:
    commands = [ctx.invoked_subcommand]
  try:
    for c in commands:
      ctx.invoke(ctx.command.commands[c])
  except Error as e:
    print(e)
    sys.exit(1)
  sys.exit(0)


@cli.command(help='Generate ignition files from manifests.')
@click.pass_context
def ignition_configs(ctx=None):
  'Create ignition config files from manifests.'
  logging.info('generating ignition config files')
  cmdline = [
      str(ctx.obj['paths']['openshift_install']),
      'create', 'ignition-configs',
      '--dir', str(ctx.obj['paths']['config_dir'])
  ]
  env = {'GOOGLE_APPLICATION_CREDENTIALS': ctx.obj['paths']['credentials']}
  _run_installer(cmdline, env)


@cli.command(help='Generate install config from tfvars file.')
@click.pass_context
def install_config(ctx=None):
  'Create install config from terraform variables.'
  logging.info('generating install config')
  y = yaml.YAML()
  try:
    with open('install-config.tpl.yml') as f:
      data = y.load(f)
  except (IOError, OSError) as e:
    raise Error(f'Cannot open install-config template: {e}')
  except yaml.YAMLError as e:
    raise Error(f'Parsing error in install-config template: {e}')
  vars = ctx.obj['tfvars']
  paths = ctx.obj['paths']
  vars_key = vars['disk_encryption_key']
  vars_net = vars['install_config_params']['network']
  vars_proxy = vars['install_config_params']['proxy']
  data_disk = data['compute'][0]['platform']['gcp']['osDisk']
  data['baseDomain'] = vars['domain']
  data['metadata']['name'] = vars['cluster_name']
  data['platform']['gcp']['projectID'] = vars['service_project']['project_id']
  data['platform']['gcp']['region'] = vars['region']
  data_disk['diskSizeGB'] = int(vars['install_config_params']['disk_size'])
  if vars_key and vars_key != 'null':
    data_disk.insert(len(data_disk), 'encryptionKey', {'kmsKey': {
        'projectID': vars_key['project_id'],
        'keyRing': vars_key['keyring'],
        'location': vars_key['location'],
        'name': vars_key['name']
    }})
  data['networking']['clusterNetwork'][0]['cidr'] = vars_net['cluster']
  data['networking']['clusterNetwork'][0]['hostPrefix'] = vars_net['host_prefix']
  data['networking']['machineNetwork'][0]['cidr'] = vars_net['machine']
  data['networking']['serviceNetwork'][0] = vars_net['service']
  if vars_proxy and vars_proxy != 'null':
    noproxy = [t.strip()
               for t in vars_proxy['noproxy'].split(',') if t.strip()]
    noproxy += [f'.{vars["domain"]}', vars_net['machine']]
    noproxy += vars['allowed_ranges']
    data.insert(len(data), 'proxy', {
        'httpProxy': vars_proxy['http'],
        'httpsProxy': vars_proxy['https'],
        'noProxy': ','.join(noproxy)
    })
  for k, v in dict(pull_secret='pullSecret', ssh_key='sshKey').items():
    if k not in paths:
      raise Error(f'Key \'{k}\' missing from fs_paths in Terraform variables.')
    try:
      with paths[k].open() as f:
        data[v] = f.read().strip()
    except (IOError, OSError) as e:
      raise Error(f'Cannot read file: {e}')
  try:
    with (paths['config_dir'] / 'install-config.yaml').open('w') as f:
      y.dump(data, f)
  except (IOError, OSError) as e:
    raise Error(f'Cannot write install config: {e}')
  except yaml.YAMLError as e:
    raise Error(f'Error dumping install-config template: {e}')


@cli.command(help='Generate manifests from install config.')
@click.pass_context
def manifests(ctx=None):
  'Create manifests from install config.'
  logging.info('generating manifests')
  cmdline = [
      str(ctx.obj['paths']['openshift_install']),
      'create', 'manifests',
      '--dir', str(ctx.obj['paths']['config_dir'])
  ]
  env = {'GOOGLE_APPLICATION_CREDENTIALS': ctx.obj['paths']['credentials']}
  _run_installer(cmdline, env)


@cli.command(help='Edit manifests.')
@click.pass_context
def manifests_edit(ctx=None):
  'Edit generated manifests.'
  logging.info('edit manifests')
  dir_ = ctx.obj['paths']['config_dir'] / 'openshift'
  for fileobj in dir_.glob('99_openshift-cluster-api_master-machines-*.yaml'):
    logging.info(f'removing {fileobj.name}')
    fileobj.unlink()
  tfvars = ctx.obj['tfvars']
  for fileobj in dir_.glob('99_openshift-cluster-api_worker-machineset-*.yaml'):
    logging.info(f'editing {fileobj.name}')
    y = yaml.YAML()
    try:
      with fileobj.open() as f:
        data = y.load(f)
      data_v = data['spec']['template']['spec']['providerSpec']['value']
      data_v['region'] = tfvars['region']
      data_v['projectID'] = tfvars['service_project']['project_id']
      if not 'ocp-worker' in data_v['tags']:
        data_v['tags'].append('ocp-worker')
      if tfvars['install_config_params']['labels']:
        data_v['labels'] = tfvars['install_config_params']['labels'].copy()
        for i, d in enumerate(data_v['disks']):
          d['labels'] = tfvars['install_config_params']['labels'].copy()
      data_n = data_v['networkInterfaces'][0]
      data_n['network'] = tfvars['host_project']['vpc_name']
      data_n['subnetwork'] = tfvars['host_project']['workers_subnet_name']
      data_n.insert(len(data_n), 'projectID',
                    tfvars['host_project']['project_id'])
      with fileobj.open('w') as f:
        y.dump(data, f)
    except (IOError, OSError, yaml.YAMLError) as e:
      raise Error(f'error editing file {fileobj}: {e}')
  dir_ = ctx.obj['paths']['config_dir'] / 'manifests'
  fileobj = dir_ / 'cloud-provider-config.yaml'
  vars_h = tfvars["host_project"]
  logging.info(f'editing {fileobj.name}')
  try:
    with fileobj.open() as f:
      data = y.load(f)
      config = [
          l for l in data['data']['config'].strip().split('\n')
          if 'network-' not in l.rpartition('=')[0]
      ]
      config += [
          f'network-project-id = {vars_h["project_id"]}',
          f'network-name = {vars_h["vpc_name"]}',
          f'subnetwork-name = {vars_h["default_subnet_name"]}',
      ]
      data['data']['config'] = '\n'.join(config)
      with fileobj.open('w') as f:
        y.dump(data, f)
  except (IOError, OSError, yaml.YAMLError) as e:
    raise Error(f'error editing file {fileobj}: {e}')
  fileobj = dir_ / 'cluster-scheduler-02-config.yml'
  logging.info(f'editing {fileobj.name}')
  try:
    with fileobj.open() as f:
      data = y.load(f)
      data['spec']['mastersSchedulable'] = False
      with fileobj.open('w') as f:
        y.dump(data, f)
  except (IOError, OSError, yaml.YAMLError) as e:
    raise Error(f'error editing file {fileobj}: {e}')


if __name__ == '__main__':
  cli()
