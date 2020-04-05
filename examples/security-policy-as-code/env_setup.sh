#!/bin/bash
# Copyright 2020 Google LLC
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

echo "Running setup script..."

project_name=$YOUR_MAIN_PROJECT
staging_project_name=$YOUR_STAGING_PROJECT
TF_ADMIN_BUCKET="$project_name-terraform-admin"
gcp_region="us-central1"

#######################################
# Enable required APIs in GCP project
# Globals:
#   None
# Arguments:
#   project
#######################################
function enable_apis() {
  gcloud services enable container.googleapis.com compute.googleapis.com cloudkms.googleapis.com cloudbuild.googleapis.com cloudfunctions.googleapis.com cloudresourcemanager.googleapis.com sourcerepo.googleapis.com --project $1
}

#######################################
# Delete the default firewall rules, subnets, and VPC from both projects if they exist
# Globals:
#   None
# Arguments:
#   project
#######################################
function del_default_network() {
  gcloud compute firewall-rules delete default-allow-icmp --quiet --project $1
  gcloud compute firewall-rules delete default-allow-internal --quiet --project $1
  gcloud compute firewall-rules delete default-allow-rdp --quiet --project $1
  gcloud compute firewall-rules delete default-allow-ssh --quiet --project $1
  gcloud compute networks delete default --quiet --project $1
}

function enable_os_login() {
  gcloud compute project-info add-metadata --metadata enable-oslogin=TRUE --project $1
}

#######################################
# Enable Data Access Audit logs
# Globals:
#   None
# Arguments:
#   project
#######################################
function enable_data_access_audit_logs() {
  gcloud projects get-iam-policy $1 > policy.yaml

  cat <<EOF > policy_update_temp.yaml
auditConfigs:
- auditLogConfigs:
  - logType: ADMIN_READ
  - logType: DATA_WRITE
  - logType: DATA_READ
  service: allServices
EOF

  cat policy_update_temp.yaml policy.yaml > new_policy.yaml
  gcloud projects set-iam-policy $1 new_policy.yaml

  rm -f new_policy.yaml policy.yaml policy_update_temp.yaml
}

#######################################
# Grants necessary permissions to Terraform service account inside project
# Globals:
#   None
# Arguments:
#   project
#   service_account (format: <name>@<project_name>.iam.gserviceaccount.com)
#######################################
function grant_tf_permissions(){
  project=$1
  service_account=$2
  gcloud iam roles create CISGCPRspecShim --description iam.serviceAccountKeys.list --permissions iam.serviceAccountKeys.list --project $project

  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role roles/cloudfunctions.developer
  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role roles/cloudkms.admin
  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role roles/compute.admin
  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role roles/container.clusterAdmin
  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role roles/iam.roleAdmin
  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role roles/logging.configWriter
  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role roles/resourcemanager.projectIamAdmin
  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role roles/storage.admin
  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role roles/storage.objectAdmin
  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role projects/$project/roles/CISGCPRspecShim
  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role roles/editor
  gcloud projects add-iam-policy-binding $project --member serviceAccount:$service_account --role roles/logging.admin

}

# Remove Editor Account
function remove_editor_account() {
  gcloud projects remove-iam-policy-binding $1 --member serviceAccount:$(gcloud projects list --filter="projectName:$1" --format='value(PROJECT_NUMBER)')-compute@developer.gserviceaccount.com --role roles/editor
}

enable_apis $project_name
enable_apis $staging_project_name

del_default_network $project_name
del_default_network $staging_project_name

enable_os_login $project_name
enable_os_login $staging_project_name

enable_data_access_audit_logs $project_name
enable_data_access_audit_logs $staging_project_name

# Create the Terraform Admin Bucket which will contain the service account for Terraform
gsutil mb gs://$TF_ADMIN_BUCKET
gsutil versioning set on gs://$TF_ADMIN_BUCKET
gsutil logging set on -b gs://$TF_ADMIN_BUCKET gs://$TF_ADMIN_BUCKET

