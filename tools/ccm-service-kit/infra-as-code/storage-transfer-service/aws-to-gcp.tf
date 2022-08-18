# Copyright 2022 Google LLC All Rights Reserved.
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

resource "google_storage_transfer_job" "aws_to_gcp_service" {
  description = "Service used to transfer data from S3 to GCS"
  project     = var.project_id #TODO: Set project ID

  transfer_spec {
    
    aws_s3_data_source {
      bucket_name = var.aws_s3_bucket #TODO: Set S3 bucket name
      aws_access_key {
        access_key_id     = var.aws_access_key #TODO: Set AWS access_key_id
        secret_access_key = var.aws_secret_key #TODO: Set AWS secret_access_key
      }
    }
    gcs_data_sink {
      bucket_name = var.aws_to_gcs_bucket_name #TODO: Set GCS Bucket Name
      path        = var.aws_to_gcs_file_path #TODO: Set GCS file path
    }
  }

  schedule {
    #TODO: Configure dates and frecuency
    # schedule_start_date {
    #   year  = 2018
    #   month = 10
    #   day   = 1
    # }
    # schedule_end_date {
    #   year  = 2019
    #   month = 1
    #   day   = 15
    # }
    # start_time_of_day {
    #   hours   = 23
    #   minutes = 30
    #   seconds = 0
    #   nanos   = 0
    # }
    # repeat_interval = "604800s"
  }

}