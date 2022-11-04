#   Copyright 2022 Google LLC
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
from .base import Output, NotConfiguredException
from googleapiclient import discovery
from google.oauth2.credentials import Credentials


class GroupssettingsOutput(Output):

    def output(self):
        if 'group' not in self.output_config:
            raise NotConfiguredException('No group defined in configuration.')
        group = self._jinja_expand_string(self.output_config['group'], 'group')

        if not group:
            self.logger.info('No group specified, skipping.')
            return

        if 'settings' not in self.output_config:
            raise NotConfiguredException(
                'No group settings to be updated defined in configuration.')
        settings = self._jinja_expand_dict(self.output_config['settings'],
                                           'settings')

        service_account = self.output_config[
            'serviceAccountEmail'] if 'serviceAccountEmail' in self.output_config else None

        scope = 'https://www.googleapis.com/auth/apps.groups.settings'
        credentials = Credentials(
            self.get_token_for_scopes([scope], service_account=service_account))
        branded_http = self._get_branded_http(credentials)

        group_service = discovery.build('groupssettings',
                                        'v1',
                                        http=branded_http)
        request = group_service.groups().update(groupUniqueId=group,
                                                body=settings)
        request.execute()

        self.logger.info('Group settings updated.',
                         extra={
                             'group': group,
                             'settings': settings
                         })
