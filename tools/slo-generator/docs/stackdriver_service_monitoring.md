# Stackdriver Service Monitoring

## Backend

Using the `StackdriverServiceMonitoring` backend class, you can use the
Stackdriver Monitoring API to create SLOs.

SLOs are created from metrics available in Stackdriver Monitoring and the data
is stored in Stackdriver Service Monitoring API ([docs](https://cloud.google.com/monitoring/service-monitoring/using-api)).

The following methods are available to compute SLOs with the `Stackdriver` backend:

* `basic` to create standard SLOs for Google App Engine, Google Kubernetes
Engine, and Cloud Endpoints.
* `good_bad_ratio` for metrics of type `DELTA` or `CUMULATIVE`.
* `distribution_cut` for metrics of type `DELTA` and unit `DISTRIBUTION`.

### Basic

The `basic` method is used to let the Stackdriver Service Monitoring API
automatically generate 'standard' SLOs for our services.

Those SLOs are based of years of experience in designing SLOs and correspond to
good practices that Google advocates.

There is no configuration required for this type of SLO.

### Good / bad ratio

The `good_bad_ratio` method is used to compute the ratio between two metrics:

- **Good events**, i.e events we consider as 'good' from the user perspective.
- **Bad or valid events**, i.e events we consider either as 'bad' from the user perspective, or all events we consider as 'valid' for the computation of the SLO.

This method is often used for availability SLOs, but can be used for other purposes as well (see examples).

## Distribution cut

The `distribution_cut` method is used for Stackdriver distribution-type metrics, which are usually used for latency metrics.

A distribution metric records the **statistical distribution of the extracted values** in **histogram buckets**. The extracted values are not recorded individually, but their distribution across the configured buckets are recorded, along with the `count`, `mean`, and `sum` of squared deviation of the values.

In `Stackdriver Monitoring`, there are three different ways to specify bucket boundaries:
* **Linear:** Every bucket has the same width.
* **Exponential:** Bucket widths increases for higher values, using an exponential growth factor.
* **Explicit:** Bucket boundaries are set for each bucket using a bounds array.

### Limitations

Since `Stackdriver Monitoring` API persists objects, we need ways to keep our
local SLO YAML configuration synced with the remote objects.

The following naming conventions are used to give unique ids to your SLOs:

* `service_name = ${service_name}-${feature_name}`

* `slo_name = ${service_name}-${feature_name}-${slo_name}-${window}`

**As a consequence, do not update any of the following fields in your configs, or you will lose track of the objects previously created:**

* ***In the SLO config: `service_name`, `feature_name` and `slo_name`***

* ***In the Error Budget Policy: `window`***

If you need to makes changes to any of those fields, first delete the SLO (see [#deleting-objects](#deleting-objects)) and then recreate it.

You can also specify the `slo_id` field in your SLO configuration in order to
always keep the same id no matter the fields that you change.

### Deleting objects

To delete an SLO object in Stackdriver Monitoring API using the `StackdriverServiceMonitoringBackend` class, run the `slo-generator` with the `-d` (or `--delete`) flag:

```
slo-generator -f <SLO_CONFIG_PATH> -b <ERROR_BUDGET_POLICY> --delete
```

### Examples

Complete examples using the Stackdriver Service Monitoring backend are available in the `samples/` folder:

- [slo_gae_app_availability.yaml](../samples/stackdriver_service_monitoring/slo_gae_app_availability.yaml)
- [slo_gae_app_latency64ms.yaml](../samples/stackdriver_service_monitoring/slo_gae_app_latency64ms.yaml)
- [slo_gae_app_latency724ms.yaml](../samples/stackdriver_service_monitoring/slo_gae_app_latency724ms.yaml)
- [slo_lb_request_availability.yaml](../samples/stackdriver_service_monitoring/slo_lb_request_availability.yaml)
- [slo_lb_request_latency64ms.yaml](../samples/stackdriver_service_monitoring/slo_lb_request_latency64ms.yaml)
- [slo_lb_request_latency724ms.yaml](../samples/stackdriver_service_monitoring/slo_lb_request_latency724ms.yaml)

The following examples show how to populate the `backend` section for the Stackdriver backend.

**&rightarrow; Example 1: Ratio of Pub/Sub acknowledged messages over all Pub/Sub messages**

> We want to compute the proportion of messages that are acknowledged from our Pub/Sub subscriptions.
>
> -- <cite>SRE Engineer</cite>

`Stackdriver Monitoring` has two service-level metrics we can use to measure this:

- `pubsub.googleapis.com/subscription/ack_message_count`
- `pubsub.googleapis.com/subscription/num_outstanding_messages`

Thus, we can define a **Throughput SLI** using the `good_bad_ratio` method where the events considered are:

- **Good events:** Acknowledged Pub/Sub messages in a subscription.
- **Bad events:** Outstanding (unacknowledged) Pub/Sub messages in a subscription.

```yaml
backend:
  class: StackdriverServiceMonitoring
  project_id: "${STACKDRIVER_HOST_PROJECT_ID}"
  method: good_bad_ratio
  measurement:
    filter_good: >
      project="${PUBSUB_PROJECT_ID}"
      metric.type="pubsub.googleapis.com/subscription/ack_message_count"
    filter_bad: >
      project="${PUBSUB_PROJECT_ID}"
      metric.type="pubsub.googleapis.com/subscription/num_outstanding_messages"
```



&nbsp;

**&rightarrow; Example 2: Ratio of App Engine application requests with valid HTTP status codes**

> We want to compute the proportion of HTTP requests that return a valid HTTP code.
>
> -- <cite>SRE Engineer</cite>

`Stackdriver Monitoring` has a service-level metric we can use to measure this: `appengine.googleapis.com/http/server/response_count`. This metric has a label `response_code` that contains the HTTP response code.

The following configuration will compute an **Availability SLI** for an AppEngine application, using the `good_bad_ratio` method where the events considered are:

- **Good events:** HTTP responses with a status code between 200 and 500 (excluded).
- **Valid events:** HTTP responses with any status code.

```yaml
backend:
  class: StackdriverServiceMonitoring
  project_id: "${STACKDRIVER_HOST_PROJECT_ID}"
  method: good_bad_ratio
  measurement:
    filter_good: >
      project="${APP_PROJECT_ID}"
      metric.type="appengine.googleapis.com/http/server/response_count"
      resource.type="gae_app"
      metric.labels.response_code >= 200
      metric.labels.response_code < 500
    filter_valid: >
      project="${APP_PROJECT_ID}"
      metric.type="appengine.googleapis.com/http/server/response_count"
```

&nbsp;

**&rightarrow; Example 3: Ratio of custom application requests with valid HTTP status codes**

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
  class: StackdriverServiceMonitoring
  project_id: "${STACKDRIVER_HOST_PROJECT_ID}"
  method: good_bad_ratio
  measurement:
    filter_good: >
      project="${APP_PROJECT_ID}"
      metric.type="logging.googleapis.com/http/server/response_count"
      metric.labels.response_code >= 200
      metric.labels.response_code < 500
    filter_valid: >
      project="${APP_PROJECT_ID}"
      metric.type="logging.googleapis.com/http/server/response_count"
```

**&rightarrow; Example 4: Proportion of App Engine HTTP requests under a threshold latency**

> We want to compute the proportion of HTTP requests that complete under 724 ms.
>
> -- <cite>SRE Engineer</cite>

```yaml
backend:
  class: StackdriverServiceMonitoring
  project_id: ${STACKDRIVER_HOST_PROJECT_ID}
  method: distribution_cut
  measurement:
    filter_valid: >
      project=${APP_PROJECT_ID}
      metric.type=appengine.googleapis.com/http/server/response_latencies
      metric.labels.response_code >= 200
      metric.labels.response_code < 500
    range_min: 0
    range_max: 724 # ms
```

The `range_min` and `range_max` are used to specify the latency range that we
consider 'good'.

In this example we consider latencies between 0 and 724ms as 'good'.


## Alerting

See the [docs](https://cloud.google.com/monitoring/service-monitoring/alerting-on-budget-burn-rate) for instructions on alerting.
