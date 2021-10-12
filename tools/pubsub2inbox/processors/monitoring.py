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


class MonitoringProcessor(Processor):

    def process(self, config_key=None):
        if config_key is None:
            config_key = 'monitoring'
        if config_key not in self.config:
            raise NotConfiguredException('No settings configured!')

        monitoring_config = self.config[config_key]
        if 'timeSeries' not in monitoring_config:
            raise NotConfiguredException('No time series configured!')

        monitoring_service = discovery.build('monitoring',
                                             'v3',
                                             http=self._get_branded_http())

        time_series = self._jinja_var_to_list(monitoring_config['timeSeries'])

        page_size = self._jinja_expand_string(
            monitoring_config['pageSize']
        ) if 'pageSize' in monitoring_config else 10
        results = {}
        for ts in time_series:
            project_template = self.jinja_environment.from_string(
                monitoring_config['project'])
            project_template.name = 'project'
            project_str = project_template.render(item=ts)

            key_template = self.jinja_environment.from_string(
                monitoring_config['key'])
            key_template.name = 'key'
            key_str = key_template.render(item=ts)

            query_template = self.jinja_environment.from_string(
                monitoring_config['query'])
            query_template.name = 'query'
            query_str = query_template.render(item=ts)

            if query_str != '':
                page_token = None
                request_body = {
                    'query': query_str,
                    'pageSize': page_size,
                }
                while True:
                    if not page_token is None:
                        request_body['pageToken'] = page_token
                    request = monitoring_service.projects().timeSeries().query(
                        name=project_str, body=request_body)
                    response = request.execute()
                    if 'timeSeriesDescriptor' in response:
                        if not key_str in results:
                            results[key_str] = {
                                'timeSeriesDescriptor':
                                    response['timeSeriesDescriptor']
                            }
                            if 'timeSeriesData' in response:
                                results[key_str]['timeSeriesData'] = response[
                                    'timeSeriesData']
                            else:
                                results[key_str]['timeSeriesData'] = [{
                                    'labelValues': [],
                                    'pointData': []
                                }]
                        else:
                            if 'timeSeriesData' in response:
                                for idx, tsd in enumerate(
                                        response['timeSeriesData']):

                                    results[key_str]['timeSeriesData'][idx][
                                        'pointData'] = results[key_str][
                                            'timeSeriesData'][idx] + ts[
                                                'pointData']
                    else:
                        results[key_str] = {
                            'timeSeriesDescriptor': {},
                            'timeSeriesData': [{
                                'labelValues': [],
                                'pointData': []
                            }]
                        }

                    if 'nextPageToken' in response:
                        page_token = response['nextPageToken']
                    else:
                        break

        # Process data for a bit easier processing
        for k, v in results.items():
            results[k]['bools'] = []
            results[k]['int64s'] = []
            results[k]['strings'] = []
            for tsk, tsv in enumerate(v['timeSeriesData']):
                val_bools = []
                val_int64s = []
                val_strings = []
                for pdk, pdv in enumerate(tsv['pointData']):
                    for val in pdv['values']:
                        if 'int64Value' in val:
                            val_int64s.append(int(val['int64Value']))
                        if 'boolValue' in val:
                            val_bools.append(val['boolValue'])
                        if 'stringValue' in val:
                            val_strings.append(val['stringValue'])
                results[k]['bools'].append(val_bools)
                results[k]['int64s'].append(val_int64s)
                results[k]['strings'].append(val_strings)

        return {'time_series': results}
