#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Copyright 2019 Google LLC
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

from datetime import datetime, timedelta
from google.cloud import bigquery
import argparse
import json
import sys


class BQQueryPlanExporter(object):
    def __init__(self, project=None, location='US'):
        self.project = project
        self.location = location
        self.bq = None

    def get_client(self):
        if self.bq is None:
            self.bq = bigquery.Client(project=self.project,
                                      location=self.location)
        return self.bq

    def get_jobs(self, start_days_ago, end_days_ago):
        c = self.get_client()
        dt0 = datetime.utcnow() - timedelta(start_days_ago)
        dt1 = datetime.utcnow() - timedelta(end_days_ago)
        return [job._properties for job in c.list_jobs(all_users = True,
                                                       min_creation_time=dt0,
                                                       max_creation_time=dt1)
                if hasattr(job, 'query_plan')]


def main():
    parser = argparse.ArgumentParser(
        description='Export BigQuery Query Plans.')
    parser.add_argument('--project',
        type=str, default=None, nargs='?', help='project id')
    parser.add_argument('--location',
        type=str, default='US', nargs='?', help='BigQuery location')
    parser.add_argument('--start_days_ago',
        type=int, default=3, nargs='?', help='max days since query')
    parser.add_argument('--end_days_ago',
        type=int, default=0, nargs='?', help='min days since query')
    args = parser.parse_args()
    if args.project == '':
        parser.print_help()
        print("Prints job statistics between start_days_ago and end_days_ago")
        sys.exit(1)
    bq = BQQueryPlanExporter(project=args.project, location=args.location)
    for job in bq.get_jobs(start_days_ago=args.start_days_ago,
                           end_days_ago=args.end_days_ago):
        print(json.dumps(job))


if __name__ == '__main__':
    main()
