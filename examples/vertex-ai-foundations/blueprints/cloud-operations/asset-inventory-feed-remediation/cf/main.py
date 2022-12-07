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

'''Cloud Function module to do simple instance tag enforcement.

This module is designed to be plugged in a Cloud Function, attached to a PubSub
trigger that receives Cloud Inventory Asset updates on the instance type. Its
purpose is to do live checking, validation and remediation of instance tags.

Tags are validated using two simple rules: global allowed tags must match the
fixed prefixes in the `_TAG_SHARED_PREFIXES` constant, while project local
tags must be prefixed with the project id.

Quickstart to create the feed and deploy the function, assuming
all other prerequisites are in place:

gcloud pubsub topics create asset-feed-instance \
  --project $PROJECT
gcloud asset feeds create instance-resource \
  --pubsub-topic projects/$PROJECT/topics/asset-feed-instance \
  --asset-types compute.googleapis.com/Instance \
  --content-type resource --project $PROJECT
gcloud functions deploy test-feed
  --region europe-west1 --allow-unauthenticated
  --entry-point main --runtime python38
  --trigger-topic asset-feed-instance --project $PROJECT
'''

import base64
import binascii
import json
import logging
import re
import sys
import time

from googleapiclient import discovery
from googleapiclient.errors import HttpError


_SELF_LINK_RE = re.compile(
    r'/projects/([^/]+)/zones/([^/]+)/instances/([^/]+)')
_TAG_SHARED_PREFIXES = ['shared-', 'gke-cluster-']


class Error(Exception):
  pass


def _set_tags(project, zone, name, fingerprint, tags):
  'Set specific tags on instance.'
  body = {'fingerprint': fingerprint, 'items': tags}
  compute = discovery.build('compute', 'v1', cache_discovery=False)
  try:
    result = compute.instances().setTags(project=project, zone=zone,
                                         instance=name, body=body).execute()
    while True:
      if 'error' in result:
        raise SystemExit(result['error'])
      if result['status'] == 'DONE':
        break
      time.sleep(1)
      result = compute.zoneOperations().get(
          project=project,
          zone=zone,
          operation=result['name']).execute()
  except HttpError as e:
    raise Error('Error setting tags: %s' % e)


def _parse_asset(data):
  'Extract instance attributes from asset feed data.'
  try:
    asset_type = data['asset']['assetType']
    if asset_type != 'compute.googleapis.com/Instance':
      raise Error('ignoring sset type %s' % asset_type)
    instance = data['asset']['resource']['data']
  except KeyError:
    raise Error('missing asset data')
  # ensure we have at least status and selfLink
  for k in ('status', 'selfLink'):
    if k not in instance:
      raise Error('no %s attribute in instance data' % k)
  return instance


def _parse_event(event):
  'Check PubSub event and return asset feed data.'
  if not event or 'data' not in event:
    raise Error('no event received, or no data in event')
  logging.info('parsing event data')
  try:
    data = base64.b64decode(event['data'])
    return json.loads(data)
  except binascii.Error as e:
    logging.info('received event: %s' % event)
    raise Error('cannot decode event data: %s' % e)
  except json.JSONDecodeError as e:
    logging.info('received data: %s', data)
    raise Error('event data not in JSON format: %s' % e)


def _parse_self_link(self_link):
  'Parse instance self link and return project, zone, and instance name.'
  m = _SELF_LINK_RE.search(self_link)
  if not m:
    raise Error('invalid self link %s' % self_link)
  return m.groups()


def _validate_tags(project, tags):
  'Validate a set of tags and return valid tags in the set.'
  _tags = []
  for tag in tags:
    shared_valid = any(tag.startswith(p) for p in _TAG_SHARED_PREFIXES)
    if shared_valid or tag.startswith(project):
      _tags.append(tag)
  return _tags


def main(event=None, context=None):
  'Cloud Function entry point.'
  logging.basicConfig(level=logging.INFO)
  try:
    data = _parse_event(event)
    instance = _parse_asset(data)
    project, zone, name = _parse_self_link(instance['selfLink'])
  except Error as e:
    logging.critical(e.args[0])
    return
  logging.info('checking %s', instance['selfLink'])
  if instance['status'] not in ('RUNNING', 'TERMINATED'):
    logging.info('ignoring status %s', instance['status'])
    return
  tags = instance.get('tags', {})
  logging.info('tags %s', tags.get('items'))
  if not tags or not tags.get('items'):
    return
  valid_tags = _validate_tags(project, tags['items'])
  if tags['items'] == valid_tags:
    logging.info('all tags are valid')
    return
  logging.info('modify tags %s %s %s %s %s', project,
               zone, name, tags['fingerprint'], valid_tags)
  try:
    _set_tags(project, zone, name, tags.get('fingerprint'), valid_tags)
  except Error as e:
    logging.critical(e.args[0])
