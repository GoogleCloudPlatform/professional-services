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
import difflib
import json
import logging
import pprint

import google.api_core.exceptions
from google.cloud.monitoring_v3 import ServiceMonitoringServiceClient
from google.protobuf.json_format import MessageToJson

from slo_generator.backends.stackdriver import StackdriverBackend
from slo_generator.utils import dict_snake_to_caml

LOGGER = logging.getLogger(__name__)


class StackdriverServiceMonitoringBackend:
    """Stackdriver Service Monitoring backend class."""
    def __init__(self, **kwargs):  # pylint: disable=unused-argument
        self.client = ServiceMonitoringServiceClient()

    def good_bad_ratio(self, timestamp, window, slo_config):
        """Good bad ratio method.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window in seconds.
            slo_config (dict): SLO configuration.

        Returns:
            dict: SLO config.
        """
        return self.retrieve_slo(timestamp, window, slo_config)

    def distribution_cut(self, timestamp, window, slo_config):
        """Good bad ratio method.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window in seconds.
            slo_config (dict): SLO configuration.

        Returns:
            dict: SLO config.
        """
        return self.retrieve_slo(timestamp, window, slo_config)

    def basic(self, timestamp, window, slo_config):
        """Basic method (automatic SLOs for GAE / GKE (Istio) and Cloud
        Endpoints).

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window in seconds.
            slo_config (dict): SLO configuration.

        Returns:
            dict: SLO config.
        """
        return self.retrieve_slo(timestamp, window, slo_config)

    def window(self, timestamp, window, slo_config):
        """Window-based SLI method.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window in seconds.
            slo_config (dict): SLO configuration.

        Returns:
            dict: SLO config.
        """
        return self.retrieve_slo(timestamp, window, slo_config)

    # pylint: disable=unused-argument
    def delete(self, timestamp, window, slo_config):
        """Delete method.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window in seconds.
            slo_config (dict): SLO configuration.

        Returns:
            dict: SLO config.
        """
        return self.delete_slo(window, slo_config)

    def retrieve_slo(self, timestamp, window, slo_config):
        """Get SLI value from Stackdriver Monitoring API.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window in seconds.
            slo_config (dict): SLO configuration.

        Returns:
            dict: SLO config.
        """
        # Get or create service
        service = self.get_service(slo_config)
        if service is None:
            service = self.create_service(slo_config)
        LOGGER.debug(service)

        # Get or create SLO
        slo = self.get_slo(window, slo_config)
        if not slo:
            slo = self.create_slo(window, slo_config)
        LOGGER.debug(service)

        # Now that we have our SLO, retrieve the TimeSeries from Stackdriver
        # Monitoring API for that particular SLO id.
        project_id = slo_config['backend']['project_id']
        metric_filter = SSM.build_slo_id(window, slo_config, full=True)
        filter = f"select_slo_counts(\"{metric_filter}\")"

        # Query SLO timeseries
        stackdriver = StackdriverBackend(slo_config)
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

    @staticmethod
    def compute_slo_report(backend, project_id, timestamp, window, filter):
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
        for name, metric_filter in filters.items():
            LOGGER.debug(f'Querying timeseries with filter "{filter}"')
            timeseries = backend.query(project_id,
                                       timestamp,
                                       window,
                                       metric_filter,
                                       aligner='ALIGN_MEAN',
                                       reducer='REDUCE_MEAN')
            timeseries = list(timeseries)
            for timeserie in timeseries:
                points = timeserie.points
                for point in points:
                    report[name] = point.value.double_value
        LOGGER.debug(pprint.pformat(report))

        return report

    def create_service(self, slo_config):
        """Create Service object in Stackdriver Service Monitoring API.

        Args:
            slo_config (dict): SLO configuration.

        Returns:
            dict: Stackdriver Service Monitoring API response.
        """
        LOGGER.debug("Creating service ...")
        project_id = slo_config['backend']['project_id']
        service_json = SSM.build_service(slo_config)
        service_id = SSM.build_service_id(slo_config)
        parent = self.client.project_path(project_id)
        service = self.client.create_service(parent,
                                             service_json,
                                             service_id=service_id)
        LOGGER.info(
            f'Service "{service_id}" created successfully in Stackdriver '
            f'Service Monitoring API.')
        return SSM.to_json(service)

    def get_service(self, slo_config):
        """Get Service object from Stackdriver Service Monitoring API.

        Args:
            slo_config (dict): SLO configuration.

        Returns:
            dict: Service config.
        """
        project_id = slo_config['backend']['project_id']
        service_id = SSM.build_service_id(slo_config, full=False)
        project = self.client.project_path(project_id)
        services = self.client.list_services(project)
        # LOGGER.debug(pprint.pformat(list(services)))
        matches = [
            service for service in list(services)
            if service.name.split("/")[-1] == service_id
        ]
        if matches:
            service = matches[0]
            LOGGER.debug(f'Found matching service "{service.name}"')
            return SSM.to_json(service)
        LOGGER.warning(
            f'Service "{service_id}" not found for project "{project_id}"')
        return None

    @staticmethod
    def build_service(slo_config):
        """Build service JSON in Stackdriver Monitoring API from SLO
        configuration.

        Args:
            slo_config (dict): SLO configuration.

        Returns:
            dict: Service JSON in Stackdriver Monitoring API.
        """
        method = slo_config['backend']['method']
        service_id = SSM.build_service_id(slo_config, full=False)
        display_name = slo_config.get('service_display_name', service_id)
        service = {'display_name': display_name}
        if method != 'basic':  # custom service
            service['custom'] = {}
        else:
            raise Exception(f'Method {method} is not supported.')
        return service

    @staticmethod
    def build_service_id(slo_config, full=False):
        """Build service id from SLO configuration.

        Args:
            slo_config (dict): SLO configuration.
            full (bool): If True, return full service resource id including
                project path.

        Returns:
            str: Service id.
        """
        service_name = slo_config['service_name']
        feature_name = slo_config['feature_name']
        project_id = slo_config['backend']['project_id']
        service_id = f'{service_name}-{feature_name}'
        if full:
            return f'projects/{project_id}/services/{service_id}'
        return service_id

    def create_slo(self, window, slo_config):
        """Create SLO object in Stackdriver Service Monitoring API.

        Args:
            window (int): Window (in seconds).
            slo_config (dict): SLO config.

        Returns:
            dict: Service Management API response.
        """
        project_id = slo_config['backend']['project_id']
        service_id = SSM.build_service_id(slo_config)
        parent = self.client.service_path(project_id, service_id)
        slo_json = SSM.build_slo(window, slo_config)
        slo_id = SSM.build_slo_id(window, slo_config)
        slo = self.client.create_service_level_objective(
            parent, slo_json, service_level_objective_id=slo_id)
        return SSM.to_json(slo)

    @staticmethod
    def build_slo(window, slo_config):
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
        description = slo_config['slo_description']
        target = slo_config['slo_target']
        minutes, _ = divmod(window, 60)
        hours, _ = divmod(minutes, 60)
        display_name = f'{description} ({hours}h)'
        slo = {
            'display_name': display_name,
            'goal': target,
            'rolling_period': {
                'seconds': window
            }
        }
        filter_valid = measurement.get('filter_valid', "")
        if method == 'basic':
            methods = measurement.get('methods', [])
            locations = measurement.get('locations', [])
            versions = measurement.get('versions', [])
            threshold = measurement.get('threshold_latency')
            slo['service_level_indicator'] = {
                'basic_sli': {
                    'method': methods,
                    'location': locations,
                    'version': versions
                }
            }
            if threshold:
                slo['service_level_indicator']['basicSli']['latency'] = {
                    'threshold': threshold
                }
            else:
                slo['service_level_indicator']['basicSli']['availability'] = {}

        elif method == 'good_bad_ratio':
            filter_good = measurement.get('filter_good', "")
            filter_bad = measurement.get('filter_bad', "")
            slo['service_level_indicator'] = {
                'request_based': {
                    'good_total_ratio': {
                        # 'totalServiceFilter': filter_valid,
                        # 'goodServiceFilter': filter_good,
                        # 'badServiceFilter': filter_bad
                    }
                }
            }
            if filter_good:
                slo['service_level_indicator']['request_based'][
                    'good_total_ratio']['good_service_filter'] = filter_good
            if filter_bad:
                slo['service_level_indicator']['request_based'][
                    'good_total_ratio']['bad_service_filter'] = filter_bad
            if filter_valid:
                slo['service_level_indicator']['request_based'][
                    'good_total_ratio']['total_service_filter'] = filter_valid

        elif method == 'distribution_cut':
            range_min = measurement.get('range_min', 0)
            range_max = measurement['range_max']

            slo['service_level_indicator'] = {
                'request_based': {
                    'distribution_cut': {
                        'distribution_filter': filter_valid,
                        'range': {
                            'max': float(range_max)
                        }
                    }
                }
            }
            if range_min != 0:
                slo['service_level_indicator']['request_based'][
                    'distribution_cut']['range']['min'] = float(range_min)

        elif method == 'windows':
            filter = measurement.get('filter')
            # threshold = conf.get('threshold')
            # mean_in_range = conf.get('filter')
            # sum_in_range = conf.get('filter')
            slo['service_level_indicator'] = {
                'windows_based': {
                    'window_period': window,
                    'good_bad_metric_filter': filter,
                    # 'good_total_ratio_threshold': {
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

    @staticmethod
    def build_slo_id(window, slo_config, full=False):
        """Build SLO id from SLO configuration.

        Args:
            slo_config (dict): SLO configuration.
            full (bool): If True, return full resource id including project.

        Returns:
            str: SLO id.
        """
        project_id = slo_config['backend']['project_id']
        service_id = SSM.build_service_id(slo_config)
        if 'slo_id' in slo_config:
            slo_id_part = slo_config['slo_id']
            slo_id = f'{slo_id_part}-{window}'
        else:
            slo_name = slo_config['slo_name']
            slo_id = f'{slo_name}-{window}'
        if full:
            service_url = f'projects/{project_id}/services/{service_id}'
            return f'{service_url}/serviceLevelObjectives/{slo_id}'
        return slo_id

    def get_slo(self, window, slo_config):
        """Get SLO object from Stackriver Service Monitoring API.

        Args:
            service_id (str): Service identifier.
            window (int): Window in seconds.
            slo_config (dict): SLO config.

        Returns:
            dict: API response.
        """
        service_name = slo_config['service_name']
        service_id = SSM.build_service_id(slo_config)
        LOGGER.debug(f'Getting SLO for service "{service_name}" ...')
        slos = self.list_slos(service_id, slo_config)
        slo_local_id = SSM.build_slo_id(window, slo_config)
        slo_json = SSM.build_slo(window, slo_config)

        # Our local JSON is in snake case, convert it to Caml case.
        # The rollingPeriod field is in Duration format, convert it.
        slo_json = dict_snake_to_caml(slo_json)
        if 'rollingPeriod' in slo_json:
            slo_json['rollingPeriod'] = str(
                slo_json['rollingPeriod']['seconds']) + 's'

        # Loop through API response to find an existing SLO that corresponds to
        # our configuration.
        for slo in slos:
            slo_remote_id = slo['name'].split("/")[-1]
            equal = slo_remote_id == slo_local_id
            if equal:
                LOGGER.debug(f'Found existing SLO "{slo_remote_id}".')
                LOGGER.debug(f'SLO object: {slo}')
                strict_equal = SSM.compare_slo(slo, slo_json)
                if strict_equal:
                    return slo
                return self.update_slo(window, slo_config)
        LOGGER.warning('No SLO found matching configuration.')
        LOGGER.debug(f'SLOs from Stackdriver Monitoring API: {slos}')
        LOGGER.debug(f'SLO config converted: {slo_json}')
        return None

    def update_slo(self, window, slo_config):
        """Update an existing SLO.

        Args:
            window (int): Window (in seconds)
            slo_config (dict): SLO configuration.

        Returns:
            dict: API response.
        """
        slo_json = SSM.build_slo(window, slo_config)
        slo_id = SSM.build_slo_id(window, slo_config, full=True)
        LOGGER.warning(f"Updating SLO {slo_id} ...")
        slo_json['name'] = slo_id
        return SSM.to_json(
            self.client.update_service_level_objective(slo_json))

    @staticmethod
    def compare_slo(slo1, slo2):
        """Compares 2 SLO configurations to see if they correspond to the same
        SLO.

        An SLO is deemed the same if the whole configuration is similar, except
        for the `goal` field that should be adjustable.

        Args:
            slo1 (dict): Service Monitoring API SLO configuration to compare.
            slo2 (dict): Service Monitoring API SLO configuration to compare.

        Returns:
            bool: True if the SLOs match, False otherwise.
        """
        exclude_keys = ["name"]
        slo1_copy = {k: v for k, v in slo1.items() if k not in exclude_keys}
        slo2_copy = {k: v for k, v in slo2.items() if k not in exclude_keys}
        local_json = json.dumps(slo1_copy, sort_keys=True)
        remote_json = json.dumps(slo2_copy, sort_keys=True)
        # LOGGER.info("----------")
        # LOGGER.info(local_json)
        # LOGGER.info("----------")
        # LOGGER.info(remote_json)
        # LOGGER.info("----------")
        # LOGGER.info(SSM.string_diff(local_json, remote_json))
        return local_json == remote_json

    @staticmethod
    def string_diff(string1, string2):
        """Diff 2 strings. Used to print comparison of JSONs for debugging.

        Args:
            string1 (str): String 1.
            string2 (str): String 2.
        """
        for idx, string in enumerate(difflib.ndiff(string1, string2)):
            if string[0] == ' ':
                continue
            if string[0] == '-':
                print(u'Delete "{}" from position {}'.format(string[-1], idx))
            elif string[0] == '+':
                print(u'Add "{}" to position {}'.format(string[-1], idx))
        print()

    def list_slos(self, service_id, slo_config):
        """List all SLOs from Stackdriver Service Monitoring API.

        Args:
            service_id (str): Service identifier.
            slo_config (dict): SLO configuration.

        Returns:
            dict: API response.
        """
        project_id = slo_config['backend']['project_id']
        parent = self.client.service_path(project_id, service_id)
        slos = self.client.list_service_level_objectives(parent)
        slos = list(slos)
        LOGGER.debug(f"{len(slos)} SLOs found in Service Monitoring API.")
        # LOGGER.debug(slos)
        return [SSM.to_json(slo) for slo in slos]

    def delete_slo(self, window, slo_config):
        """Delete SLO from Stackdriver Monitoring API.

        Args:
            window (int): Window (in seconds).
            slo_config: SLO configuration.

        Returns:
            dict: API response.
        """
        slo_id = SSM.build_slo_id(window, slo_config, full=True)
        LOGGER.info(f'Deleting SLO {slo_id}')
        try:
            return self.client.delete_service_level_objective(slo_id)
        except google.api_core.exceptions.NotFound:
            LOGGER.warning(
                f'SLO {slo_id} does not exist in Service Monitoring API. '
                f'Skipping.')
            return None

    @staticmethod
    def to_json(response):
        """Convert a Stackdriver Service Monitoring API response to JSON
        format.

        Args:
            response (obj): Response object.

        Returns:
            dict: Response object serialized as JSON.
        """
        return json.loads(MessageToJson(response))


SSM = StackdriverServiceMonitoringBackend
