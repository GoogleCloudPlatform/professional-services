#!/usr/bin/env python3
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
The file contains the core services for this toolkit.
"""

from google.cloud import bigquery, monitoring_v3
from googleapiclient import discovery


class Services:
    bigquery = bigquery.Client()
    monitoring = monitoring_v3.MetricServiceClient()
    sts = discovery.build('storagetransfer', 'v1')
