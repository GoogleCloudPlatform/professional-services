# Stackdriver Monitoring

## How to use the Stackdriver backend

Using the `Stackdriver` backend class, you can query any metrics available in Stackdriver Monitoring to create an SLO.

The following methods are available to compute SLOs with the `Stackdriver` backend:

* `good_bad_ratio` for metrics of type `gauge`.
* `exponential_distribution_cut` for metrics of type `distribution`.

### Good / bad ratio

The `good_bad_ratio` method is used to compute the ratio between two metrics:

- **Good events**, i.e events we consider as 'good' from the user perspective.
- **Bad or valid events**, i.e events we consider either as 'bad' from the user perspective, or all events we consider as 'valid' for the computation of the SLO.

This method is often used for availability SLOs, but can be used for other purposes as well (see examples).

#### Example SLIs

**&rightarrow; Ratio of Pub/Sub acknowledged messages over all Pub/Sub messages**

> We want to compute the proportion of messages that are acknowledged from our Pub/Sub subscriptions.
>
> -- <cite>SRE Engineer</cite>

`Stackdriver Monitoring` has two service-level metrics we can use to measure this:

- `pubsub.googleapis.com/subscription/ack_message_count`
- `pubsub.googleapis.com/subscription/num_outstanding_messages`

Thus, we can define an **Availability SLI** using the `good_bad_ratio` method where the events considered are:

- **Good events:** Acknowledged Pub/Sub messages in a subscription.
- **Bad events:** Outstanding (unacknowledged) Pub/Sub messages in a subscription.

```yaml
backend:
  class: Stackdriver
  project_id: "${STACKDRIVER_HOST_PROJECT_ID}"
  method: good_bad_ratio
  measurement:
    filter_good: >
      project="${STACKDRIVER_METRIC_PROJECT_ID}" AND
      metric.type="pubsub.googleapis.com/subscription/ack_message_count"
    filter_bad: >
      project="${STACKDRIVER_METRIC_PROJECT_ID}" AND
      metric.type="pubsub.googleapis.com/subscription/num_outstanding_messages"
```
&nbsp;

**&rightarrow; Ratio of App Engine application requests with valid HTTP status codes**

> We want to compute the proportion of HTTP requests that return a valid HTTP code.
>
> -- <cite>SRE Engineer</cite>

`Stackdriver Monitoring` has a service-level metric we can use to measure this: `appengine.googleapis.com/http/server/response_count`. This metric has a label `response_code` that contains the HTTP response code.

The following configuration will compute an **Availability SLI** for an AppEngine application, using the `good_bad_ratio` method where the events considered are:

- **Good events:** HTTP responses with a status code between 200 and 500 (excluded).
- **Valid events:** HTTP responses with any status code.

```yaml
backend:
  class: Stackdriver
  project_id: "${STACKDRIVER_HOST_PROJECT}"
  method: good_bad_ratio
  measurement:
    filter_good: >
      project="${STACKDRIVER_METRIC_PROJECT}" AND
      metric.type="appengine.googleapis.com/http/server/response_count" AND
      metric.labels.response_code >= 200 AND
      metric.labels.response_code < 500
    filter_valid: >
      project="${STACKDRIVER_METRIC_PROJECT}" AND
      metric.type="appengine.googleapis.com/http/server/response_count"
```
&nbsp;

**&rightarrow; Ratio of custom application requests with valid HTTP status codes**

> We have a custom application sending performance logs to Stackdriver and we want to compute the proportion of HTTP requests that return a valid HTTP status code
>
> -- <cite>SRE Engineer</cite>

A common way to achieve this is to create a `Stackdriver Monitoring` **log-based metric** from your application logs using a regex to extract the HTTP code as one of the metric labels.

***Example:*** *A log-based metric `logging.googleapis.com/http/server/response_count` that has the `response_code` extracted as a label.*

The following configuration will compute an **Availability SLI** for a custom application, using the `good_bad_ratio` method where the events considered are:

* **Good events:** HTTP responses with a status code between 200 and 500 (excluded).
* **Valid events:** HTTP responses with any status code.

```yaml
backend:
  class: Stackdriver
  project_id: "${STACKDRIVER_HOST_PROJECT}"
  method: good_bad_ratio
  measurement:
    filter_good: >
      project="${STACKDRIVER_METRIC_PROJECT}" AND
      metric.type="logging.googleapis.com/http/server/response_count" AND
      metric.labels.response_code >= 200 AND
      metric.labels.response_code < 500
    filter_valid: >
      project="${STACKDRIVER_METRIC_PROJECT}" AND
      metric.type="logging.googleapis.com/http/server/response_count"
```


