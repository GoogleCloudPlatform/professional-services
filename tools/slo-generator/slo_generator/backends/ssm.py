# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
`stackdriver_service_monitoring.py`
Stackdriver Service Monitoring exporter class.
"""
import logging
import pprint
import requests

from oauth2client.client import GoogleCredentials

from slo_generator.backends.base import MetricBackend
from slo_generator.backends.stackdriver import StackdriverBackend

LOGGER = logging.getLogger(__name__)
SERVICE_ENDPOINT = "https://monitoring.googleapis.com/v3/projects/{project_id}/services"
SLO_ENDPOINT = "https://monitoring.googleapis.com/v3/projects/{project_id}/services/{service_name}/serviceLevelObjectives"


class SsmBackend(MetricBackend):
    """Stackdriver Service Monitoring backend class."""
    def __init__(self, **kwargs):
        credentials = GoogleCredentials.get_application_default()
        access_token = credentials.get_access_token().access_token
        self.headers = {'Authorization': f'Bearer {access_token}'}

    def good_bad_ratio(self, timestamp, window, **slo_config):
        slo = self.retrieve_slo(window, slo_config)

    def distribution_cut(self, timestamp, window, **slo_config):
        slo = self.retrieve_slo(window, slo_config)

    def basic(self, timestamp, window, **slo_config):
        slo = self.retrieve_slo(window, slo_config)

    def window(self, timestamp, window, **slo_config):
        slo = self.retrieve_slo(window, slo_config)

    def retrieve_slo(self, window, slo_config):
        """Get SLO object from Stackdriver Monitoring API.

        Main method for routing all the other ones.

        Args:
            slo_config (dict): SLO configuration.

        Returns:
            dict: SLO config.
        """
        if not self.get_service(slo_config):
            self.create_service(slo_config)
        slo = self.get_slo(slo_config)
        if not slo:
            slo = self.create_slo(window, slo_config)
        pprint.pprint(slo)
        LOGGER.info(f"retrieve_slo data: {data}")
        return slo

    #-------------------#
    # Service endpoints #
    #-------------------#
    def create_service(self, slo_config):
        """Create Service object in Stackdriver Service Monitoring API.

        Args:
            slo_config (dict): SLO configuration.
        """
        LOGGER.info("Creating service ...")
        service_name = slo_config['service_name']
        display_name = slo_config['slo_description']
        project_id = slo_config['backend']['project_id']

        # Get existing service.
        service = self.get_service(slo_config)

        # Create a new service.
        params = {'service_id': service_name}
        json = {'displayName': display_name, 'custom': {}}
        url = SERVICE_ENDPOINT.format(project_id=project_id)
        response = requests.post(url,
                                 headers=self.headers,
                                 params=params,
                                 json=json)
        data = response.json()
        LOGGER.info(f"create_service data: {data}")
        return data

    def get_service(self, slo_config):
        """Get Service object from Stackdriver Service Monitoring API.

        Args:
            slo_config (dict): SLO configuration.

        Returns:
            dict: Service config.
        """
        service_name = slo_config['service_name']
        project_id = slo_config['backend']['project_id']
        LOGGER.info(
            f"Getting service projects/{project_id}/services/{service_name}")
        url = SERVICE_ENDPOINT.format(project_id=project_id)
        response = requests.get(url, headers=self.headers)
        data = response.json()
        LOGGER.info(f"get_service data: {data}")
        if 'services' in data:
            services = data['services']
            for service in services:
                sname = service['name'].split("/")[-1]
                if sname == service_name:
                    LOGGER.info(f"Found existing service. {service}")
                    return service
        return None

    #---------------#
    # SLO endpoints #
    #---------------#
    def create_slo(self, window, slo_config):
        """Create SLO object in Stackdriver Service Monitoring API.

        Args:
            slo_config (dict): SLO config.

        Returns:
            dict: Service Management API response.
        """
        # code to create an SLO.
        conf = slo_config['backend']
        service_name = slo_config['service_name']
        method = conf['method']
        project_id = conf['project_id']
        measurement = conf['measurement']
        filter_valid = measurement.get('filter_valid', "")
        url = SLO_ENDPOINT.format(project_id=project_id,
                                  service_name=service_name)
        slo = {
            'displayName': slo_config['slo_description'],
            'goal': slo_config['slo_target'],
            'rollingPeriod': f'{window}s'
        }
        if method == 'basic':
            LOGGER.info("Creating basic SLI")
            methods = measurement.get('methods', [])
            locations = measurement.get('locations', [])
            versions = measurement.get('versions', [])
            threshold = measurement.get('threshold_latency')
            slo['serviceLevelIndicator'] = {
                'basicSli': {
                    'method': methods,
                    'location': locations,
                    'version': versions
                }
            }
            if threshold:
                slo['serviceLevelIndicator']['basicSli']['latency'] = {
                    'threshold': threshold
                }
            else:
                slo['serviceLevelIndicator']['basicSli']['availability'] = {}

        if method == 'good_bad_ratio':
            filter_good = measurement.get('filter_good', ""),
            filter_bad = measurement.get('filter_bad', "")
            slo['serviceLevelIndicator'] = {
                'requestBased': {
                    'goodTotalRatio': {
                        'totalServiceFilter': filter_valid,
                        'goodServiceFilter': filter_good,
                        'badServiceFilter': filter_bad
                    }
                }
            }
        elif method == 'distribution_cut':
            range_min = measurement['range_min']
            range_max = measurement['range_max']
            slo['serviceLevelIndicator'] = {
                'requestBased': {
                    'distributionCut': {
                        'distributionFilter': filter_valid,
                        'range': {
                            'min': range_min,
                            'max': range_max
                        }
                    }
                }
            }
        elif method == 'windows':
            filter = measurement.get('filter')
            # threshold = conf.get('threshold')
            # mean_in_range = conf.get('filter')
            # sum_in_range = conf.get('filter')
            slo['serviceLevelIndicator'] = {
                'windowsBased': {
                    'windowPeriod': window,
                    'goodBadMetricFilter': filter,
                    # TODO: Understand and implement this
                    # 'goodTotalRatioThreshold': {
                    #   object (PerformanceThreshold)
                    # },
                    # 'metricMeanInRange': {
                    #   object (MetricRange)
                    # },
                    # 'metricSumInRange': {
                    #   object (MetricRange)
                    # }
                }
            }
        else:
            raise Exception(f'Method "{method}" is not supported.')

        LOGGER.info(slo)
        response = requests.post(url, headers=self.headers, json=slo)
        data = response.json()
        if 'error' in data and data['error']['code'] != 200:
            raise Exception(f'Failed to create SLO. \n{pprint.pformat(data)}')
        LOGGER.info(f"SLO Created successfully. {data}")
        return data

    def get_slo(self, slo_config):
        """Get SLO object from Stackriver Service Monitoring API.

        Args:
            slo_config (dict): SLO config.

        Returns:
            dict: API response.
        """
        conf = slo_config['backend']
        project_id = conf['project_id']
        service_name = slo_config['service_name']
        slos = self.list_slos(slo_config)
        slo = [s for s in slos if s['name'] == service_name]
        if slo:
            return slo[0]
        return None

    def list_slos(self, slo_config):
        """List all SLOs from Stackdriver Service Monitoring API.

        Args:
            slo_config (dict): SLO configuration.

        Returns:
            dict: API response.
        """
        project_id = slo_config['backend']['project_id']
        service_name = slo_config['service_name']
        params = {'service_id': service_name}
        url = SLO_ENDPOINT.format(project_id=project_id,
                                  service_name=service_name)
        return self.get_all(url, params, key='serviceLevelObjectives')

    def get_all(self, url, params, key):
        """Iterate through all pages in Service Monitoring API responses.

        Args:
            url (str): Service Monitoring API endpoint.
            params (dict): Path parameters.
            key (str): Key to extract results from response.

        Returns:
            list: List of all extracted results.
        """
        params = {'pageToken': ''}
        response = []
        resp = requests.get(url, params=params, headers=self.headers)
        data = resp.json()
        while (data):
            next_page_token = data.get('nextPageToken')
            if not next_page_token:
                break
            params['pageToken'] = next_page_token
            response.extend(data[key])
            resp = requests.get(url, params=params, headers=self.headers)
            data = response.json()
        return response
