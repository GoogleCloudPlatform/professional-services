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

#make service account
SA_NAME="reporting-function-service-account"
SVC_DESC="The service account used by the reporting Cloud Function"
PROJECT_ID="my-project-id"
gcloud iam service-accounts create $SA_NAME --description "$SVC_DESC" --project "$PROJECT_ID"
export SVC_ACCOUNT_EMAIL=$(gcloud iam service-accounts list --filter="name:$SA_NAME" --format "value(email)")

#todo: isolate required roles/permissions instead of editor
gcloud iam service-accounts add-iam-policy-binding $SVC_ACCOUNT_EMAIL --member="serviceAccount:$SVC_ACCOUNT_EMAIL" --role='roles/editor' --project "$PROJECT_ID"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SVC_ACCOUNT_EMAIL" --role='roles/editor'
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SVC_ACCOUNT_EMAIL" --role='roles/iam.serviceAccountTokenCreator'