### Exponential distribution cut

The `exponential_distribution_cut` method is used for Stackdriver distribution-type metrics, which are usually used for latency metrics.

A distribution metric records the **statistical distribution of the extracted values** in **histogram buckets**. The extracted values are not recorded individually, but their distribution across the configured buckets are recorded, along with the `count`, `mean`, and `sum` of squared deviation of the values.

In `Stackdriver Monitoring`, there are three different ways to specify bucket boundaries:
* **Linear:** Every bucket has the same width.
* **Exponential:** Bucket widths increases for higher values, using an exponential growth factor.
* **Explicit:** Bucket boundaries are set for each bucket using a bounds array.

***Note:*** *Currently the SLO generator only support the exponential distributions. Those are the most common metrics on GCP and the reason we have priviledge their support, but we plan to add support for linear and explicit distribution metrics as well.*

#### Example SLIs

**&rightarrow; Proportion of App Engine HTTP requests under a threshold latency**

> We want to compute the proportion of HTTP requests that complete under 724 ms.
>
> -- <cite>SRE Engineer</cite>

```yaml
backend:
  class: Stackdriver
  project_id: ${STACKDRIVER_HOST_PROJECT_ID}
  method: exponential_distribution_cut
  measurement:
    filter_valid: >
      project=${STACKDRIVER_METRIC_PROJECT_ID} AND
      metric.type=appengine.googleapis.com/http/server/response_latencies AND
      metric.labels.response_code >= 200 AND
      metric.labels.response_code < 500
    good_below_threshold: true
    threshold_bucket: 19
```

The `threshold_bucket` number to reach our 724ms target latency will depend on how the buckets boundaries are set. Learn how to [inspect your distribution metrics](https://cloud.google.com/logging/docs/logs-based-metrics/distribution-metrics#inspecting_distribution_metrics) to figure out the bucketization.

## How to use the Stackdriver exporter

The `Stackdriver` exporter allows to export the error budget burn rate metric as a **custom Stackdriver metric** that we'll use for alerting:

 * The **metric type** is `custom.googleapis.com/error_budget_burn_rate` by default, but can be modified using the `metric_type` field in the exporter YAML.

 * The **metric descriptor** has labels describing our SLO, amongst which the `service_name`, `feature_name`, and `error_budget_policy_step_name` labels.

#### Example

> We want to track the error budgets for our service in real-time
>
> -- <cite>SRE Engineer</cite>

The following configuration will create the custom metric `error_budget_burn_rate` in `Stackdriver Monitoring`:

```yaml
exporters:
  - class: Stackdriver
    project_id: "${STACKDRIVER_HOST_PROJECT}"
```

## How to use Stackdriver to alert on high burn rates

Alerting is essential in any SRE approach. Having all the right metrics without being able to alert on them is simply useless.

Too many alerts can be daunting, and page your SRE engineers for no valid reasons.

Alerting on high burn rates on hand-picked SLOs can help resolve this problem.

#### Example

> We want to send alerts when our error budget burn rate is higher than the targets defined in our error budget policy file
>
> -- <cite>SRE Engineer</cite>

To alert on high error budget burn rates, we can define a `Stackdriver Monitoring` alert that we will filter out on the corresponding error budget step.

Consider the following error budget policy config:

```yaml
- error_budget_policy_step_name: 1 hour
  measurement_window_seconds: 3600
  alerting_burn_rate_threshold: 9
  urgent_notification: true
  overburned_consequence_message: Page the SRE team to defend the SLO
  achieved_consequence_message: Last hour on track
```

Using Stackdriver UI, you can set up an alert when our error budget burn rate is burning 9X faster than it should.

The burn rate alert should be set up as follow:

* Open `Stackdriver Monitoring` and click on `Alerting > Create Policy`

* Fill the alert name and click on `Add Condition`.

* Search for `custom/error_budget_burn_rate` and click on the metric.

* Filter on `error_budget_policy_step_name` label with value `1 hour`.

* Set the `Condition` field to `is above`.

* Set the `Threshold` field to `9`.

* Set the `For` field to `most_recent_value`.

* Click `Add`

* Fill the notification options for your alert.

* Click `Save`.

Repeat the above steps for every item in your error budget policy.

Alerts can be filtered out more (e.g: `service_name`, `feature_name`), but you can keep global ones if you want your SREs to have visibility on all the incidents.
