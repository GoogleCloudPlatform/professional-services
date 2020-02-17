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
import os

import google.api_core.exceptions
from google.cloud.monitoring_v3 import ServiceMonitoringServiceClient
from google.protobuf.json_format import MessageToJson

from slo_generator.backends.stackdriver import StackdriverBackend
from slo_generator.utils import dict_snake_to_caml

LOGGER = logging.getLogger(__name__)

SID_GAE = 'gae:{project_id}_{module_id}'
SID_CLOUD_ENDPOINT = 'ist:{project_id}-{service}'
SID_CLUSTER_ISTIO = (
    'ist:{project_id}-zone-{location}-{cluster_name}-{service_namespace}-'
    '{service_name}')
SID_MESH_ISTIO = ('ist:{mesh_uid}-{service_namespace}-{service_name}')


class StackdriverServiceMonitoringBackend:
    """Stackdriver Service Monitoring backend class.

    Args:
        project_id (str): Stackdriver host project id.
        client (google.cloud.monitoring_v3.ServiceMonitoringServiceClient):
            Existing Service Monitoring API client. Initialize a new client if
            omitted.
    """

    def __init__(self, project_id, client=None):
        self.project_id = project_id
        self.client = client
        if client is None:
            self.client = ServiceMonitoringServiceClient()
        self.parent = self.client.project_path(project_id)
        self.workspace_path = f'workspaces/{project_id}'
        self.project_path = f'projects/{project_id}'

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
        """Distribution cut method.

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
        metric_filter = SSM.build_slo_id(window, slo_config, full=True)
        filter = f"select_slo_counts(\"{metric_filter}\")"

        # Query SLO timeseries
        stackdriver = StackdriverBackend(self.project_id)
        timeseries = stackdriver.query(timestamp,
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

    def create_service(self, slo_config):
        """Create Service object in Stackdriver Service Monitoring API.

        Args:
            slo_config (dict): SLO configuration.

        Returns:
            dict: Stackdriver Service Monitoring API response.
        """
        LOGGER.debug("Creating service ...")
        service_json = SSM.build_service(slo_config)
        service_id = SSM.build_service_id(slo_config)
        service = self.client.create_service(self.project_path,
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

        # Look for API services in workspace matching our config.
        service_id = SSM.build_service_id(slo_config)
        services = list(self.client.list_services(self.workspace_path))
        matches = [
            service for service in services
            if service.name.split("/")[-1] == service_id
        ]

        # If no match is found for our service name in the API, raise an
        # exception if the service should have been auto-added (method 'basic'),
        # else output a warning message.
        if not matches:
            msg = (f'Service "{service_id}" does not exist in '
                   f'workspace "{self.project_id}"')
            method = slo_config['backend']['method']
            if method == 'basic':
                sids = [service.name.split("/")[-1] for service in services]
                LOGGER.debug(
                    f'List of services in workspace {self.project_id}: {sids}')
                LOGGER.error(msg)
                raise Exception(msg)
            LOGGER.error(msg)
            return None

        # Match found in API, return it.
        service = matches[0]
        LOGGER.debug(f'Found matching service "{service.name}"')
        return SSM.to_json(service)

    @staticmethod
    def build_service(slo_config):
        """Build service JSON in Stackdriver Monitoring API from SLO
        configuration.

        Args:
            slo_config (dict): SLO configuration.

        Returns:
            dict: Service JSON in Stackdriver Monitoring API.
        """
        service_id = SSM.build_service_id(slo_config)
        display_name = slo_config.get('service_display_name', service_id)
        service = {'display_name': display_name, 'custom': {}}
        return service

    @staticmethod
    def build_service_id(slo_config, dest_project_id=None, full=False):
        """Build service id from SLO configuration.

        Args:
            slo_config (dict): SLO configuration.
            dest_project_id (str, optional): Project id for service if different
                than the workspace project id.
            full (bool): If True, return full service resource id including
                project path.

        Returns:
            str: Service id.
        """
        service_name = slo_config['service_name']
        feature_name = slo_config['feature_name']
        backend = slo_config['backend']
        project_id = backend['project_id']
        measurement = backend['measurement']
        app_engine = measurement.get('app_engine')
        cluster_istio = measurement.get('cluster_istio')
        mesh_istio = measurement.get('mesh_istio')
        cloud_endpoints = measurement.get('cloud_endpoints')

        # Use auto-generated ids for 'custom' SLOs, use system-generated ids
        # for all other types of SLOs.
        if app_engine:
            service_id = SID_GAE.format_map(app_engine)
            dest_project_id = app_engine['project_id']
        elif cluster_istio:
            service_id = SID_CLUSTER_ISTIO.format_map(cluster_istio)
            dest_project_id = cluster_istio['project_id']
        elif mesh_istio:
            service_id = SID_MESH_ISTIO.format_map(mesh_istio)
        elif cloud_endpoints:
            service_id = SID_CLOUD_ENDPOINT.format_map(cloud_endpoints)
            dest_project_id = cluster_istio['project_id']
        else:
            service_id = f'{service_name}-{feature_name}'

        if full:
            if dest_project_id:
                return f'projects/{dest_project_id}/services/{service_id}'
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
        slo_json = SSM.build_slo(window, slo_config)
        slo_id = SSM.build_slo_id(window, slo_config)
        parent = SSM.build_service_id(slo_config, full=True)
        slo = self.client.create_service_level_objective(
            parent, slo_json, service_level_objective_id=slo_id)
        return SSM.to_json(slo)

    @staticmethod
    def build_slo(window, slo_config):  # pylint: disable=R0912,R0915
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
            methods = measurement.get('method', [])
            locations = measurement.get('location', [])
            versions = measurement.get('version', [])
            threshold = measurement.get('latency', {}).get('threshold')
            slo['service_level_indicator'] = {'basic_sli': {}}
            basic_sli = slo['service_level_indicator']['basic_sli']
            if methods:
                basic_sli['method'] = methods
            if locations:
                basic_sli['location'] = locations
            if versions:
                basic_sli['version'] = versions
            if threshold:
                basic_sli['latency'] = {
                    'threshold': {
                        'seconds': 0,
                        'nanos': int(threshold) * 10**6
                    }
                }
            else:
                basic_sli['availability'] = {}

        elif method == 'good_bad_ratio':
            filter_good = measurement.get('filter_good', "")
            filter_bad = measurement.get('filter_bad', "")
            slo['service_level_indicator'] = {
                'request_based': {
                    'good_total_ratio': {}
                }
            }
            sli = slo['service_level_indicator']
            ratio = sli['request_based']['good_total_ratio']
            if filter_good:
                ratio['good_service_filter'] = filter_good
            if filter_bad:
                ratio['bad_service_filter'] = filter_bad
            if filter_valid:
                ratio['total_service_filter'] = filter_valid

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
            sli = slo['service_level_indicator']['request_based']
            if range_min != 0:
                sli['distribution_cut']['range']['min'] = float(range_min)

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

    def get_slo(self, window, slo_config):
        """Get SLO object from Stackriver Service Monitoring API.

        Args:
            service_id (str): Service identifier.
            window (int): Window in seconds.
            slo_config (dict): SLO config.

        Returns:
            dict: API response.
        """
        service_path = SSM.build_service_id(slo_config, full=True)
        LOGGER.debug(f'Getting SLO for for "{service_path}" ...')
        slos = self.list_slos(service_path)
        slo_local_id = SSM.build_slo_id(window, slo_config)
        slo_json = SSM.build_slo(window, slo_config)
        slo_json = SSM.convert_slo_to_ssm_format(slo_json)

        # Loop through API response to find an existing SLO that corresponds to
        # our configuration.
        for slo in slos:
            slo_remote_id = slo['name'].split("/")[-1]
            equal = slo_remote_id == slo_local_id
            if equal:
                LOGGER.debug(f'Found existing SLO "{slo_remote_id}".')
                LOGGER.debug(f'SLO object: {slo}')
                strict_equal = SSM.compare_slo(slo_json, slo)
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
        return SSM.to_json(self.client.update_service_level_objective(slo_json))

    def list_slos(self, service_path):
        """List all SLOs from Stackdriver Service Monitoring API.

        Args:
            service_path (str): Service path in the form
                'projects/{project_id}/services/{service_id}'.
            slo_config (dict): SLO configuration.

        Returns:
            dict: API response.
        """
        slos = self.client.list_service_level_objectives(service_path)
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
        slo_path = SSM.build_slo_id(window, slo_config, full=True)
        LOGGER.info(f'Deleting SLO "{slo_path}"')
        try:
            return self.client.delete_service_level_objective(slo_path)
        except google.api_core.exceptions.NotFound:
            LOGGER.warning(
                f'SLO "{slo_path}" does not exist in Service Monitoring API. '
                f'Skipping.')
            return None

    @staticmethod
    def build_slo_id(window, slo_config, full=False):
        """Build SLO id from SLO configuration.

        Args:
            slo_config (dict): SLO configuration.
            full (bool): If True, return full resource id including project.

        Returns:
            str: SLO id.
        """
        if 'slo_id' in slo_config:
            slo_id_part = slo_config['slo_id']
            slo_id = f'{slo_id_part}-{window}'
        else:
            slo_name = slo_config['slo_name']
            slo_id = f'{slo_name}-{window}'
        if full:
            service_path = SSM.build_service_id(slo_config, full=True)
            return f'{service_path}/serviceLevelObjectives/{slo_id}'
        return slo_id

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
        if os.environ.get('DEBUG') == '2':
            LOGGER.info("----------")
            LOGGER.info(local_json)
            LOGGER.info("----------")
            LOGGER.info(remote_json)
            LOGGER.info("----------")
            LOGGER.info(SSM.string_diff(local_json, remote_json))
        return local_json == remote_json

    @staticmethod
    def string_diff(string1, string2):
        """Diff 2 strings. Used to print comparison of JSONs for debugging.

        Args:
            string1 (str): String 1.
            string2 (str): String 2.

        Returns:
            list: List of messages pointing out differences.
        """
        lines = []
        for idx, string in enumerate(difflib.ndiff(string1, string2)):
            if string[0] == ' ':
                continue
            if string[0] == '-':
                info = u'Delete "{}" from position {}'.format(string[-1], idx)
                lines.append(info)
            elif string[0] == '+':
                info = u'Add "{}" to position {}'.format(string[-1], idx)
                lines.append(info)
        return lines

    @staticmethod
    def convert_slo_to_ssm_format(slo):
        """Convert SLO JSON to Service Monitoring API format.
        Address edge cases, like `duration` object computation.

        Args:
            slo (dict): SLO JSON object to be converted to Stackdriver Service
                Monitoring API format.

        Returns:
            dict: SLO configuration in Service Monitoring API format.
        """
        # Our local JSON is in snake case, convert it to Caml case.
        data = dict_snake_to_caml(slo)

        # The `rollingPeriod` field is in Duration format, convert it.
        try:
            period = data['rollingPeriod']
            data['rollingPeriod'] = SSM.convert_duration_to_string(period)
        except KeyError:
            pass

        # The `latency` field is in Duration format, convert it.
        try:
            latency = data['serviceLevelIndicator']['basicSli']['latency']
            threshold = latency['threshold']
            latency['threshold'] = SSM.convert_duration_to_string(threshold)
        except KeyError:
            pass

        return data

    @staticmethod
    def convert_duration_to_string(duration):
        """Convert a duration object to a duration string (in seconds).

        Args:
            duration (dict): Duration dictionary.

        Returns:
            str: Duration string.
        """
        duration_seconds = 0.000
        if 'seconds' in duration:
            duration_seconds += duration['seconds']
        if 'nanos' in duration:
            duration_seconds += duration['nanos'] * 10**(-9)
        if duration_seconds.is_integer():
            duration_str = int(duration_seconds)
        else:
            duration_str = "{:0.3f}".format(duration_seconds)
        return str(duration_str) + 's'

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
