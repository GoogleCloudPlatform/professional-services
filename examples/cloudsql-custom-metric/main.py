#!/usr/bin/env python

# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This code is a prototype and not engineered for production use.
# Error handling is incomplete or inappropriate for usage beyond
# a development sample.

import argparse
from datetime import datetime, timedelta, timezone
import time
import functools
import logging
import sys
import os
from urllib3.exceptions import HTTPError

from googleapiclient import discovery
from googleapiclient.errors import HttpError
import google.auth
import google.cloud.logging


ZONAL_INCREMENT = os.getenv('ZONAL_INCREMENT', 1)

REGIONAL_INCREMENT = os.getenv('REGIONAL_INCREMENT', 1)

TABLE_ID = "{0}.{1}.{2}"

TABLE_NAME = "cloudaudit_googleapis_com_activity_{0}"

CREATED_QUERY = ("""#standardSQL
WITH
  created AS (
  SELECT
    MAX(resource.labels.project_id) as project_id,
    resource.labels.database_id as database_id,
    MAX(timestamp) as timestamp
  FROM
    `kdevensen-cloud-sql.cloud_sql_sink.cloudaudit_googleapis_com_activity_*`
  WHERE
    protopayload_auditlog.methodName = "cloudsql.instances.create"
    AND JSON_EXTRACT(protopayload_auditlog.requestJson,
      '$.resource.settings.ipConfiguration.privateNetwork') IS NOT NULL
  GROUP BY
    resource.labels.database_id),
  deleted AS (
  SELECT
    resource.labels.database_id,
    MAX(resource.labels.project_id) AS project_id,
    MAX(timestamp) AS timestamp
  FROM
    `kdevensen-cloud-sql.cloud_sql_sink.cloudaudit_googleapis_com_activity_*`
  WHERE
    protopayload_auditlog.methodName = "cloudsql.instances.delete"
  GROUP BY
    resource.labels.database_id,
    resource.labels.project_id)
SELECT
  created.project_id,
  created.database_id
FROM
  created
LEFT OUTER JOIN
  deleted
ON
  deleted.database_id = created.database_id
  AND deleted.project_id = created.project_id
WHERE
  ((deleted.timestamp > created.timestamp
      AND deleted.timestamp > TIMESTAMP_ADD(CURRENT_TIMESTAMP(),
        INTERVAL -5 DAY))
    OR deleted.timestamp IS NULL)
LIMIT
  1000""")

cloud_logger = logging.getLogger("cloudLogger")


def credentials():
    credentials, project = google.auth.default(
        scopes=['https://www.googleapis.com/auth/cloud-platform',
                'https://www.googleapis.com/auth/sqlservice.admin'])
    return credentials


def cloudsql_service():
    return discovery.build('sqladmin', 'v1beta4', credentials=credentials())


def bigquery_service():
    return discovery.build('bigquery', 'v2', credentials=credentials())


def monitoring_service():
    return discovery.build('monitoring', 'v3', credentials=credentials())


class InfoFilter(logging.Filter):
    def filter(self, rec):
        return rec.levelno in (logging.DEBUG, logging.INFO)


def setup_logging(in_gcp):
    # Instantiates a client
    if in_gcp:
        client = google.cloud.logging.Client()
    cloud_logger.setLevel(logging.DEBUG)

    std_handler = logging.StreamHandler(sys.stdout)
    std_handler.setLevel(logging.DEBUG)
    std_handler.addFilter(InfoFilter())

    err_handler = logging.StreamHandler()
    err_handler.setLevel(logging.WARN)

    cloud_logger.addHandler(std_handler)
    cloud_logger.addHandler(err_handler)


