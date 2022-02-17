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
from google.cloud.functions.context import Context
from googleapiclient import discovery, http
import abc
from helpers.base import BaseHelper

_PROJECT_NUM_CACHE = {}
_PROJECT_ID_CACHE = {}


class NotConfiguredException(Exception):
    pass


class UnknownProjectException(Exception):
    pass


class Processor(BaseHelper):
    config = None
    data = None
    event = None
    context: Context

    def __init__(self, config, jinja_environment, data, event,
                 context: Context):
        self.config = config
        self.data = data
        self.event = event
        self.context = context

        super().__init__(jinja_environment)

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
                    service._http = http.set_user_agent(service._http,
                                                        self._get_user_agent())

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
                    service._http = http.set_user_agent(service._http,
                                                        self._get_user_agent())
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

    @abc.abstractmethod
    def process(self, config_key=None):
        pass
