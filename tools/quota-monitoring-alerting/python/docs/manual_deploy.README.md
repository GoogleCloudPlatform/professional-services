## Maual Deployment steps(using gcloud commands)

Using Cloud Shell
* Go to https://console.cloud.google.com/
* Select the project created for deploying the solution
* Activate Cloud Shell & execute below steps

Using Local Shell
* Open terminal/shell
* Configure gcloud and select the project created for deploying the solution
```bash
gcloud init
```
* Execute below steps


---
### Create a directory
```bash
mkdir workspace; cd workspace
```

### Set common variables
```bash
export PROJECT=<REPLACE_WITH_PROJECT_ID>
```

```bash
export PROJECT_NUMBER=<REPLACE_WITH_PROJECT_NUMBER>
```

```bash
export ORGANIZATION=<REPLACE_WITH_ORG_ID>
```

```bash
export REGION=us-central1
```

```bash
export SERVICE_ACCOUNT=quota-export
```

---
### Enable API's
```bash
gcloud services enable monitoring.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable pubsub.googleapis.com
```

---
### Credentials
```bash
gcloud iam service-accounts create $SERVICE_ACCOUNT
```

```bash
gcloud iam service-accounts keys create credentials/$SERVICE_ACCOUNT.json \
  --iam-account=$SERVICE_ACCOUNT@$PROJECT.iam.gserviceaccount.com
```

```bash
export GOOGLE_APPLICATION_CREDENTIALS=$PWD/credentials/$SERVICE_ACCOUNT.json
```

```bash
gcloud projects add-iam-policy-binding $PROJECT \
  --member=serviceAccount:$SERVICE_ACCOUNT@$PROJECT.iam.gserviceaccount.com \
  --role=roles/bigquery.admin
```

```bash
gcloud projects add-iam-policy-binding $PROJECT \
  --member=serviceAccount:$SERVICE_ACCOUNT@$PROJECT.iam.gserviceaccount.com \
  --role=roles/pubsub.admin
```

```bash
gcloud organizations add-iam-policy-binding $ORGANIZATION \
  --member=serviceAccount:$SERVICE_ACCOUNT@$PROJECT.iam.gserviceaccount.com \
  --role=roles/monitoring.admin
```

```bash
gcloud organizations add-iam-policy-binding $ORGANIZATION \
  --member=serviceAccount:$SERVICE_ACCOUNT@$PROJECT.iam.gserviceaccount.com \
  --role=roles/resourcemanager.folderViewer
```

```bash
gcloud organizations add-iam-policy-binding $ORGANIZATION \
  --member=serviceAccount:$SERVICE_ACCOUNT@$PROJECT.iam.gserviceaccount.com \
  --role=roles/viewer
```

---
### Clone code
```bash
git clone https://github.com/GoogleCloudPlatform/professional-services.git
```

```bash
cd professional-services/tools/quota-monitoring-alerting/python
```

---
### Bigquery dataset and tables
Dataset
```bash
bq mk -d quota
```

Metrics table
```bash
bq mk --time_partitioning_type=DAY --schema=$PWD/bigquery_schemas/metrics -t quota.metrics
```

Thresholds table
```bash
bq mk --time_partitioning_type=DAY --schema=$PWD/bigquery_schemas/thresholds -t quota.thresholds
```

Replace project info
```bash
sed -i 's/$PROJECT/'"$PROJECT"'/' $PWD/bigquery_schemas/dashboard_view.sql
```

Create dashboard view
```bash
bq mk --use_legacy_sql=false --view="$(cat $PWD/bigquery_schemas/dashboard_view.sql)" quota.dashboard_view
```

---
### Setup DataStudio Dashboard

