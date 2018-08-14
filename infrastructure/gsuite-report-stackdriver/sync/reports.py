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

import math, time, dateutil.parser
from utils import get_api, paging_batch, last_log_time, log_write, log_timestamp

def sync_admin_logs(
    app_name,
    resource_id,
    log_id, 
    admin_email=os.environ['ADMIN_EMAIL']):
    scope = ['https://www.googleapis.com/auth/admin.reports.audit.readonly']
    api = get_api('admin', 'reports_v1', scope).activities()
    req = api.list(
        applicationName=app_name,
        userKey='all',
        startTime = last_log_time(resource_id, log_id)
    )
    paging_batch(
        lambda batch: log_write(
            map(lambda i: convert_admin_log(i), batch),
            resource_id, log_id
        ),
        api, req
    )

def convert_admin_log(item):
    return {
        'timestamp': log_timestamp(),
        'insertId': item['etag'],
        'jsonPayload': {
            'requestMetadata': {'callerIp': item.get('ipAddress')},
            'authenticationInfo': {
                'callerType': item['actor'].get('callerType'),
                'principalEmail': item['actor'].get('email')
            },
            'methodName': item['events'][0]['name'],
            'parameters': item['events'][0].get('parameters'),
            'report_timestamp': convert_timestamp(item),
        },
        'resource': { 'type': 'global' }
    }

def convert_timestamp(item):
    (remainder, seconds) = math.modf(time.mktime(
        dateutil.parser.parse(item['id']['time']).timetuple()
    ))
    return {'seconds': int(seconds)}