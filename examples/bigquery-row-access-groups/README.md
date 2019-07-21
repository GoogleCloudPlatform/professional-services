# BigQuery Group Sync For Row Level Access
Sample code to synchronize group membership from G Suite/Cloud Identity into BigQuery and join that with your data to control access at row level.

## Source files

* `group_sync.py` and `group_sync_test.py`: main code and unit tests.
* `auth_util.py`: utility function to perform domain-wide delegation.
* `main.py`: Cloud Functions entry point.
* `requirements.txt`: Python dependencies.
* `create_service_account.sh`: gcloud commands to create service account with the right permissions.
* `deploy_function.sh`: gcloud command to deploy the Cloud Function.
* `schedule_job.sh`: gcloud command to schedule periodic execution of the Cloud
  Function.

## Background and more information

For much more background information and usage, please see [this blog post](https://medium.com/google-cloud/how-to-control-access-to-bigquery-at-row-level-with-groups-1cbccb111d9e).