cat <<EOF > config.json
{
    "MAILGUN_API_KEY":"UPDATE",
    "MAILGUN_DOMAIN":"UPDATE",
    "MAILGUN_FROM":"UPDATE",
    "MAILGUN_TO":"UPDATE",
    "bucket_name":"<TF_ADMIN_BUCKET>"
}
EOF

gsutil cp config.json gs://$TF_ADMIN_BUCKET/mailgun_json/config.json
rm -f config.json

# Create Terraform Admin Account
gcloud iam service-accounts create terraform
gcloud iam service-accounts keys create --iam-account terraform@$project_name.iam.gserviceaccount.com  ~/.config/gcloud/$project_name.json

grant_tf_permissions $project_name terraform@$project_name.iam.gserviceaccount.com
grant_tf_permissions $staging_project_name terraform@$project_name.iam.gserviceaccount.com

# Create a KMS Keyring and Key for encrypting the exported terraform@ service account key json
gcloud kms keyrings create cicd --location $gcp_region
gcloud kms keys create terraform-cicd --purpose encryption --keyring cicd --location $gcp_region --rotation-period 90d --next-rotation-time 90d
gcloud kms encrypt --ciphertext-file terraform.json.enc --plaintext-file=$HOME/.config/gcloud/$project_name.json --location $gcp_region --keyring cicd --key terraform-cicd
gsutil cp terraform.json.enc gs://$TF_ADMIN_BUCKET/sa_json/terraform.json.enc
rm terraform.json.enc

# Grant Cloud Build the ability to decrypt using that KMS key:
gcloud kms keys add-iam-policy-binding terraform-cicd --location=$gcp_region --keyring=cicd --member=serviceAccount:$(gcloud projects list --filter="projectName:$project_name" --format='value(PROJECT_NUMBER)')@cloudbuild.gserviceaccount.com --role=roles/cloudkms.cryptoKeyDecrypter

# Create the KMS Keyring for the HelloWorld app. This key is used to encrypt the application's persistent disks.:
gcloud kms keyrings create helloworld-keyring --location $gcp_region --project $project_name
gcloud kms keys create helloworld-key --purpose encryption --keyring helloworld-keyring --location $gcp_region --project $project_name  --rotation-period 90d --next-rotation-time 90d

gcloud kms keyrings create cicd-testing-keyring --location $gcp_region --project $staging_project_name
gcloud kms keys create cicd-testing-key --purpose encryption --keyring cicd-testing-keyring --location $gcp_region --project $staging_project_name --rotation-period 90d --next-rotation-time 90d

remove_editor_account $project_name
remove_editor_account $staging_project_name

gcloud iam service-accounts create project-service-account

gcloud projects add-iam-policy-binding $project_name --member serviceAccount:project-service-account@$project_name.iam.gserviceaccount.com --role roles/clouddebugger.agent
gcloud projects add-iam-policy-binding $project_name --member serviceAccount:project-service-account@$project_name.iam.gserviceaccount.com --role roles/cloudprofiler.agent
gcloud projects add-iam-policy-binding $project_name --member serviceAccount:project-service-account@$project_name.iam.gserviceaccount.com --role roles/cloudtrace.agent
gcloud projects add-iam-policy-binding $project_name --member serviceAccount:project-service-account@$project_name.iam.gserviceaccount.com --role roles/logging.logWriter
gcloud projects add-iam-policy-binding $project_name --member serviceAccount:project-service-account@$project_name.iam.gserviceaccount.com --role roles/monitoring.metricWriter
gcloud projects add-iam-policy-binding $project_name --member serviceAccount:project-service-account@$project_name.iam.gserviceaccount.com --role roles/storage.objectViewer
gcloud iam service-accounts add-iam-policy-binding project-service-account@$project_name.iam.gserviceaccount.com   --member="serviceAccount:terraform@$project_name.iam.gserviceaccount.com" --role='roles/iam.serviceAccountUser'
gcloud iam service-accounts add-iam-policy-binding $project_name@appspot.gserviceaccount.com --member=serviceAccount:terraform@$project_name.iam.gserviceaccount.com --role=roles/iam.serviceAccountUser

echo "Setup script complete!"
