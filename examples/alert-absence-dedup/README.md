# Stackdriver alerts for missing timeseries

This example demonstrates creating alerts for missing monitoring data with
Stackdriver in a way that duplicate alerts are not generated. For example,
suppose that you have 100 timeseries and you want to find out when any one of
them is missing. If one or two timeseries are missing, you want exactly one
alert. When there is a total outage you still want to get one alert, not 100
alerts.

The example assumes that you are familiar with Stackdriver Monitoring and
Alerting. It builds on the discussion in
[Alerting policies in depth](https://cloud.google.com/monitoring/alerts/concepts-indepth).

## Setup

Create three GCE instances

```shell
ZONE=us-central1-c
gcloud compute instances create test-instance-1 test-instance-2 test-instance-3 \
  --zone=$ZONE \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --boot-disk-size=20GB \
  --machine-type=f1-micro
```

Edit the file notification_channel.json, replacing the displayName and
email_address. Create a notification channel with the command

```shell
gcloud alpha monitoring channels create \
  --channel-content-from-file=notification_channel.json
```

Note the name of the notification channel created for the next step.

```shell
CHANNEL=[your notification channel]
```

Use of a [Stackdriver group](https://cloud.google.com/monitoring/groups/) is
optional but it may help in identifying a specific set of
resources to set up the alert for. Create a Stackdriver group with the three
instances to be able to manage your metrics together. Find the ID of the group
with the API Explorer using the
[groups.list](https://cloud.google.com/monitoring/api/ref_v3/rest/v3/projects.groups/list)
API. Note the ID of the group for use in the alert policy below.

Edit the file alert_policy.json, replacing or deleting the group.id. Create an
alert policy with the command

```shell
gcloud alpha monitoring policies create \
--notification-channels=$CHANNEL \
--policy-from-file=alert_policy.json
```

## Testing

Stop an instance

```shell
gcloud compute instances stop test-instance-1
```

Note the time

```shell
date
```

An alert should be generated in about 3 minutes with a subject like ‘One of the
timeseries is absent.’

Restart the instance

```shell
gcloud compute instances start test-instance-1
```

Wait until the instance is running.

Stop two instances

```shell
gcloud compute instances stop test-instance-1 test-instance-2
```

Check that only one alert is fired.

Stop all instances

```shell
gcloud compute instances stop test-instance-1 test-instance-2 test-instance-3
```

You should see an alert that indicates all timeseries are absent.