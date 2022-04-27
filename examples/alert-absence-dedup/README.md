# Stackdriver alerts for missing timeseries

This example demonstrates creating alerts for missing monitoring data with
Stackdriver in a way that duplicate alerts are not generated. For example,
suppose that you have 100 timeseries and you want to find out when any one of
them is missing. If one or two timeseries are missing, you want exactly one
alert. When there is a total outage you still want to get one alert, not 100
alerts.

The test app generates time series with a custom metric called
task_latency_distribution with tags based on a partition label. Each
partition generates its own time series.

The example assumes that you are familiar with Stackdriver Monitoring and
Alerting. It builds on the discussion in
[Alerting policies in depth](https://cloud.google.com/monitoring/alerts/concepts-indepth).

## Setup
Clone this repo and change to this working directory. Enable the Stackdriver
Monitoring API

```shell
gcloud services enable monitoring.googleapis.com
```

In the GCP Console, go to
[Monitoring](https://console.cloud.google.com/monitoring).
If you have not already created a workspace for this project before, click New
workspace, and then click Add. It takes a few minutes to create the workspace.
Click Alerting | Policies overview. The list should be empty at this point
unless you have created policies previously.

## Deploy the app

The example code is based on the Go code in
[Custom metrics with OpenCensus](https://cloud.google.com/monitoring/custom-metrics/open-census).

[Download](https://golang.org/dl/) and install the latest version of Go.

Build the test app

```shell
go build
```

The instructions here are based on the article
[Setting up authentication](https://cloud.google.com/monitoring/docs/reference/libraries#setting_up_authentication)
for the Stackdriver client library. Note that if you run the test app on a
Google Cloud Compute Engine instance, on Google Kubernetes Engine, on App
Engine, or on Cloud Run, then you will not need to create a service account
or download the credentials.

First, set the project id in a shell variable

```shell
export GOOGLE_CLOUD_PROJECT=[your project]
```

Create a service account:

```shell
SA_NAME=stackdriver-metrics-writer
gcloud iam service-accounts create $SA_NAME \
 --display-name="Stackdriver Metrics Writer"
```

```shell
SA_ID="$SA_NAME@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member "serviceAccount:$SA_ID" --role "roles/monitoring.metricWriter"
```

Generate a credentials file with an exported variable
GOOGLE_APPLICATION_CREDENTIALS referring to it.

```shell
mkdir -p ~/.auth
chmod go-rwx ~/.auth
export GOOGLE_APPLICATION_CREDENTIALS=~/.auth/stackdriver_demo_credentials.json
gcloud iam service-accounts keys create $GOOGLE_APPLICATION_CREDENTIALS \
 --iam-account $SA_ID
```

Run the program with three partitions, labeled "1", "2", and "3"

```shell
./alert-absence-demo --labels "1,2,3"
```

This will write three time series with the given labels. A few minutes after
starting the app you should be able to see the time series data in the
Stackdriver Metric explorer.

## Create the policy

Create a notification channel with the command

```shell
EMAIL="your email"
CHANNEL=$(gcloud alpha monitoring channels create \
  --channel-labels=email_address=$EMAIL \
  --display-name="Email to project owner" \
  --type=email \
  --format='value(name)')
```

Create an alert policy with the command

```shell
gcloud alpha monitoring policies create \
--notification-channels=$CHANNEL \
--documentation-from-file=policy_doc.md \
--policy-from-file=alert_policy.json
```

At this point no alerts should be firing. You can check that in the Stackdriver
Monitoring console alert policy detail.

## Testing

Kill the processes with CTL-C and restart it with only two partitions:

```shell
./alert-absence-demo --labels "1,2"
```

An alert should be generated in about 5 minutes with a subject like ‘One of the
timeseries is absent.’ You should be able to see this in the Stackdriver console
and you should also receive an email notification.

Restart the process with three partitions:

```shell
./alert-absence-demo --labels "1,2,3"
```

After a few minutes the alert should resolve itself.

Stop the process and restart it with only one partition:

```shell
./alert-absence-demo --labels "1"
```

Check that only one alert is fired.

Stop the process and do not restart it. You should see an alert that indicates
all time series are absent.
