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
from google.cloud.functions.context import Context
from googleapiclient import discovery, http
import abc
import re
import json
import os
from google.cloud.iam_credentials_v1 import IAMCredentialsClient

_PROJECT_NUM_CACHE = {}
_PROJECT_ID_CACHE = {}


class NotConfiguredException(Exception):
    pass


class UnknownProjectException(Exception):
    pass


class NoCredentialsException(Exception):
    pass


class Processor:
    config = None
    data = None
    event = None
    context: Context
    logger = None
    jinja_environment = None

    def __init__(self, config, jinja_environment, data, event,
                 context: Context):
        self.config = config
        self.jinja_environment = jinja_environment
        self.data = data
        self.event = event
        self.context = context

        self.logger = logging.getLogger('pubsub2inbox')

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

    def expand_projects(self, projects):
        ret = []
        self.logger.debug('Expanding projects list.',
                          extra={'projects': projects})

        for project in projects:
            if project.startswith('projects/'):
                project = project[9:]
            if project.endswith('/'):
                project = project[0:len(project) - 1]

            if project.isdecimal():
                if len(_PROJECT_NUM_CACHE) == 0:
                    service = discovery.build('cloudresourcemanager', 'v1')
                    service._http = http.set_user_agent(
                        service._http, 'google-pso-tool/pubsub2inbox/1.1.0')

                    request = service.projects().list()
                    response = request.execute()
                    while request:
                        for p in response['projects']:
                            _PROJECT_NUM_CACHE[p['projectNumber']] = (
                                p['projectId'], p['projectNumber'], p['name'],
                                p['labels'] if 'labels' in p else {})
                        request = service.projects().list_next(
                            request, response)
                        if request:
                            response = request.execute()

                project_parts = project.split('/')
                if len(project_parts) == 1:
                    project_num = project_parts[0]
                else:
                    project_num = project_parts[1]
                if project_num not in _PROJECT_NUM_CACHE:
                    raise UnknownProjectException('Unknown project ID %s!' %
                                                  project_num)

                ret.append(_PROJECT_NUM_CACHE[project_num])
            else:
                if '/' not in project and project not in _PROJECT_ID_CACHE:
                    service = discovery.build('cloudresourcemanager', 'v1')
                    service._http = http.set_user_agent(
                        service._http, 'google-pso-tool/pubsub2inbox/1.1.0')
                    request = service.projects().get(projectId=project)
                    response = request.execute()
                    _PROJECT_ID_CACHE[response['projectId']] = (
                        response['projectId'], response['projectNumber'],
                        response['name'],
                        response['labels'] if 'labels' in response else {})

                if project in _PROJECT_ID_CACHE:
                    ret.append(_PROJECT_ID_CACHE[project])
        self.logger.debug('Expanding projects list finished.',
                          extra={'projects': ret})
        return ret

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
                vals = list(
                    filter(
                        lambda x: x.strip() != "",
                        re.split('[\n,]', val_str),
                    ))
                return list(map(lambda x: x.strip(), vals))

    @abc.abstractmethod
    def process(self, config_key=None):
        pass
