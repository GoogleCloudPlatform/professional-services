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
import json
from googleapiclient import discovery, errors


class SccOutput(Output):

    def output(self):
        if 'vars' in self.output_config:
            additional_vars = self._jinja_expand_dict(
                self.output_config['vars'], 'vars')
            self.jinja_environment.globals = {
                **additional_vars,
                **self.jinja_environment.globals
            }

        if 'source' not in self.output_config:
            raise NotConfiguredException(
                'No Security Command Center source defined in configuration.')
        source = self._jinja_expand_string(self.output_config['source'],
                                           'source')

        if 'finding_id' not in self.output_config:
            raise NotConfiguredException(
                'No Security Command Center finding ID defined in configuration.'
            )

        finding_id = self._jinja_expand_string(
            str(self.output_config['finding_id']), 'finding_id')

        if 'finding' not in self.output_config:
            raise NotConfiguredException(
                'No Security Command center finding content defined in configuration.'
            )
        finding = self._jinja_expand_dict(self.output_config['finding'],
                                          'finding')
        finding['name'] = '%s/findings/%s' % (source, finding_id)

        json_fields = [
            'sourceProperties', 'indicator', 'vulnerability', 'connections',
            'processes', 'compliances', 'iamBindings', 'containers'
        ]
        for json_field in json_fields:
            if json_field in finding:
                if not isinstance(finding[json_field], dict) and not isinstance(
                        finding[json_field], list):
                    try:
                        props = json.loads(finding[json_field])
                        finding[json_field] = props
                    except Exception:
                        pass
                elif isinstance(finding[json_field], dict):
                    finding[json_field] = self._jinja_expand_dict_all(
                        finding[json_field], 'finding')
                elif isinstance(finding[json_field], list):
                    finding[json_field] = self._jinja_expand_list(
                        finding[json_field], 'finding')

        self.logger.debug('Sending finding to Security Command Center.',
                          extra={
                              'source': source,
                              'finding_id': finding_id,
                              'finding': finding
                          })

        scc_service = discovery.build('securitycenter',
                                      'v1',
                                      http=self._get_branded_http())
        request = scc_service.organizations().sources().findings().create(
            parent=source, findingId=finding_id, body=finding)
        try:
            request.execute()
        except errors.HttpError as exc:
            if exc.resp.status == 409:
                self.logger.warn('Finding already in Security Command Center.',
                                 extra={
                                     'source': source,
                                     'finding_id': finding_id
                                 })
                return
            else:
                raise (exc)

        self.logger.info('Finding sent to Security Command Center!',
                         extra={
                             'source': source,
                             'finding_id': finding_id,
                             'finding': finding
                         })
