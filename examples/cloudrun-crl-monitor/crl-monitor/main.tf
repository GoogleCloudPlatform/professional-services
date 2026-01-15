/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

data "google_project" "project" {
  project_id = var.project_id
}

resource "google_project_service" "cloud_run_api" {
  service            = "run.googleapis.com"
  project            = var.project_id
  disable_on_destroy = false
}

resource "google_project_service" "cloud_scheduler_api" {
  service            = "cloudscheduler.googleapis.com"
  project            = var.project_id
  disable_on_destroy = false
}

resource "google_cloud_run_v2_job" "crl_validation" {
  name     = var.name
  location = var.region
  project  = var.project_id

  template {
    template {
      max_retries = 3
      containers {
        image = "gcr.io/google.com/cloudsdktool/google-cloud-cli:slim"

        env {
          name  = "TARGET_DOMAIN"
          value = var.target_url
        }
        env {
          name  = "PROJECT_ID"
          value = var.project_id
        }
        env {
          name  = "REGION"
          value = var.region
        }
        env {
          name  = "JOB_NAME"
          value = var.name
        }
        env {
          name  = "CRL_EXPIRY_BUFFER"
          value = var.crl_expiration_buffer
        }
        env {
          name  = "PROXY_URL"
          value = var.proxy_url
        }

        command = ["/bin/bash", "-c"]
        args = [
          <<-EOT
            set -e

            # CRL Validation Logic
            CRL_URL="$TARGET_DOMAIN"
            echo "Checking CRL at $CRL_URL..."
            
            PROXY_ARGS=""
            if [ -n "$PROXY_URL" ]; then
              echo "Using proxy: $PROXY_URL"
              PROXY_ARGS="-x $PROXY_URL"
            fi

            if curl -s -f $PROXY_ARGS -o crl.file "$CRL_URL"; then
              echo "CRL downloaded successfully."
              
              # Try to parse as DER first, then PEM
              if openssl crl -in crl.file -inform DER -noout > /dev/null 2>&1; then
                CRL_FORMAT="DER"
              elif openssl crl -in crl.file -inform PEM -noout > /dev/null 2>&1; then
                CRL_FORMAT="PEM"
              else
                echo "Error: Invalid CRL format (not DER or PEM)"
                RESULT=0
              fi
              
              if [ -n "$CRL_FORMAT" ]; then
                # Check expiry
                NEXT_UPDATE=$(openssl crl -in crl.file -inform $CRL_FORMAT -noout -nextupdate | sed 's/nextUpdate=//')
                if [ -n "$NEXT_UPDATE" ]; then
                   # Convert dates to epoch for comparison
                   # Note: date -d works in GNU date (Debian/Ubuntu), which is standard in google-cloud-cli image
                   EXPIRY_EPOCH=$(date -d "$NEXT_UPDATE" +%s)
                   CURRENT_EPOCH=$(date +%s)
                   
                   # Calculate buffer we just assume seconds. 
                   BUFFER_SECONDS=$(echo "$CRL_EXPIRY_BUFFER" | sed 's/s$//')
                   # If it's not a number, default to 0 to avoid syntax error
                   if ! [[ "$BUFFER_SECONDS" =~ ^[0-9]+$ ]]; then
                      echo "Warning: Invalid buffer format '$CRL_EXPIRY_BUFFER', defaulting to 0s"
                      BUFFER_SECONDS=0
                   fi
                   
                   THRESHOLD_EPOCH=$((EXPIRY_EPOCH - BUFFER_SECONDS))
                   
                   if [ "$CURRENT_EPOCH" -ge "$THRESHOLD_EPOCH" ]; then
                     echo "Error: CRL is expired or about to expire. Next Update: $NEXT_UPDATE, Threshold: $(date -d @$THRESHOLD_EPOCH)"
                     RESULT=0
                   else
                     echo "CRL is valid and not expired. Next Update: $NEXT_UPDATE"
                     RESULT=1
                   fi
                else
                   echo "Error: Could not extract Next Update field"
                   RESULT=0
                fi
              fi
            else
              echo "Error: Failed to download CRL from $CRL_URL"
              RESULT=0
            fi

            # Prepare metric payload
            NOW=$(date -u +%FT%TZ)
            cat <<JSON > metric.json
            {
              "timeSeries": [
                {
                  "metric": {
                    "type": "custom.googleapis.com/crl_validation/success",
                    "labels": {
                      "target_domain": "$TARGET_DOMAIN"
                    }
                  },
                  "resource": {
                    "type": "generic_task",
                    "labels": {
                      "project_id": "$PROJECT_ID",
                      "location": "$REGION",
                      "namespace": "crl-validation-ns",
                      "job": "$JOB_NAME",
                      "task_id": "$${CLOUD_RUN_TASK_INDEX:-0}"
                    }
                  },
                  "points": [
                    {
                      "interval": {
                        "endTime": "$NOW"
                      },
                      "value": {
                        "int64Value": "$RESULT"
                      }
                    }
                  ]
                }
              ]
            }
            JSON

            # Write metric result to Cloud Monitoring
            echo "Writing metric result $RESULT to Cloud Monitoring..."
            ACCESS_TOKEN=$(gcloud auth print-access-token)
            curl -X POST -H "Authorization: Bearer $ACCESS_TOKEN" \
                 -H "Content-Type: application/json" \
                 "https://monitoring.googleapis.com/v3/projects/$PROJECT_ID/timeSeries" \
                 -d @metric.json

            # Exit with failure if validation failed
            if [ "$RESULT" -eq 0 ]; then
              exit 1
            fi
          EOT
        ]
      }
    }
  }

  depends_on = [
    google_project_service.cloud_run_api
  ]

  deletion_protection = false

}

resource "google_cloud_scheduler_job" "crl_job_scheduler" {
  name             = "crl-monitor-${var.name}"
  description      = "Triggers CRL validation job every minute"
  schedule         = var.schedule
  time_zone        = "Etc/UTC"
  attempt_deadline = "320s"
  region           = var.region
  project          = var.project_id

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/v2/${google_cloud_run_v2_job.crl_validation.id}:run"

    oauth_token {
      service_account_email = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
    }
  }

  depends_on = [google_project_service.cloud_scheduler_api]
}


resource "google_cloud_run_v2_job_iam_member" "scheduler_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_job.crl_validation.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}
