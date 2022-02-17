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
from .base import Processor, NotConfiguredException
from googleapiclient import discovery


class ProjectsProcessor(Processor):

    def process(self, config_key=None):
        if config_key is None:
            config_key = 'projects'
        if config_key not in self.config:
            raise NotConfiguredException('No settings configured!')

        projects_config = self.config[config_key]

        service = discovery.build('cloudresourcemanager',
                                  'v1',
                                  http=self._get_branded_http())

        projects = []
        if 'get' in projects_config:
            for project in projects_config['get']:
                project_id = self._jinja_expand_string(project)
                request = service.projects().get(projectId=project_id)
                response = request.execute()
                projects.append(response)
        else:
            page_token = None
            project_filter = None
            if 'filter' in projects_config:
                project_filter = self._jinja_expand_string(
                    projects_config['filter'])
            indexing = 'projectId'
            if 'indexing' in projects_config:
                if projects_config['indexing'] == 'parent':
                    indexing = 'parent'
                if projects_config['indexing'] == 'list':
                    indexing = 'list'

            if indexing == 'list':
                projects = []
            else:
                projects = {}
            while True:
                request = service.projects().list(filter=project_filter,
                                                  pageToken=page_token)
                response = request.execute()
                for project in response.get('projects', []):
                    if 'jinjaFilter' in projects_config:
                        jf_template = self.jinja_environment.from_string(
                            projects_config['jinjaFilter'])
                        jf_template.name = 'project_filter'
                        jf_str = jf_template.render(project)
                        if jf_str.strip() == '':
                            continue

                    if indexing == 'list':
                        projects.append(project)
                    elif indexing == 'projectId':
                        projects[project['projectId']] = project
                    elif indexing == 'parent':
                        parent = '%s/%s' % (project['parent']['type'],
                                            project['parent']['id'])
                        if parent not in projects:
                            projects[parent] = {}
                        projects[parent][project['projectId']] = project

                if 'nextPageToken' in response:
                    page_token = response['nextPageToken']
                    continue

                break

        return {
            'projects': projects,
        }
