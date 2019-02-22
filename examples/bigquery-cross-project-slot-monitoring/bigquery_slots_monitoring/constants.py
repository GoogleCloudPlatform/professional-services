# Copyright 2018 Google Inc.
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

"""Constants mapping metrics to monitor."""

# Please do not modify unless you know what you aredoing.

# Custom metrics to create.
# Metrics from different projects will be added to custom metrics
# on the Stackdriver account specified.
CUSTOM_METRICS_MAP = {
    'custom.googleapis.com/bigquery/slots/allocated_for_project': {
        'metricKind': 'GAUGE',
        'valueType': 'INT64',
    },
}

# Map source metric to custom metric.
# Custom metirc must also exist in CUSTOM_METRICS_MAP.
SOURCE_TO_CUSTOM_MAP = {
    'bigquery.googleapis.com/slots/allocated_for_project':
        'custom.googleapis.com/bigquery/slots/allocated_for_project',
}

# You probably don't want to change this, unless this was changed on
# Stackdriver end.
CUSTOM_METRICS_PREFIX = 'custom.googleapis.com/'
