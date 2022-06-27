/*
Copyright 2022 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
//Update values
project_id                 = ""
region                     = ""
service_account_email      = ""
folders                    = "[]"
organizations              = "[]"
alert_log_bucket_name      = ""
notification_email_address = ""
//Optional to update
source_code_bucket_name       = "quota-monitoring-solution-source"
source_code_zip               = "v4.2/quota-monitoring-solution-v4.2.zip"
source_code_notification_zip  = "v4.2/quota-monitoring-notification-v4.2.zip"
scheduler_cron_job_frequency  = "0 0 * * *"
Alert_data_scanning_frequency = "every 12 hours"
threshold                     = "80"

