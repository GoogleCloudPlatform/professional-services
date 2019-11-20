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
#
# DESCRIPTION:
#
# This shell script prepares sample log data for testing a Cloud Function.
# Add in your Google Cloud Platform (GCP) specific values for project ID,
# zone, region and virtual machine (VM) instance ID. The sample log JSON
# string will be output into a file named prepared_log.json

project_id="wwb-assets-serverless";
zone="us-central1-a";
region="us-central1";
subnet="wwb-assets-serverless-subnet";
instance_id="5608139878076087787";

sed 's/${project_id}/'"${project_id}"'/g;s/${zone}/'"${zone}"\
'/g;s/${region}/'"${region}"'/g;s/${subnet}/'"${subnet}"\
'/g;s/${instance_id}/'"${instance_id}"'/g' sample_log.json > \
prepared_log.json;
