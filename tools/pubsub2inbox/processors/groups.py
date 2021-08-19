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
from urllib.parse import urlencode
import re


class GroupsProcessor(Processor):

    def process(self):
        if 'groups' not in self.config:
            raise NotConfiguredException(
                'No Cloud Identity groups configuration specified in config!')

        groups_config = self.config['groups']
        service_account = groups_config[
            'serviceAccountEmail'] if 'serviceAccountEmail' in groups_config else None

        group_credentials = Credentials(
            self.get_token_for_scopes([
                'https://www.googleapis.com/auth/cloud-identity.groups.readonly'
            ],
                                      service_account=service_account))
        branded_http = google_auth_httplib2.AuthorizedHttp(group_credentials)
        branded_http = http.set_user_agent(
            branded_http, 'google-pso-tool/pubsub2inbox/1.1.0')

        group_service = discovery.build('cloudidentity',
                                        'v1',
                                        http=branded_http)
        query = groups_config['query'] if 'query' in groups_config else ""

        query_template = self.jinja_environment.from_string(query)
        query_template.name = 'query'
        query_output = query_template.render()

        page_token = None
        all_groups = {}
        groups_by_owner = {}
        groups_by_manager = {}
        group_filter = None
        if 'filter' in groups_config:
            group_filter_template = self.jinja_environment.from_string(
                groups_config['filter'])
            group_filter_template.name = 'group_filter'
            group_filter_output = group_filter_template.render()
            group_filter = re.compile(group_filter_output)
        while True:
            search_query = urlencode({"query": query_output})
            search_group_request = group_service.groups().search(
                pageToken=page_token, pageSize=1, view="FULL")
            param = "&" + search_query
            search_group_request.uri += param
            response = search_group_request.execute()
            if 'groups' in response:
                for group in response['groups']:
                    group_key = group['groupKey']['id']
                    if group_filter:
                        if not group_filter.match(group_key):
                            continue

                    group['owners'] = []
                    group['managers'] = []
                    membership_page_token = None
                    while True:
                        membership_request = group_service.groups().memberships(
                        ).list(parent=group['name'],
                               pageToken=membership_page_token)
                        membership_response = membership_request.execute()
                        group['memberships'] = {}
                        if 'memberships' in membership_response:
                            owners = []
                            managers = []
                            for member in membership_response['memberships']:
                                member_key = member['preferredMemberKey']['id']
                                group['memberships'][member_key] = member
                                if 'roles' in member:
                                    for role in member['roles']:
                                        if role['name'] == 'OWNER':
                                            owners.append(member_key)
                                            group['owners'].append(member_key)
                                        if role['name'] == 'MANAGER':
                                            managers.append(member_key)
                                            group['managers'].append(member_key)
                            for owner in owners:
                                if owner not in groups_by_owner:
                                    groups_by_owner[owner] = [group]
                                else:
                                    groups_by_owner[owner].append(group)
                            for manager in managers:
                                if manager not in groups_by_manager:
                                    groups_by_manager[manager] = [group]
                                else:
                                    groups_by_manager[manager].append(group)

                        if 'nextPageToken' in membership_response:
                            membership_page_token = membership_response[
                                'nextPageToken']
                        else:
                            break

                    all_groups[group_key] = group
            if 'nextPageToken' in response:
                page_token = response['nextPageToken']
            else:
                break

        res = {
            'all_groups': all_groups,
            'groups_by_owner': groups_by_owner,
            'groups_by_manager': groups_by_manager
        }
        return res
