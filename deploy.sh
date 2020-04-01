# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#deploy cf and create a job in scheduler
CF_NAME="reporting-cloud-function"
CS_NAME="reporting-cloud-scheduler"
TOPIC_NAME="bq-exports"
PROJECT_ID="report-scheduling"
TOPIC_PATH="projects/${PROJECT_ID}/topics/bq-exports"
SCHEDULE="26 17 27 3 *"

gcloud functions deploy "$CF_NAME" --entry-point=main --trigger-topic "$TOPIC_NAME" --runtime python37 --memory "512MB" --service-account "$SVC_ACCOUNT_EMAIL" --project "$PROJECT_ID" --allow-unauthenticated --set-env-vars SVC_ACCOUNT_EMAIL="$SVC_ACCOUNT_EMAIL",SENDGRID_API_KEY="$SENDGRID_API_KEY"
gcloud scheduler jobs create pubsub "$CS_NAME" --schedule="$SCHEDULE" --topic="$TOPIC_PATH" --message-body="bqemail" --project="$PROJECT_ID"
