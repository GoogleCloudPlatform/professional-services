#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

from helpers.base import get_branded_http
from googleapiclient.http import HttpRequest
import json


def format_cost(cost, decimals=2):
    _format = '%%.%df %%s' % decimals
    return _format % (
        (float(cost['units']) +
         (float(cost['nanos']) / 1000000000.0)), cost['currency_code'])


def get_cost(cost):
    return (float(cost['units']) + (float(cost['nanos']) / 1000000000.0))


def get_gcp_resource(resource, api_domain, api_endpoint, api_version='v1'):
    uri = "https://%s.googleapis.com/%s/%s/%s" % (api_domain, api_endpoint,
                                                  api_version, resource)
    req = HttpRequest(get_branded_http(), lambda resp, content: content, uri)
    response = req.execute()
    if response:
        parsed_response = json.loads(response.decode('utf-8'))
        return parsed_response
    return None
