# -*- coding: utf-8 -*-

# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.cloud import monitoring_v3

import click

import datetime
import json
import os
import sys

parent = os.path.abspath('.')
sys.path.insert(1, parent)

from capacity_planner import CapacityPlanner  # noqa: E402


@click.command()
@click.option(
    '--project_id', required=True, type=str,
    help='GCP project ID where the Cloud Monitoring API is called against.')
@click.option(
    '--end_time', required=False, type=click.DateTime(['%Y-%m-%dT%H:%M:%S%z']),
    help='The end time in ISO 8601 format of the time interval for which \
          results should be returned. Default is now. \
          e.g. 2022-10-03T05:23:02+09:00')
@click.option(
    '--duration_minutes', required=False, type=int, default=360,
    help='The number of minutes in the time interval ending at the time \
          specified with --end_time. Default is 360 minutes (6 hours).')
@click.option(
    '--output', required=True, type=click.Path(dir_okay=False, writable=True),
    help='The file for writing the results out.')
def dump_query_result(project_id, end_time, duration_minutes, output):
    client = CapacityPlanner(project_id)

    if end_time is None:
        end_time = datetime.datetime.now(datetime.timezone.utc)

    name = f"projects/{project_id}"
    query = """fetch https_lb_rule
        | metric 'loadbalancing.googleapis.com/https/request_count'
        | align rate(1m)
        | every 1m
        | group_by [resource.region], [value_requst_count_aggregate: aggregate(value.request_count)]"""  # noqa: E501
    query = client._clean_query(query)
    query += client._build_within_filter(end_time, duration_minutes)
    request = monitoring_v3.QueryTimeSeriesRequest(name=name, query=query)

    try:
        result = client._qsc.query_time_series(request=request)
    except Exception as e:
        print("Error occured in query. %s", e)
    else:
        result_metadata = result._metadata
        result_response = monitoring_v3.QueryTimeSeriesResponse.to_dict(
            result._response)
        result_request = monitoring_v3.QueryTimeSeriesRequest.to_dict(
            result._request)

        data = {}
        data['metadata'] = result_metadata
        data['response'] = result_response
        data['request'] = result_request
        with open(output, 'w') as f:
            json.dump(data, f)


if __name__ == '__main__':
    dump_query_result()
