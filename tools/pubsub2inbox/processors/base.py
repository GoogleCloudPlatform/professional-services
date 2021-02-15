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
import google_auth_httplib2
import google.auth
import abc

_PROJECT_NUM_CACHE = {}
_PROJECT_ID_CACHE = {}


class NotConfiguredException(Exception):
    pass


class UnknownProjectException(Exception):
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

    def expand_projects(self, projects):
        credentials, project_id = google.auth.default(
            ['https://www.googleapis.com/auth/cloud-platform'])
        branded_http = google_auth_httplib2.AuthorizedHttp(credentials)
        branded_http = http.set_user_agent(
            branded_http, 'google-pso-tool/pubsub2inbox/1.0.0')

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
                    service = discovery.build('cloudresourcemanager',
                                              'v1',
                                              http=branded_http)
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
                    service = discovery.build('cloudresourcemanager',
                                              'v1',
                                              http=branded_http)
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
    def process(self):
        pass
