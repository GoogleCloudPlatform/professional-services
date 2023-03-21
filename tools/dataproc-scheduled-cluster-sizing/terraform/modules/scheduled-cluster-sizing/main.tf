# Copyright 2022 Google Inc.
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

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_storage_bucket" "cloud-function-source-bucket" {
    name     = "${var.app_id}-src"
    location = var.region
}

resource "google_storage_bucket" "cloud-function-app-bucket" {
    name     = "${var.app_id}-out"
    location = var.region
}

# Generates an archive of the source code compressed as a .zip file.
data "archive_file" "source" {
    type        = "zip"
    source_dir  = "../src"
    output_path = "/tmp/function.zip"
}

# Add source code zip to the Cloud Function's bucket
resource "google_storage_bucket_object" "cloud-function-zip" {
    source       = data.archive_file.source.output_path
    content_type = "application/zip"

    # Append to the MD5 checksum of the files's content
    # to force the zip to be updated as soon as a change occurs
    name         = "src-${data.archive_file.source.output_md5}.zip"
    bucket       = google_storage_bucket.cloud-function-source-bucket.name

    # Dependencies are automatically inferred so these lines can be deleted
    depends_on   = [
        google_storage_bucket.cloud-function-source-bucket,
        data.archive_file.source
    ]
}

# Create the Cloud function triggered by a `Finalize` event on the bucket
resource "google_cloudfunctions2_function" "cloud-function" {
    name                  = "${var.app_id}"
		location = var.region

		build_config {
		    runtime     = "python39"
		    entry_point = "execute" # Set the entry point in the code
				source {
		      storage_source {
		        bucket = google_storage_bucket.cloud-function-source-bucket.name
		        object = google_storage_bucket_object.cloud-function-zip.name
		      }
				 }
		}

service_config {
    max_instance_count  = 1000
    min_instance_count = 0
    available_memory    = "256Mi"
    timeout_seconds     = 60
	environment_variables = {
        PROJECT_ID = var.project_id
        REGION = var.region
        PRIMARY_SIZE = var.primary_size
        SECONDARY_SIZE = var.secondary_size
        LABEL_KEY = var.label_key
        LABEL_VAL = var.label_val
	}
  }

event_trigger {
    trigger_region = "us-central1"
    event_type = "google.cloud.audit.log.v1.written"
    retry_policy = "RETRY_POLICY_DO_NOT_RETRY"
    service_account_email = var.service_account_email
    event_filters {
      attribute = "serviceName"
      value = "cloudscheduler.googleapis.com"
    }
    event_filters {
      attribute = "methodName"
      value = "google.cloud.scheduler.v1.CloudScheduler.RunJob"
    }
    event_filters {
      attribute = "resourceName"
      value = "cloud-function-trigger-${var.app_id}"
    }
  }

    # Dependencies are automatically inferred so these lines can be deleted
    depends_on            = [
        google_storage_bucket.cloud-function-source-bucket,
        google_storage_bucket_object.cloud-function-zip,
    ]
}

resource "google_cloud_scheduler_job" "job" {
  name             = "cloud-function-trigger-${var.app_id}"
  schedule         = "${var.schedule}"
  time_zone        = "America/New_York"

  pubsub_target {
    # topic.id is the topic's full resource name.
    topic_name = google_cloudfunctions2_function.cloud-function.event_trigger[0].pubsub_topic
    data       = base64encode("please trigger.")
  }
}
