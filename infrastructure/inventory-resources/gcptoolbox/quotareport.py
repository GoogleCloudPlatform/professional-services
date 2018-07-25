#!/usr/bin/env python

# Copyright 2017 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import sys
import json
import services
import logging
from googleapiclient.errors import HttpError
from datetime import datetime
import argparse
import logging

logger = logging.getLogger(__name__)


class QuotaReporter(object):
    """ Class for retrieving global and regional quotas for projects
    """

    def __init__(self, credentials=None):
        """ instance initialization

        Args:
            credentials (optional):  credentials object to authenticate with.
                Default is None and the default application credentials will be used.
        """
        self.compute = services.Compute(credentials=credentials)
        self.serviceManagement = services.ServiceManagement(credentials=credentials)
        self.cloudResourceManager = services.CloudResourceManager(credentials=credentials)

    def __update_quota_utilization(self, quotas):
        """ calculates a percent utilization for global_quotas

            Args:
                quotas: array of quotas containing limit and usage
        """
        for i, q in enumerate(quotas):
            utilization = 0 if q['limit'] == 0 else (q['usage'] / q['limit'])
            q.update({'utilization': utilization})
            quotas[i] = q
        return quotas


    def get_project_quotas(self, project_id):
        """ Gets the global and regional quotas for the specified projects

            Args:
                project_id: the project ID from which to retrieve global_quotas

            Returns:
                An array of objects in the form:

                 {"description":<global or region name>, "quotas":[<quota>]}

                Where a quota item is of the form
        """

        quotas = []

        if self.serviceManagement.is_service_enabled(project_id, 'compute.googleapis.com'):

            global_quotas = self.compute.get_project(
                project=project_id, fields='quotas')['quotas']
            global_quotas = self.__update_quota_utilization(global_quotas)
            quotas.append({"description": "global", "quotas": global_quotas})
            logger.info("Global quotas retrieved for " + project_id)

            for item in self.compute.list_project_regions(project=project_id,
                                                     fields='items(description,quotas)'):
                item['quotas'] = self.__update_quota_utilization(item['quotas'])
                quotas.append(item)
            logger.info("Regional quotas retrieved for " + project_id)

        else:
            logger.info(project_id + " does not use compute.googleapis.com")

        return quotas


    def iter_all_project_quotas(self):

        projects = self.cloudResourceManager.list_projects(
            filter="lifecycleState=ACTIVE", fields="projects/projectId")

        for project in projects:
            project_id = project['projectId']
            quotas = self.get_project_quotas(project_id)
            yield {'projectId':project_id, 'quotas': quotas}


class QuotaMetricRecorder(object):

    def __init__(self, monitoring_project_id, credentials = None):
        self.monitoring_project_id = monitoring_project_id
        self.monitoring = services.CloudMonitoring(credentials=credentials)
        # https://cloud.google.com/monitoring/api/resources#tag_global
        self.resource = {"type": "global", "labels": {"project_id": monitoring_project_id}}

        with open("quota_metric_descriptors.json") as json_data:
            self.metrics = json.load(json_data)

        for key in self.metrics.keys():
            try:
                metricDescriptor = self.monitoring.get_metric_descriptor(
                    self.monitoring_project_id, self.metrics[key]['type'])
            except HttpError as err:
                logging.warning(err)
                metricDescriptor = self.monitoring.create_metric_descriptor(
                    self.monitoring_project_id, self.metrics[key])


    def __create_time_series(self, labels, endTime, quota):
        usage_points = [
            {"interval": {"endTime": endTime},
             "value": {"int64Value": quota['usage']}}
        ]

        limit_points = [
            {"interval": {"endTime": endTime},
             "value": {"int64Value": quota['limit']}}
        ]

        utilizaton_points = [
            {"interval": {"endTime": endTime},
             "value": {"doubleValue": quota['utilization']}}
        ]

        self.monitoring.create_time_series(
            self.monitoring_project_id,
            {
                'timeSeries': [
                    {'metric': {'type': self.metrics['usage']['type'], 'labels': labels},
                     'resource': self.resource,
                     'points': usage_points},
                    {'metric': {'type': self.metrics['limit']['type'], 'labels': labels},
                     'resource': self.resource,
                     'points': limit_points},
                    {'metric': {'type': self.metrics['utilization']['type'], 'labels': labels},
                     'resource': self.resource,
                     'points': utilizaton_points}
                ]
            }
        )


    def record_project_quotas(self, project_id, project_quotas, endTime = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S-00:00")):

        for quotas in project_quotas:
            region = quotas["description"]
            for quota in quotas['quotas']:
                labels = {'region': region, 'metric': quota['metric'], 'project_id': project_id}
                self.__create_time_series(labels, endTime, quota)