def logged(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        func_name = func.__name__
        cloud_logger.debug("started '{0}'".format(func_name))
        result = func(*args, **kwargs)
        cloud_logger.debug("finished '{0}'".format(func_name))
        return result

    return wrapper


def monitoring_client():
    """Obtain the monitoring client

    Returns:
        monitoring_v3.MetricServiceClient: Monitoring Client.
    """
    return google.cloud.monitoring_v3.MetricServiceClient()


@logged
def bigquery_make_query(project_id, query, location):
    responses = []
    query_struct = dict(location=location, query=query)

    cloud_logger.debug("-----BEGIN BigQuery QUERY STRING-----")
    cloud_logger.debug(query)
    cloud_logger.debug("-----BEGIN BigQuery QUERY STRING-----")
    request = bigquery_service().jobs().query(projectId=project_id,
                                              body=query_struct)
    while request is not None:
        response = request.execute()
        responses.append(response)
        request = bigquery_service().jobs().list_next(
            previous_request=request,
            previous_response=response)

    cloud_logger.debug("-----BEGIN BigQuery QUERY RESPONSE-----")
    cloud_logger.debug(response['rows'])
    cloud_logger.debug("-----BEGIN BigQuery QUERY RESPONSE-----")

    return response['rows']


class CloudSqlInstance(object):
    def __init__(self, name, project_id, region,
                 private_network, availability, replicas):
        self.name = name
        self.project_id = project_id
        self.region = region
        self.private_network = private_network
        self.availability = availability
        self.replicas = replicas

    @property
    def count(self):
        count = 0
        if self.availability == "REGIONAL":
            count = int(REGIONAL_INCREMENT)
        else:
            count = int(ZONAL_INCREMENT)

        count = count + len(self.replicas)

        return count

    @property
    def timeseries(self):
        local_time = datetime.now(timezone.utc).astimezone()
        point = dict(
            interval=dict(
                endTime=str(local_time.isoformat())
            ),
            value=dict(
                int64Value=self.count
            )
        )

        series = dict(
            metric=dict(
                type='custom.googleapis.com/cloudsql_private_ip_count'),
            resource=dict(
                type='generic_node',
                labels=dict(
                    location=self.region,
                    node_id=self.name,
                    project_id=self.project_id,
                    namespace=self.private_network
                )
            ),
            points=[point]
        )

        return series


@logged
def parse_cloudsql_response(response):
    cloudsql_instance = None
    if 'masterInstanceName' not in response.keys():
        replicas = []
        name = response['name']
        project = response['project']
        region = response['region']
        availability = response['settings']['availabilityType']
        private_network = \
            response['settings']['ipConfiguration']['privateNetwork']
        if 'replicaNames' in response.keys():
            replicas = response['replicaNames']
        cloudsql_instance = CloudSqlInstance(
                    name,
                    project,
                    region,
                    private_network,
                    availability,
                    replicas)

    return cloudsql_instance


@logged
def get_cloudsql_instance(project, instance):
    request = cloudsql_service().instances().get(project=project,
                                                 instance=instance)
    response = request.execute()
    parsed_response = parse_cloudsql_response(response)
    return parsed_response


@logged
def get_cloudsql_instances(projects_to_search):

    instances = []
    for project, instance_list in projects_to_search.items():
        for instance in instance_list:
            cloudsql_instance = get_cloudsql_instance(project, instance)
            if cloudsql_instance:
                instances.append(cloudsql_instance)

    return instances


@logged
def get_projects_to_search(project_id, dataset_name, location, all):
    projects_to_search = {}
    now = '*'
    if not all:
        now = datetime.utcnow().strftime("%Y%m%d")
    table_name = TABLE_NAME.format(now)
    table_id = TABLE_ID.format(project_id, dataset_name, table_name)
    created_query = CREATED_QUERY.format(table_id)
    created_query_result = bigquery_make_query(project_id,
                                               created_query,
                                               location)
    for row in created_query_result:
        project = row['f'][0]['v']
        database = row['f'][1]['v']
        if project not in projects_to_search.keys():
            projects_to_search[project] = []
        projects_to_search[project].append(database.split(':')[1])
    return projects_to_search


@logged
def create_metric_descriptor(project_id):
    project_name = 'projects/' + project_id
    descriptor = dict(
        type='custom.googleapis.com/cloudsql_private_ip_count',
        name='generic_node',
        displayName='Cloud SQL IP Count',
        metricKind='GAUGE',
        valueType='INT64',
        description='Count number of IP\'s consumed \
        by Private CloudSQL'
    )
    request = monitoring_service().projects(). \
        metricDescriptors().create(name=project_name, body=descriptor)
    response = request.execute()


@logged
def log_result(instances):
    for instance in instances:
        log_string = "{0} | {1} | {2} | {3} | {4}".format(
            instance.project_id,
            instance.name,
            instance.region,
            instance.private_network,
            instance.count)
        cloud_logger.debug(log_string)


@logged
def post(project_id, timeseries):

    try:
        project_name = 'projects/' + project_id
        request = monitoring_service().projects().timeSeries().create(
            name=project_name,
            body=dict(timeSeries=timeseries))
        response = request.execute()
        cloud_logger.debug("length of timeseries: %d",
                           len(timeseries))
    except google.api_core.exceptions.InvalidArgument:
        cloud_logger.exception("unable to create timeseries")


@logged
def main(project_id, dataset_name, all, location, in_gcp):

    setup_logging(in_gcp)
    # The first step is to get from BigQuery the projects and CloudSQL
    # instances that are in the private network.
    projects = get_projects_to_search(project_id, dataset_name, location, all)

    # The next step is to get from the CloudSQL admin API, the
    # instance information.
    instances = get_cloudsql_instances(projects)
    log_result(instances)

    # Third, we extract all the timeseries from the CloudSqlInstance
    # objects
    timeseries = [instance.timeseries for instance in instances]

    # Finally, we post the timeseries
    create_metric_descriptor(project_id)
    post(project_id, timeseries)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Query BigQuery for \
        Private CloudSQL Instances')
    parser.add_argument('--project_id',
                        help='Project ID of the project \
                              containing the BigQuery dataset',
                        type=str,
                        required=True)
    parser.add_argument('--dataset',
                        help='Dataset Name',
                        type=str,
                        required=True)
    parser.add_argument('--location',
                        help='Dataset Location',
                        default="US",
                        type=str)
    parser.add_argument('--all',
                        action='store_true',
                        help='Query All Tables, Default is just \
                            today\'s table')
    parser.add_argument('--not-in-gcp',
                        action='store_true',
                        help='Is this running in GCP.  The \
                              default assumes it is.')

    args = parser.parse_args()
    main(args.project_id,
         args.dataset,
         args.all,
         args.location,
         not args.not_in_gcp)
