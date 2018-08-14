# Copyright 2018 Google Inc.
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
# limitations under the License.

import sys, os, json, time, hashlib
from itertools import chain, izip, imap
from iptools import IpRangeList
from googleapiclient import discovery
from googleapiclient.errors import HttpError
from oauth2client.client import GoogleCredentials
import google.auth
import google.oauth2.service_account

from pprint import pprint
DEFAULT_API_VERSION='v1'

# logging helpers
def log_entry_id(info):
     hash = hashlib.md5()
     for i in info: hash.update(i)
     return hash.hexdigest()

def log_write(entries, resource, id, dry=False):
    body=log_wrapper(entries, resource, id, dry)
    get_logger().entries().write(body=body).execute()

def log_print(entries, resource, id, dry=False):
    dump(log_wrapper(entries, resource, id, dry))

def log_wrapper(entries, resource, id, dry=False):
    return {
        'entries': entries,
        'logName': get_log_name(resource, id),
        'dryRun': dry
    }

def last_log_time(resource, id):
  log = last_log(resource, id)
  return log['entries'][0]['timestamp'] if 'entries' in log\
    else None

def last_log(resource, id):
  query = {
      'orderBy': 'timestamp desc',
      'pageSize': 1,
      'resourceNames': [resource],
      'filter': 'logName={}'.format(get_log_name(resource, id))
  }
  return get_logger().entries().list(body=query).execute()

def log_timestamp(): return {'seconds': int(time.time())}

def get_log_name(resource, id): return '{}/logs/{}'.format(resource, id)

def get_logger(): return get_api('logging', 'v2')

def get_credentials(scope, admin_email=os.environ['ADMIN_EMAIL']):
    default_credentials, project_id = google.auth.default()
    return google.oauth2.service_account.Credentials(
        default_credentials.signer,
        default_credentials.service_account_email,
        'https://accounts.google.com/o/oauth2/token',
        scopes=scope,
        subject=admin_email,
        project_id=project_id)

# API helpers
def get_api(
    api,
    version=DEFAULT_API_VERSION,
    scope=None,
    cache=False,
    admin_email=os.environ['ADMIN_EMAIL']):
    creds = GoogleCredentials.get_application_default() if scope is None\
        else get_credentials(scope)
    return discovery.build(
        api, version,
        credentials=creds,
        cache_discovery=cache,
        admin_email=admin_email
    )

def paging(func, api, req, item_key='items'):
    while req is not None:
        res = req.execute()
        items = res.get(item_key, [])
        map(lambda i: func(i), items)
        req = api.list_next(previous_request=req, previous_response=res)

def paging_batch(func, api, req, item_key='items'):
    count=0
    while req is not None:
        res = req.execute()
        items = res.get(item_key, [])
        func(items)
        req = api.list_next(previous_request=req, previous_response=res)

def pagingc(api, req, item_key='items'):
    full=[]
    while req is not None:
        res = req.execute()
        full += res.get(item_key, [])
        req = api.list_next(previous_request=req, previous_response=res)
    return full

# Resource Manager
def get_projects():
    api = get_api('cloudresourcemanager').projects()
    return pagingc(api, api.list(), item_key='projects')

def get_project_ids():
    return map(lambda p: p['projectId'], get_projects())

def get_folders(parent, api=None):
    if api is None: api = get_api('cloudresourcemanager', 'v2').folders()
    children = pagingc(api, api.list(parent=parent), item_key='folders')
    return children + flatmap(lambda cf: get_folders(cf['name'], api), children)

def get_folder_ids(parent):
    return map(lambda f: f['name'], get_folders(parent))

# errors
def parse_error(e):
    return json.loads(e.__dict__['content'])

def error_info(e):
    er = parse_error(e)
    return ( er['error']['code'], er['error']['errors'][0]['reason'] )

# other
def dump(res): print(json.dumps(res, sort_keys=True, indent=2))

def flatmap(f, items):
    return list(chain.from_iterable(imap(f, items)))

def to_dict(tuplelist):
    i = chain.from_iterable(tuplelist)
    return dict(izip(i,i))