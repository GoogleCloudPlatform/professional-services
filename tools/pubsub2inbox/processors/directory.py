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
from googleapiclient import discovery, http
from google.oauth2.credentials import Credentials
import google_auth_httplib2


class DirectoryProcessor(Processor):

    def process(self, config_key=None):
        if config_key is None:
            config_key = 'directory'
        if config_key not in self.config:
            raise NotConfiguredException('No settings configured!')

        directory_config = self.config[config_key]
        if 'api' not in directory_config and directory_config['api'] in [
                'groups', 'users', 'members', 'groupsettings'
        ]:
            raise NotConfiguredException(
                'No correct Directory API configured (supported: groups, groupsettings, users, members)!'
            )

        if directory_config[
                'api'] == 'groupsettings' and 'groupUniqueIds' not in directory_config:
            raise NotConfiguredException(
                'No groupUniqueIds defined for group settings!')

        if directory_config[
                'api'] == 'members' and 'groupKey' not in directory_config:
            raise NotConfiguredException(
                'No groupKey defined for members listing!')

        service_account = directory_config[
            'serviceAccountEmail'] if 'serviceAccountEmail' in directory_config else None

        scope = None
        if directory_config['api'] in ['groups', 'members']:
            scope = 'https://www.googleapis.com/auth/admin.directory.group.readonly'
        if directory_config['api'] == 'groupsettings':
            scope = 'https://www.googleapis.com/auth/apps.groups.settings'
        if directory_config['api'] == 'users':
            scope = 'https://www.googleapis.com/auth/admin.directory.user.readonly'

        credentials = Credentials(
            self.get_token_for_scopes([scope], service_account=service_account))

        branded_http = google_auth_httplib2.AuthorizedHttp(credentials)
        branded_http = http.set_user_agent(
            branded_http, 'google-pso-tool/pubsub2inbox/1.1.0')

        if directory_config['api'] != 'groupsettings':
            directory_service = discovery.build('admin',
                                                'directory_v1',
                                                http=branded_http)
        else:
            groups_service = discovery.build('groupssettings',
                                             'v1',
                                             http=branded_http)

        query = directory_config['query'] if 'query' in directory_config else ''
        query_template = self.jinja_environment.from_string(query)
        query_template.name = 'query'
        query_output = query_template.render()

        results = []
        page_token = None
        groups = []
        group_unique_id = None
        if directory_config['api'] == 'groupsettings':
            groups = self._jinja_var_to_list(directory_config['groupUniqueIds'],
                                             'groupUniqueId')
            group_unique_id = groups.pop()

        while True:
            query_parameters = {'maxResults': 200}
            for k in [
                    'orderBy', 'sortOrder', 'maxResults', 'projection',
                    'showDeleted', 'viewType', 'customFieldMask', 'roles'
            ]:
                if k in directory_config:
                    var_template = self.jinja_environment.from_string(
                        directory_config[k])
                    var_template.name = k
                    var_output = var_template.render()
                    query_parameters[k] = var_output
            if page_token is not None:
                query_parameters['page_token'] = page_token

            if directory_config['api'] in ['groups', 'users']:
                if query_output != '':
                    query_parameters['query'] = query_output
                if 'customerId' in directory_config:
                    query_parameters['customer'] = directory_config[
                        'customerId']
                elif 'domain' in directory_config:
                    query_parameters['domain'] = directory_config['domain']

            if directory_config['api'] == 'groups':
                request = directory_service.groups().list(**query_parameters)
            elif directory_config['api'] == 'users':
                request = directory_service.users().list(**query_parameters)
            elif directory_config['api'] == 'groupsettings':
                request = groups_service.groups().get(
                    groupUniqueId=group_unique_id)
            elif directory_config['api'] == 'members':
                groupkey_template = self.jinja_environment.from_string(
                    directory_config['groupKey'])
                groupkey_template.name = 'groupKey'
                groupkey_output = groupkey_template.render()
                query_parameters['groupKey'] = groupkey_output
                request = directory_service.members().list(**query_parameters)

            response = request.execute()
            if 'groups' in response:
                results = results + response['groups']
            if 'members' in response:
                results = results + response['members']
            if 'users' in response:
                results = results + response['users']
            if 'kind' in response and response[
                    'kind'] == 'groupsSettings#groups':
                results.append(response)

            if directory_config['api'] != 'groupsettings':
                if 'nextPageToken' in response:
                    page_token = response['nextPageToken']
                else:
                    break
            else:
                if len(groups) == 0:
                    break
                group_unique_id = groups.pop()

        res = {'results': results}
        return res