* Open the [dashboard template](https://datastudio.google.com/reporting/50bdadac-9ea0-4dcd-bee2-f323c968186d)

* Make a copy by clicking the "Make a copy" button at the top right hand side, as shown below.

  <img src="make_a_copy.png" align="center" />

* On the "Copy this report" screen, the goal is to do the following mappings
  * dashboard_view(original data source) to dashboard_view(new data source)
  * thresholds_public(original data source) to thresholds(new data source)

  <img src="copy_report_end_state.png" align="center" />

* For each "Original Data Source" create and link the "New Data Source" by
  clicking "CREATE NEW DATA SOURCE"

  <img src="copy_report.png" align="center" />

* From connectors screen select "Bigquery" connector

  <img src="connectors.png" align="center" />

* Select the correct Project(the one where BQ resources got deployed), Dataset and Table on the bigquery connector screen and click "Connect" at top right corner

  <img src="bigquery_connector.png" align="center" />

* Click "ADD TO REPORT" at the top right corner

  <img src="add_to_report.png" align="center" />

* After all the data sources are mapped, click "Copy Report".


---
### Update config
```bash
sed -i 's/$PROJECT/'"$PROJECT"'/' $PWD/config.yaml
```

```bash
python3 -m venv venv
```

```bash
source venv/bin/activate
```

```bash
pip install --upgrade pip
```

```bash
pip install -r requirements.txt
```

Bootstrap to create Metric Descriptor etc.
If the below command reports an error, wait a few seconds and try again.
<br />
**NOTE**: Need to check why Cloud Monitoring throws error initially.
```bash
python3 bootstrap.py
```


Set email address for recieving the notifications
```bash
export EMAIL_ADDRESS=<REPLACE_WITH_EMAIL_ADDRESS>
```

Replace email address info
```bash
sed 's/$EMAIL_ADDRESS/'"$EMAIL_ADDRESS"'/' \
  $PWD/templates/inputs/quota_email_notification.yaml > $PWD/templates/outputs/quota_email_notification.yaml
```

Create notification channel
```bash
export CHANNEL=$(gcloud alpha monitoring channels create --channel-content-from-file=templates/outputs/quota_email_notification.yaml --format=json | grep -Po 'projects.*(?=",)')
```

Replace with correct dashboard link
```bash
export DASHBOARD_LINK='[REPLACE_WITH_DASHBOARD_LINK]'
```

```bash
sed 's~$CHANNEL~'"$CHANNEL"'~g' $PWD/templates/inputs/quota_exceeded_threshold_report_policy.yaml | sed 's~$DASHBOARD_LINK~'"$DASHBOARD_LINK"'~g' > $PWD/templates/outputs/quota_exceeded_threshold_report_policy.yaml
```

Create alert policy
```bash
gcloud alpha monitoring policies create --policy-from-file=templates/outputs/quota_exceeded_threshold_report_policy.yaml
```

---
### Deploy
```bash
export SERVICE=quota-export
```

Build the image
```bash
gcloud builds submit --tag gcr.io/$PROJECT/$SERVICE
```

```bash
yes | gcloud run deploy $SERVICE \
  --image gcr.io/$PROJECT/$SERVICE \
  --platform managed \
  --region $REGION \
  --concurrency 5 \
  --service-account=$SERVICE_ACCOUNT@$PROJECT.iam.gserviceaccount.com
```

```bash
export SERVICE_URL=$(gcloud run services describe $SERVICE --platform managed --region us-central1 | grep 'URL' | tr -s ' ' | cut -d ' ' -f 2)
```

```bash
export LIST_PROJECTS_URL=$SERVICE_URL/project/list
export LIST_METRICS_URL=$SERVICE_URL/project/metric/list
export LIST_METRIC_THRESHOLDS_URL=$SERVICE_URL/project/metric/threshold/list
export REPORT_METRIC_THRESHOLDS_URL=$SERVICE_URL/report/thresholds
export SAVE_METRICS_URL=$SERVICE_URL/project/metric/save
```

Enable Pub/Sub to create authentication tokens in your project
```bash
gcloud projects add-iam-policy-binding $PROJECT \
  --member=serviceAccount:service-$PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountTokenCreator
```

Create a service account to represent the Pub/Sub subscription identity
```bash
gcloud iam service-accounts create cloud-run-pubsub-invoker \
  --display-name "Cloud Run Pub/Sub Invoker"
```

```bash
gcloud run services add-iam-policy-binding $SERVICE \
  --platform managed \
  --region $REGION \
  --member=serviceAccount:cloud-run-pubsub-invoker@$PROJECT.iam.gserviceaccount.com \
  --role=roles/run.invoker
```

Create pubsub topics and subscriptions
```bash
gcloud pubsub topics create dead-letter
```

```bash
gcloud pubsub topics create metrics
```

```bash
gcloud pubsub subscriptions create metrics_sub \
  --topic metrics \
  --ack-deadline=60 \
  --message-retention-duration=10m \
  --push-endpoint="$LIST_METRICS_URL" \
  --push-auth-service-account=cloud-run-pubsub-invoker@$PROJECT.iam.gserviceaccount.com \
  --max-delivery-attempts=5 \
  --min-retry-delay=60 \
  --dead-letter-topic=dead-letter
```

```bash
gcloud pubsub topics create thresholds
```

```bash
gcloud pubsub subscriptions create thresholds_sub \
  --topic thresholds \
  --ack-deadline=60 \
  --message-retention-duration=10m \
  --push-endpoint="$LIST_METRIC_THRESHOLDS_URL" \
  --push-auth-service-account=cloud-run-pubsub-invoker@$PROJECT.iam.gserviceaccount.com \
  --max-delivery-attempts=5 \
  --min-retry-delay=60 \
  --dead-letter-topic=dead-letter
```

```bash
gcloud pubsub topics create bigquery
```

```bash
gcloud pubsub subscriptions create bigquery_sub \
  --topic bigquery \
  --ack-deadline=60 \
  --message-retention-duration=10m \
  --push-endpoint="$SAVE_METRICS_URL" \
  --push-auth-service-account=cloud-run-pubsub-invoker@$PROJECT.iam.gserviceaccount.com \
  --max-delivery-attempts=5 \
  --min-retry-delay=60 \
  --dead-letter-topic=dead-letter
```

---
### Schedule cron(s) using Cloud Scheduler.
NOTE: CloudScheduler requires AppEngine project.
```bash
gcloud services enable appengine.googleapis.com
```

```bash
gcloud app create --region=${REGION//[0-9]/} 
```

```bash
export INVOKER=quota-export-invoker
```

```bash
gcloud iam service-accounts create $INVOKER
```

```bash
gcloud run services add-iam-policy-binding $SERVICE \
  --member=serviceAccount:$INVOKER@$PROJECT.iam.gserviceaccount.com \
  --role=roles/run.invoker \
  --platform managed \
  --region $REGION
```

This is scheduling every 12 hours, update as required.
```bash
gcloud scheduler jobs create http $SERVICE-job \
  --schedule '0 */12 * * *' \
  --http-method=GET \
  --uri=$LIST_PROJECTS_URL \
  --oidc-service-account-email=$INVOKER@$PROJECT.iam.gserviceaccount.com \
  --oidc-token-audience=$LIST_PROJECTS_URL
```

This is scheduling every 12 hours at 30 minute, update as required.
```bash
gcloud scheduler jobs create http $SERVICE-report-job \
  --schedule '30 */12 * * *' \
  --http-method=GET \
  --uri=$REPORT_METRIC_THRESHOLDS_URL \
  --oidc-service-account-email=$INVOKER@$PROJECT.iam.gserviceaccount.com \
  --oidc-token-audience=$REPORT_METRIC_THRESHOLDS_URL
```

---
[Back to top level README](../README.md)
