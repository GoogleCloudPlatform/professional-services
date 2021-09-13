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


class CaiProcessor(Processor):

    def process(self, config_key=None):
        if config_key is None:
            config_key = 'cai'
        if config_key not in self.config:
            raise NotConfiguredException('No settings configured!')

        cai_config = self.config[config_key]
        if 'parent' not in cai_config:
            raise NotConfiguredException('No parent configured!')

        cai_service = discovery.build('cloudasset', 'v1')

        request_parameters = {}
        request_parameters['parent'] = self._jinja_expand_string(
            cai_config['parent'])

        for k in ['readTime', 'pageSize', 'contentType']:
            if k in cai_config:
                request_parameters[k] = self._jinja_expand_string(cai_config[k])
        if 'assetTypes' in cai_config:
            request_parameters['assetTypes'] = self._jinja_var_to_list(
                cai_config['assetTypes'])

        assets = {}
        page_token = None
        while True:
            if page_token is not None:
                request_parameters['pageToken'] = page_token
            request = cai_service.assets().list(**request_parameters)
            response = request.execute()
            if 'assets' in response:
                for asset in response['assets']:
                    if asset['assetType'] not in assets:
                        assets[asset['assetType']] = []
                    assets[asset['assetType']].append(asset)

            if 'nextPageToken' in response:
                page_token = response['nextPageToken']
            else:
                break

        return {'assets': assets}
