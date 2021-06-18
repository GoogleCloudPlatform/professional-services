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
`service_monitoring.py`
Cloud Service Monitoring exporter class.
"""
import json
import logging
import os

from google.cloud.monitoring_v3 import ServiceMonitoringServiceClient, types

from .utils import decorate_with, to_json  # pylint: disable=W0611

LOGGER = logging.getLogger(__name__)


@decorate_with(to_json,
               methods={
                   'get_service', 'create_service', 'update_service',
                   'list_services', 'delete_service', 'get_slo', 'create_slo',
                   'update_slo', 'list_slos', 'delete_slo'
               })
class ServiceMonitoringClient:
    """Client for Cloud Service Monitoring.

    Args:
        project_id (str): Cloud host project id.
    """

    def __init__(self, project_id):
        self.client = ServiceMonitoringServiceClient()
        self.project_id = project_id
        self.project = f'projects/{project_id}'
        self.workspace = f'workspaces/{project_id}'

    def create_service(self, service_id, service_config):
        """Create Service object in Cloud Service Monitoring API.

        Args:
            service_id (str): Service id.
            service_config (dict): Service config.
            service_config (str): Service config path.

        Returns:
            dict: Cloud Service Monitoring API response.
        """
        return self.client.create_service(parent=self.project,
                                          service=types.Service(service_config),
                                          service_id=service_id)

    def get_service(self, service_id):
        """Get Service object in Cloud Service Monitoring API.

        Args:
            service_id (str): Service id.

        Returns:
            dict: Cloud Service Monitoring API response.
        """
        service_path = self.build_service_path(service_id)
        return self.client.get_service(name=service_path)

    def delete_service(self, service_id):
        """Delete Service object in Cloud Service Monitoring API.

        Args:
            service_id (str): Service id.

        Returns:
            dict: Cloud Service Monitoring API response.
        """
        service_path = self.build_service_path(service_id)
        return self.client.delete_service(name=service_path)

    def update_service(self, service_config):
        """Update Service object in Cloud Service Monitoring API.

        Args:
            service_config (dict): Service config.

        Returns:
            dict: Cloud Service Monitoring API response.
        """
        return self.client.update_service(service=types.Service(service_config))

    def list_services(self):
        """List Cloud Service Monitoring services in project.

        Returns:
            dict: Cloud Service Monitoring API response.
        """
        return self.client.list_services(parent=self.workspace)

    def create_slo(self, service_id, slo_id, slo_config):
        """Create SLO object in Cloud Service Monitoring API.

        Args:
            service_id (str): Cloud Service Monitoring Service id.
            slo_id (str): Cloud Service Monitoring SLO id.
            slo_config (dict): SLO config.
            slo_config (str): SLO config path.

        Returns:
            dict: Service Management API response.
        """
        slo_config = ServiceMonitoringClient._maybe_load(slo_config)
        parent = self.build_service_path(service_id)
        return self.client.create_service_level_objective(
            parent=parent,
            service_level_objective=types.ServiceLevelObjective(slo_config),
            service_level_objective_id=slo_id)

    def get_slo(self, service_id, slo_id):
        """Get SLO object from Cloud Service Monitoring API.

        Args:
            service_id (str): Service identifier.
            slo_id (str): Service Level Objectif identifier.

        Returns:
            dict: API response.
        """
        parent = self.build_slo_path(service_id, slo_id)
        return self.client.get_service_level_objective(name=parent)

    def update_slo(self, service_id, slo_id, slo_config):
        """Update an existing SLO.

        Args:
            service_id (str): Cloud Service Monitoring Service id.
            slo_id (str): Cloud Service Monitoring SLO id.
            slo_config (str | dict): SLO config path or dict.

        Returns:
            dict: API response.
        """
        slo_config = ServiceMonitoringClient._maybe_load(slo_config)
        slo_id = self.build_slo_path(service_id, slo_id)
        slo_config['name'] = slo_id
        return self.client.update_service_level_objective(
            service_level_objectives=types.ServiceLevelObjective(slo_config))

    def list_slos(self, service_id):
        """List all SLOs from Cloud Service Monitoring API.

        Args:
            service_path (str): Service path in the form
                'projects/{project_id}/services/{service_id}'.
            slo_config (dict): SLO configuration.

        Returns:
            dict: API response.
        """
        service_path = self.build_service_path(service_id)
        return self.client.list_service_level_objectives(parent=service_path)

    def delete_slo(self, service_id, slo_id):
        """Delete SLO from Cloud Monitoring API.

        Args:
            service_id (str): Cloud Service Monitoring Service id.
            slo_id (str): Cloud Service Monitoring SLO id.

        Returns:
            dict: API response.
        """
        slo_path = self.build_slo_path(service_id, slo_id)
        return self.client.delete_service_level_objective(name=slo_path)

    def build_service_path(self, service_id):
        """Build Service object path.

        Args:
            service_id (str): Cloud Service Monitoring Service id.

        Returns:
            str: Service full path.
        """
        return f'projects/{self.project_id}/services/{service_id}'

    def build_slo_path(self, service_id, slo_id):
        """Build SLO object path.

        Args:
            service_id (str): Cloud Service Monitoring Service id.
            slo_id (str): Cloud Service Monitoring SLO id.

        Returns:
            str: SLO full path.
        """
        service_path = self.build_service_path(service_id)
        return f'{service_path}/serviceLevelObjectives/{slo_id}'

    @staticmethod
    def _maybe_load(config):
        """Maybe load something from file.

        Args:
            config (dict): Config dict.
            config (str): Config filepath.

        Returns:
            dict: JSON config (loaded from file or from string)
        """
        if os.path.exists(config):
            with open(config) as cfg:
                config = json.load(cfg)
        else:
            config = json.loads(config)
        return config
