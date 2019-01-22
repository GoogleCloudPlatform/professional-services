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

"""Configuration file."""

# Stackdriver account Project ID. This is where all metrics will be written to.
PROJECT_ID = 'YOUR_PROJECT_ID'

# As of time of writing, slot reservation is linked to billing accounts, and
# consequently to the underlying project IDs. This means we want to monitor
# all projects using the billing account on which the slot reservation was made.
# This is done using Billing API.
BILLING_ACCOUNT = '123456-123456-123456'
