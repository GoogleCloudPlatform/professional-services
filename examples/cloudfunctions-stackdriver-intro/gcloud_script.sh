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
# This shell script configures your Google Cloud Platform (GCP)
# project with resources for a Cloud Function demo
#
# Change the project_id variable so that your own GCP project ID is
# assigned Change the subnet variable so that your own Virtual Private
# Cloud (VPC) subnet is assigned

topic_name="serverless-topic";
sink_name="serverless-sink";
project_id="wwb-assets-serverless";
region="us-central1";
zone="us-central1-a";
subnet="wwb-assets-serverless-subnet";

# Set Environment
gcloud config set project "${project_id}";
gcloud config set compute/region "${region}";
gcloud config set compute/zone "${zone}";

# Create VMs
gcloud compute instances create instance-1 --subnet="${subnet}";
gcloud compute instances create instance-2 --subnet="${subnet}";

# Create Static IPs
gcloud compute addresses create static-ip-1 --region "${region}";
gcloud compute addresses create static-ip-2 --region "${region}";

# Create Pub/Sub Topic
gcloud pubsub topics create "${topic_name}";

# Create Stackdriver Logging Sink
gcloud logging sinks create "${sink_name}" \
pubsub.googleapis.com/projects/"${project_id}"/topics/"${topic_name}" \
--log-filter "resource.type="gce_instance" AND ("addAccessConfig") AND \
(NOT protoPayload.request.name="*")" 2> /tmp/sink_created.out;

logging_service_account=$(awk -F '`' '{print $2}' /tmp/sink_created.out);

# Grant Pub/Sub Publisher role on the above topic,
# to the logging service account
gcloud projects add-iam-policy-binding "${project_id}" \
--member ${logging_service_account} \
--role roles/pubsub.publisher;

# Create Cloud Function
# main.py must be in the directory where this gcloud command is run
gcloud --quiet functions deploy live_migrate_vm --runtime python37 \
--trigger-topic "${topic_name}";

# Add the project ID to the advanced filter for the Cloud Function
temp_file="$(mktemp)";
sed 's/${project_id}/'"${project_id}"'/g' \
advanced_filter_cloud_function_event.txt > $temp_file;
cat $temp_file > advanced_filter_cloud_function_event.txt;
rm -f $temp_file;
