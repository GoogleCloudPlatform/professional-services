/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

gcp_org_id             = "116143322321"
gcp_billing_account_id = "0131D6-94FD9F-065EAB"
project_id             = "apszaz-subnet-logs"
root_folder_id         = "1068507387329"

enforcement_folders = [
  "509020581346",
  "273647969471",
]
log_config = {
  aggregationInterval : "INTERVAL_5_SEC",
  flowSampling : 0.75,
  metadata : "INCLUDE_ALL_METADATA",
}
configure_log_sinks       = false
configure_asset_feeds     = true
terraform_service_account = "project-factory-19674@apszaz-cft-tf.iam.gserviceaccount.com"
