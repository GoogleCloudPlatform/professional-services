# ![Pubsub2Inbox](img/logo.png)

Pubsub2Inbox is a generic tool to handle input from Pub/Sub messages and turn them into
email, webhooks or GCS objects. It's based on an extendable framework consisting of input 
and output processors. Input processors can enrich the incoming messages with details
(for example, fetching the budget from Cloud Billing Budgets API). Multiple output
processors can be chained together. 

Pubsub2Inbox is written in Python 3.8+ and can be deployed as a Cloud Function or as a 
Cloud Run function easily. To guard credentials and other sensitive information, the tool can 
fetch its YAML configuration from Google Cloud Secret Manager.

The tool also supports templating of emails, messages and other parameters through
[Jinja2 templating](https://jinja.palletsprojects.com/en/2.10.x/templates/).

*Please note:* You cannot connect to SMTP port 25 from GCP. Use alternative ports 465 or 587,
or connect via [Serverless VPC Connector](https://cloud.google.com/vpc/docs/configure-serverless-vpc-access) to your own mailservers.

## Out of the box

Out of the box, you'll have the following functionality:

  - [Budget alert notifications](examples/budget-config.yaml)
    - [How to set up programmatic notifications from billing budgets](https://cloud.google.com/billing/docs/how-to/budgets-programmatic-notifications)
  - [Cloud Security Command Center](https://cloud.google.com/security-command-center)
    - [Email notifications of findings](examples/scc-config.yaml) ([how to set up finding notifications from SCC](https://cloud.google.com/security-command-center/docs/how-to-notifications))
    - [Create findings from Cloud IDS](examples/scc-cloud-ids.yaml)
    - [Create custom findings](examples/scc-finding-config.yaml)
  - [Cloud Storage notifications](examples/storage-config.yaml)
    - [How to set up Cloud Storage notifications](https://cloud.google.com/storage/docs/reporting-changes)
    - For example, you can automatically send reports via email that are generated in a Cloud Storage bucket
  - [BigQuery queries](examples/bigquery-config.yaml)
    - For example, you can turn any BigQuery query results into CSV files or email messages.
  - [Recommendations and Insights reports](examples/recommendations-example.yaml)
     - From [Recommender API](https://cloud.google.com/recommender/docs/overview).
     - Also see [example with attached spreadsheet](examples/recommendations-example-2.yaml) and [example with with GCS and BigQuery output](examples/recommendations-example-3.yaml)..
  - [Cloud Monitoring alerts](examples/monitoring-alert-config.yaml)
  - [Cloud Monitoring metrics](examples/cai.yaml)
  - [Cloud Asset Inventory search](examples/cai.yaml)
  - [Cloud Storage copier](examples/gcscopy-example.yaml)
     - Copies objects between two buckets, useful for backing up.
  - [Cloud Identity groups](examples/groups-example.yaml) ([other example](examples/groups-example-2.yaml))
     - Retrieves group and membership information from [Cloud Identity Groups API](https://cloud.google.com/identity/docs/apis)
     - Useful for example building membership review reports
  - [Groups that allow external members](examples/external-groups-example.yaml) ([general example for Directory API](examples/directory-example.yaml))
  - [GCP projects](examples/projects-example.yaml)
     - Retrieves a list of projects using Cloud Resource Manager API
  - [Send SMS messages](examples/twilio-example.yaml)
     - Retrieves a list of projects using Cloud Resource Manager API
  - Any JSON
    - [See the example of generic JSON processing](examples/generic-config.yaml)

## Input processors

Available input processors are:

  - [budget.py](processors/budget.py): retrieves details from Cloud Billing Budgets
    API and presents.
  - [scc.py](processors/scc.py): enriches Cloud Security Command Center
    findings notifications.
  - [bigquery.py](processors/bigquery.py): queries from BigQuery datasets.
  - [genericjson.py](processors/genericjson.py): Parses message data as JSON and
    presents it to output processors.
  - [recommendations.py](processors/recommendations.py): Retrieves recommendations
    and insights from the [Recommender API](https://cloud.google.com/recommender/docs/overview).
  - [groups.py](processors/groups.py): Retrieves Cloud Identity Groups 
  - [directory.py](processors/groups.py): Retrieves users, groups, group members and group settings
  - [monitoring.py](processors/monitoring.py): Retrieves time series data from Cloud Ops Monitoring
  - [projects.py](processors/projects.py): Searches or gets GCP project details
  - [cai.py](processors/cai.py): Fetch assets from Cloud Asset Inventory

For full documentation of permissions, processor input and output parameters, see [PROCESSORS.md](PROCESSORS.md).

Please note that the input processors have some IAM requirements to be able to
pull information from GCP:

 - Resend mechanism (see below)
    - Storage Object Admin (`roles/storage.objectAdmin`)
 - Signed URL generation (see `filters/strings.py:generate_signed_url`)
    - Storage Admin on the bucket (`roles/storage.admin`)

## Output processors

Available output processors are:

  - [mail.py](output/mail.py): can send HTML and/or text emails via SMTP gateways,
    SendGrid or MS Graph API (Graph API implementation lacks attachment support)
  - [gcs.py](output/gcs.py): can create objects on GCS from any inputs.
  - [webhook.py](output/webhook.py): can send arbitrary HTTP requests, optionally
    with added OAuth2 bearer token from GCP.
  - [gcscopy.py](output/gcscopy.py): copies files between buckets.
  - [logger.py](output/logger.py): Logs message in Cloud Logging.
  - [pubsub.py](output/pubsub.py): Sends one or more Pub/Sub messages.
  - [bigquery.py](output/bigquery.py): Sends output to a BigQuery table via a load job.
  - [scc.py](output/scc.py): Sends findings to Cloud Security Command Center.
  - [twilio.py](output/twilio.py): Sends SMS messages via Twilio API.

Please note that the output processors have some IAM requirements to be able to
pull information from GCP:

 - `mail.py`
    - Group membership expansion requires following the instructions at
      [Groups API: Authenticating as a service account without domain-wide delegation](https://cloud.google.com/identity/docs/how-to/setup#auth-no-dwd)
      to grant permissions to the service account the function is running under. You can also use [the helper script](helpers/grant-gsuite-role.py).
    - In addition, the service account that the script runs under will need to have `roles/iam.serviceAccountTokenCreator` on itself when
      running in Cloud Function/Cloud Run (for Directory API scoped tokens).

## Configuring Pubsub2Inbox

Pubsub2Inbox is configured through a YAML file (for examples, see the [examples/](examples/)
directory). Input processors are configured under `processors` key and outputs under `outputs`.

Features of the specific processors are explain in the corresponding examples.

## Retry and resend mechanism

Pubsub2Inbox has two mechanisms to prevent excessive retries and resend of messages.

The retry mechanism acknowledges and discards any messages that are older than a 
configured period (`retryPeriod` in configuration, default 2 days).

The resend mechanism is to prevent recurring notifications from being send. It relies
on a Cloud Storage bucket where is stores zero-length files, that are named by
hashing the `resendKey` (if it is omitted, all template parameters are used). The
resend period is configurable through `resendPeriod`. To prevent the resend bucket
from accumulating unlimited files, set an [Object Lifecycle Management policy](https://cloud.google.com/storage/docs/lifecycle)
on the bucket.

## Deploying as Cloud Function

### Deploying via Terraform

Sample Terraform module is provided in `main.tf`, `variables.tf` and `outputs.tf`. Pass the following
parameters in when using as a module:

  - `project_id` (string): where to deploy the function
  - `organization_id` (number): organization ID (for organization level permissions)
  - `function_name` (string): name for the Cloud Function
  - `function_roles` (list(string)): list of curated permissions roles for the function (eg. `scc`, `budgets`, `bigquery_reader`, `bigquery_writer`, `cai`, `recommender`, `monitoring`)
  - `pubsub_topic` (string): Pub/Sub topic in the format of `projects/project-id/topics/topic-id` which the Cloud Function should be triggered on
  - `region` (string, optional): region where to deploy the function
  - `secret_id` (string, optional): name for the Cloud Secrets Manager secrets (defaults to `function_name`)
  - `config_file` (string, optional): function configuration YAML file location (defaults to `config.yaml`)
  - `service_account` (string, optional): service account name for the function (defaults to `function_name`)
  - `bucket_name` (string, optional): bucket where to host the Cloud Function archive (defaults to `cf-pubsub2inbox`)
  - `bucket_location` (string, optional): location of the bucket for Cloud Function archive (defaults to `EU`)
  - `helper_bucket_name` (string, optional): specify an additional Cloud Storage bucket where the service account is granted `storage.objectAdmin` on
  - `function_timeout` (number, optional): a timeout for the Cloud Function (defaults to `240` seconds)
  - `retry_minimum_backoff` (string, optional): minimum backoff time for exponential backoff retries in Cloud Run. Defaults to 10s.
  - `retry_maximum_backoff` (string, optional): maximum backoff time for exponential backoff retries in Cloud Run. Defaults to 600s.
  - `cloud_run` (boolean, optional): deploy via Cloud Run instead of Cloud Function. Defaults to `false`. If set to `true`, also specify `cloud_run_container`.
  - `cloud_run_container` (string, optional): container image to deploy on Cloud Run. See previous parameter.

## Deploying manually

First, we have the configuration in `config.yaml` and we're going to store the configuration for
the function as a Cloud Secret Manager secret.

Let's define some variables first:

```sh
export PROJECT_ID=your-project # Project ID where function will be deployed
export REGION=europe-west1 # Where to deploy the functions
export SECRET_ID=pubsub2inbox # Secret Manager secret name
export SERVICE_ACCOUNT=pubsub2inbox # Service account name
export SECRET_URL="projects/$PROJECT_ID/secrets/$SECRET_ID/versions/latest"
export FUNCTION_NAME="pubsub2inbox"
export PUBSUB_TOPIC="billing-alerts" # projects/$PROJECT_ID/topics/billing-alerts
```

Then we'll create the secrets in Secret Manager:

```sh
gcloud secrets create $SECRET_ID \
    --replication-policy="automatic" \
    --project $PROJECT_ID

gcloud secrets versions add $SECRET_ID \
    --data-file=config.yaml \
    --project $PROJECT_ID
```

We will also create a service account for the Cloud Function:

```sh
gcloud iam service-accounts create $SA_NAME \
    --project $PROJECT_ID

gcloud secrets add-iam-policy-binding $SECRET_ID \
    --member "serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role "roles/secretmanager.secretAccessor" \
    --project $PROJECT_ID

gcloud iam service-accounts add-iam-policy-binding $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com \
    --member "serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role "roles/iam.serviceAccountTokenCreator" \
    --project $PROJECT_ID

```

Now we can deploy the Cloud Function:

```sh
gcloud functions deploy $FUNCTION_NAME \
    --entry-point process_pubsub \
    --runtime python38 \
    --trigger-topic $PUBSUB_TOPIC \
    --service-account "$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --set-env-vars "CONFIG=$SECRET_URL" \
    --region $REGION \
    --project $PROJECT_ID
```

## Deploying via Cloud Run

### Building the container

A [`Dockerfile`](Dockerfile) has been provided for building the container. You can build the 
image locally and push it to for example [Artifact Registry](https://cloud.google.com/artifact-registry).

```sh
docker build -t europe-west4-docker.pkg.dev/$PROJECT_ID/pubsub2inbox/pubsub2inbox . 
docker push europe-west4-docker.pkg.dev/$PROJECT_ID/pubsub2inbox/pubsub2inbox
```

### Deploying via Terraform

The provided Terraform scripts can deploy the code as a Cloud Function or Cloud Run. To enable
Cloud Run deployment, build and push the image and set `cloud_run` and `cloud_run_container`
parameters (see the parameter descriptions above).

### Running tests

Run the command:

```
# python3 -m unittest discover
```

To set against a real cloud project, set `PROJECT_ID` environment variable. 
