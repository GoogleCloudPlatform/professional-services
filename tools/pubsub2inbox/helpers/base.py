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
import logging
import os
import re
import json
from google.cloud.iam_credentials_v1 import IAMCredentialsClient
from google.api_core.gapic_v1 import client_info as grpc_client_info
import google_auth_httplib2
import google.auth
from googleapiclient import http

PUBSUB2INBOX_VERSION = '1.3.0'


class NoCredentialsException(Exception):
    pass


def get_user_agent():
    return 'google-pso-tool/pubsub2inbox/%s' % (PUBSUB2INBOX_VERSION)


def get_branded_http(credentials=None):
    if not credentials:
        credentials, project_id = google.auth.default(
            ['https://www.googleapis.com/auth/cloud-platform'])
    branded_http = google_auth_httplib2.AuthorizedHttp(credentials)
    branded_http = http.set_user_agent(branded_http, get_user_agent())
    return branded_http


def get_grpc_client_info():
    client_info = grpc_client_info.ClientInfo(user_agent=get_user_agent())
    return client_info


class BaseHelper:
    logger = None
    jinja_environment = None

    def __init__(self, jinja_environment):
        self.jinja_environment = jinja_environment
        self.logger = logging.getLogger('pubsub2inbox')

    def _get_user_agent(self):
        return get_user_agent()

    def _get_branded_http(self, credentials=None):
        return get_branded_http(credentials)

    def _get_grpc_client_info(self):
        return get_grpc_client_info()

    def get_token_for_scopes(self, scopes, service_account=None):
        if not service_account:
            service_account = os.getenv('SERVICE_ACCOUNT')

        if not service_account:
            raise NoCredentialsException(
                'You need to specify a service account for Directory API credentials, either through SERVICE_ACCOUNT environment variable or serviceAccountEmail parameter.'
            )

        client = IAMCredentialsClient()
        name = 'projects/-/serviceAccounts/%s' % service_account
        response = client.generate_access_token(name=name, scope=scopes)
        return response.access_token

    def _jinja_expand_bool(self, contents, _tpl='config'):
        if isinstance(contents, bool):
            return contents
        var_template = self.jinja_environment.from_string(contents)
        var_template.name = _tpl
        val_str = var_template.render().lower()
        if val_str == 'true' or val_str == 't' or val_str == 'yes' or val_str == 'y' or val_str == '1':
            return True
        return False

    def _jinja_expand_string(self, contents, _tpl='config'):
        var_template = self.jinja_environment.from_string(contents)
        var_template.name = _tpl
        val_str = var_template.render()
        return val_str

    def _jinja_expand_int(self, contents, _tpl='config'):
        if isinstance(contents, int):
            return contents
        if isinstance(contents, float):
            return int(contents)
        var_template = self.jinja_environment.from_string(contents)
        var_template.name = _tpl
        val_str = var_template.render()
        return int(val_str)

    def _jinja_var_to_list(self, _var, _tpl='config'):
        if isinstance(_var, list):
            return _var
        else:
            var_template = self.jinja_environment.from_string(_var)
            var_template.name = _tpl
            val_str = var_template.render()
            try:
                return json.loads(val_str)
            except Exception:
                self.logger.debug(
                    'Error parsing variable to list, trying command or CR separated.',
                    extra={
                        'template': _var,
                        'value': val_str
                    })
                vals = list(
                    filter(
                        lambda x: x.strip() != "",
                        re.split('[\n,]', val_str),
                    ))
                return list(map(lambda x: x.strip(), vals))

    def _jinja_var_to_list_all(self, _var, _tpl='config'):
        if isinstance(_var, list):
            return self._jinja_expand_list(_var, _tpl)
        else:
            var_template = self.jinja_environment.from_string(_var)
            var_template.name = _tpl
            val_str = var_template.render()
            try:
                return json.loads(val_str)
            except Exception:
                self.logger.debug(
                    'Error parsing variable to list, trying command or CR separated.',
                    extra={
                        'template': _var,
                        'value': val_str
                    })
                vals = list(
                    filter(
                        lambda x: x.strip() != "",
                        re.split('[\n,]', val_str),
                    ))
                return list(map(lambda x: x.strip(), vals))

    def _jinja_expand_dict(self, _var, _tpl='config'):
        for k, v in _var.items():
            if not isinstance(v, dict):
                if isinstance(v, str):
                    _var[k] = self._jinja_expand_string(v)
            else:
                _var[k] = self._jinja_expand_dict(_var[k])
        return _var

    def _jinja_expand_dict_all(self, _var, _tpl='config'):
        if not isinstance(_var, dict):
            return _var
        for k, v in _var.items():
            if not isinstance(v, dict):
                if isinstance(v, str):
                    _var[k] = self._jinja_expand_string(v)
                if isinstance(v, list):
                    for idx, lv in enumerate(_var[k]):
                        if isinstance(lv, dict):
                            _var[k][idx] = self._jinja_expand_dict_all(lv)
                        if isinstance(lv, str):
                            _var[k][idx] = self._jinja_expand_string(lv)
                else:
                    _var[k] = self._jinja_expand_dict_all(_var[k])
        return _var

    def _jinja_expand_list(self, _var, _tpl='config'):
        if not isinstance(_var, list):
            return _var
        for idx, v in enumerate(_var):
            if isinstance(v, str):
                _var[idx] = self._jinja_expand_string(v)
        return _var