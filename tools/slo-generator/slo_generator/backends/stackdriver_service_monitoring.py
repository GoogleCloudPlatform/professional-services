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
import json
import logging
import pprint
import requests

from oauth2client.client import GoogleCredentials

from slo_generator.backends.base import MetricBackend
from slo_generator.backends.stackdriver import StackdriverBackend

LOGGER = logging.getLogger(__name__)
SERVICE_ENDPOINT = "https://monitoring.googleapis.com/v3/projects/{project_id}/services"
SLO_ENDPOINT = "https://monitoring.googleapis.com/v3/projects/{project_id}/services/{service_name}/serviceLevelObjectives"


class StackdriverServiceMonitoringBackend(MetricBackend):
    """Stackdriver Service Monitoring backend class."""
    def __init__(self, **kwargs):
        credentials = GoogleCredentials.get_application_default()
        access_token = credentials.get_access_token().access_token
        self.headers = {'Authorization': f'Bearer {access_token}'}

    def good_bad_ratio(self, timestamp, window, **slo_config):
        return self.retrieve_slo(timestamp, window, slo_config)

    def distribution_cut(self, timestamp, window, **slo_config):
        return self.retrieve_slo(timestamp, window, slo_config)

    def basic(self, timestamp, window, **slo_config):
        return self.retrieve_slo(timestamp, window, slo_config)

    def window(self, timestamp, window, **slo_config):
        return self.retrieve_slo(timestamp, window, slo_config)

    def retrieve_slo(self, timestamp, window, slo_config):
        """Get SLI value from Stackdriver Monitoring API.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window in seconds.
            slo_config (dict): SLO configuration.

        Returns:
            dict: SLO config.
        """
        if not self.get_service(slo_config):
            self.create_service(slo_config)
        slo = self.get_slo(window, slo_config)
        if not slo:
            slo = self.create_slo(window, slo_config)

        # Now that we have our SLO, retrieve the TimeSeries from Stackdriver
        # Monitoring API for that particular SLO id.
        project_id = slo_config['backend']['project_id']
        service_name = slo_config['service_name']
        slo_name = slo['name']
        slo_id = slo_name.split("/")[-1]
        metric_filter = f"projects/{project_id}/services/{service_name}/serviceLevelObjectives/{slo_id}"
        filter = f"select_slo_counts(\"{metric_filter}\")"

        # Query SLO timeseries
        stackdriver = StackdriverBackend(**slo_config)
        timeseries = stackdriver.query(project_id,
                                       timestamp,
                                       window,
                                       filter,
                                       aligner='ALIGN_SUM',
                                       reducer='REDUCE_SUM',
                                       group_by=['metric.labels.event_type'])
        timeseries = list(timeseries)
        good_event_count, bad_event_count = SSM.count(timeseries)
        return (good_event_count, bad_event_count)

    @staticmethod
    def count(timeseries):
        """Extract good_count, bad_count tuple from Stackdriver Monitoring API
        response.

        Args:
            timeseries (list): List of timeseries objects.

        Returns:
            tuple: A tuple (good_event_count, bad_event_count).
        """
        good_event_count, bad_event_count = 0, 0
        for timeserie in timeseries:
            event_type = timeserie.metric.labels['event_type']
            value = timeserie.points[0].value.double_value
            if event_type == 'bad':
                bad_event_count = value
            elif event_type == 'good':
                good_event_count = value
        return good_event_count, bad_event_count

    def compute_slo_report(self, backend, project_id, timestamp, window,
                           filter):
        """Compute SLO report using Stackdriver Monitoring API queries.

        filter:

        """
        filters = {
            "select_slo_burnrate":
            f"select_slo_burn_rate(\"{filter}\", \"86400s\")",
            "select_slo_health": f"select_slo_health(\"{filter}\")",
            "select_slo_compliance": f"select_slo_compliance(\"{filter}\")",
            "select_slo_budget": f"select_slo_budget(\"{filter}\")",
            "select_slo_budget_fraction":
            f"select_slo_budget_fraction(\"{filter}\")",
            "select_slo_budget_total":
            f"select_slo_budget_total(\"{filter}\")",
        }
        report = {}
        for name, filter in filters.items():
            LOGGER.debug(f'Querying timeseries with filter "{filter}"')
            timeseries = stackdriver.query(project_id,
                                           timestamp,
                                           window,
                                           filter,
                                           aligner='ALIGN_MEAN',
                                           reducer='REDUCE_MEAN')
            timeseries = list(timeseries)
            for ts in timeseries:
                points = ts.points
                for p in points:
                    report[name] = p.value.double_value
        LOGGER.debug(pprint.pformat(report))

        return report

    #-------------------#
    # Service endpoints #
    #-------------------#
    def create_service(self, slo_config):
        """Create Service object in Stackdriver Service Monitoring API.

        Args:
            slo_config (dict): SLO configuration.
        """
        LOGGER.debug("Creating service ...")
        service_name = slo_config['service_name']
        display_name = slo_config['slo_description']
        project_id = slo_config['backend']['project_id']
        method = slo_config['backend']['method']
        params = {}
        json = {'displayName': display_name}

        # Create a new service.
        if method != 'basic':
            params = {'service_id': service_name}
            json['custom'] = {}
        else:
            raise Exception(
                f"Service {service_name} was not found in Service Monitoring API"
            )
            # TODO:Only custom services should be created manually. Figure out
            # this stuff
            # type, rest = service_name.split(":")
            # project_id, id = tuple(rest.split("_"))
            # if type == 'gae':
            #     json['appEngine'] = {'module_id': id}
            #
            # elif type == 'istio':
            #     location, cluster_name, ns, service_name = tuple(id.split("-"))
            #     json['clusterIstio'] = {
            #         'location': location,
            #         'clusterName': cluster_name,
            #         'serviceNamespace': ns,
            #         'serviceName': service_name
            #     }
            #
            # elif type == 'endpoint':
            #     json['cloudEndpoints'] = {'service': id}

        url = SERVICE_ENDPOINT.format(project_id=project_id)
        response = requests.post(url,
                                 headers=self.headers,
                                 params=params,
                                 json=json)
        data = response.json()
        LOGGER.info(f'Service object created successfully in Stackdriver '
                    f'Service Monitoring API.')
        LOGGER.debug(data)
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
        LOGGER.debug(
            f'Getting service "projects/{project_id}/services/{service_name}" ...'
        )
        url = SERVICE_ENDPOINT.format(project_id=project_id)
        response = requests.get(url, headers=self.headers)
        data = response.json()
        LOGGER.debug(f"get_service data: {data}")
        if 'services' in data:
            services = data['services']
            for service in services:
                sname = service['name'].split("/")[-1]
                if sname == service_name:
                    LOGGER.debug(f'Found existing service "{sname}".')
                    LOGGER.debug(service)
                    return service
        LOGGER.warning(
            f'Service "{service_name}" not found in Stackdriver Service '
            f'Monitoring API.')
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
        project_id = slo_config['backend']['project_id']
        service_name = slo_config['service_name']
        slo = SSM.convert_slo_to_json(window, slo_config)
        url = SLO_ENDPOINT.format(project_id=project_id,
                                  service_name=service_name)
        response = requests.post(url, headers=self.headers, json=slo)
        data = response.json()
        if 'error' in data:
            raise Exception(f'Failed to create SLO. \n{pprint.pformat(data)}')
        LOGGER.info(f'SLO object created successfully in Stackdriver Service '
                    f'Monitoring API.')
        LOGGER.debug(data)
        return data

    @staticmethod
    def convert_slo_to_json(window, slo_config):
        """Get SLO JSON representation in Service Monitoring API from SLO
        configuration.

        Args:
            window (int): Window (in seconds).
            slo_config (dict): SLO Configuration.

        Returns:
            dict: SLO JSON configuration.
        """
        measurement = slo_config['backend'].get('measurement', {})
        method = slo_config['backend']['method']
        filter_valid = measurement.get('filter_valid', "")
        slo = {
            'displayName': slo_config['slo_description'],
            'goal': slo_config['slo_target'],
            'rollingPeriod': f'{window}s'
        }
        if method == 'basic':
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

        elif method == 'good_bad_ratio':
            filter_good = measurement.get('filter_good', "")
            filter_bad = measurement.get('filter_bad', "")
            slo['serviceLevelIndicator'] = {
                'requestBased': {
                    'goodTotalRatio': {
                        # 'totalServiceFilter': filter_valid,
                        # 'goodServiceFilter': filter_good,
                        # 'badServiceFilter': filter_bad
                    }
                }
            }
            if filter_good:
                slo['serviceLevelIndicator']['requestBased']['goodTotalRatio'][
                    'goodServiceFilter'] = filter_good
            if filter_bad:
                slo['serviceLevelIndicator']['requestBased']['goodTotalRatio'][
                    'badServiceFilter'] = filter_bad
            if filter_valid:
                slo['serviceLevelIndicator']['requestBased']['goodTotalRatio'][
                    'totalServiceFilter'] = filter_valid

        elif method == 'distribution_cut':
            range_min = measurement.get('range_min', 0)
            range_max = measurement['range_max']

            slo['serviceLevelIndicator'] = {
                'requestBased': {
                    'distributionCut': {
                        'distributionFilter': filter_valid,
                        'range': {
                            'max': range_max
                        }
                    }
                }
            }
            if range_min != 0:
                slo['serviceLevelIndicator']['requestBased'][
                    'distributionCut']['range']['min'] = range_min

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
        return slo

    #--------------#
    # SLO Endpoint #
    #--------------#
    def get_slo(self, window, slo_config):
        """Get SLO object from Stackriver Service Monitoring API.

        Args:
            slo_config (dict): SLO config.

        Returns:
            dict: API response.
        """
        conf = slo_config['backend']
        project_id = conf['project_id']
        service_name = slo_config['service_name']
        LOGGER.debug(f'Getting SLO for service "{service_name}" ...')
        slos = self.list_slos(slo_config)
        slo_json = SSM.convert_slo_to_json(window, slo_config)

        # Loop through API response to find an SLO that corresponds to our
        # configuration.
        for slo in slos:
            slo_api = {k: v for k, v in slo.items() if k != 'name'}
            local_json = json.dumps(slo_json, sort_keys=True)
            remote_json = json.dumps(slo_api, sort_keys=True)
            equal = local_json == remote_json
            if equal:
                slo_id = slo['name']
                id = slo_id.split("/")[-1]
                LOGGER.debug(f'Found existing SLO "{id}".')
                LOGGER.debug(slo)
                return slo
        LOGGER.warning(
            'No SLO found in Stackdriver Service Monitoring API matching '
            'current configuration.')
        LOGGER.debug(f'SLOs from Stackdriver Monitoring API: {slos}')
        LOGGER.debug(f'SLO config converted: {slo_json}')
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
        url = SLO_ENDPOINT.format(project_id=project_id,
                                  service_name=service_name)
        slos = self._query(url, {}, key='serviceLevelObjectives')
        LOGGER.debug(f"{len(slos)} SLOs found in Service Monitoring API.")
        LOGGER.debug(slos)
        return slos

    def _query(self, url, params, key=None):
        """Iterate through all pages in Service Monitoring API responses
        and aggregate responses.

        Args:
            url (str): Service Monitoring API endpoint.
            params (dict): Path parameters.
            key (str): Key to extract results from response.

        Returns:
            list: List of all extracted results.
        """
        response = []
        resp = requests.get(url, {}, headers=self.headers)
        data = resp.json()
        while (data):
            if 'error' in data:
                raise Exception(f'Error while running query: {data}')

            # Extract data from key
            if key is not None:
                response.extend(data[key])
            else:
                response.extend(data)

            # Query next page
            next_page_token = data.get('nextPageToken')
            if not next_page_token:
                break
            params['pageToken'] = next_page_token
            resp = requests.get(url, params=params, headers=self.headers)
            data = resp.json()
        return response


SSM = StackdriverServiceMonitoringBackend
