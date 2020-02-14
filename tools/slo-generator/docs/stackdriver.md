# Stackdriver Monitoring

## Backend

Using the `Stackdriver` backend class, you can query any metrics available in
Stackdriver Monitoring to create an SLO.

The following methods are available to compute SLOs with the `Stackdriver`
backend:

* `good_bad_ratio` for metrics of type `DELTA`, `GAUGE`, or `CUMULATIVE`.
* `distribution_cut` for metrics of type `DELTA` and unit `DISTRIBUTION`.

### Good / bad ratio

The `good_bad_ratio` method is used to compute the ratio between two metrics:

- **Good events**, i.e events we consider as 'good' from the user perspective.
- **Bad or valid events**, i.e events we consider either as 'bad' from the user
perspective, or all events we consider as 'valid' for the computation of the
SLO.

This method is often used for availability SLOs, but can be used for other
purposes as well (see examples).

**Config example:**
```yaml
backend:
  class: Stackdriver
  project_id: "${STACKDRIVER_HOST_PROJECT_ID}"
  method: good_bad_ratio
  measurement:
    filter_good: >
      project="${GAE_PROJECT_ID}"
      metric.type="appengine.googleapis.com/http/server/response_count"
      metric.labels.response_code >= 200
      metric.labels.response_code < 500
    filter_valid: >
      project="${GAE_PROJECT_ID}"
      metric.type="appengine.googleapis.com/http/server/response_count"
```

You can also use the `filter_bad` field which identifies bad events instead of
the `filter_valid` field which identifies all valid events.

**&rightarrow; [Full SLO config](../samples/stackdriver/slo_gae_app_availability.yaml)**

### Distribution cut

The `distribution_cut` method is used for Stackdriver distribution-type metrics,
which are usually used for latency metrics.

A distribution metric records the **statistical distribution of the extracted
values** in **histogram buckets**. The extracted values are not recorded
individually, but their distribution across the configured buckets are recorded,
along with the `count`, `mean`, and `sum` of squared deviation of the values.

In `Stackdriver Monitoring`, there are three different ways to specify bucket
boundaries:
* **Linear:** Every bucket has the same width.
* **Exponential:** Bucket widths increases for higher values, using an
exponential growth factor.
* **Explicit:** Bucket boundaries are set for each bucket using a bounds array.

**Config example:**
```yaml
backend:
  class: Stackdriver
  project_id: ${STACKDRIVER_HOST_PROJECT_ID}
  method: exponential_distribution_cut
  measurement:
    filter_valid: >
      project=${GAE_PROJECT_ID} AND
      metric.type=appengine.googleapis.com/http/server/response_latencies AND
      metric.labels.response_code >= 200 AND
      metric.labels.response_code < 500
    good_below_threshold: true
    threshold_bucket: 19
```
**&rightarrow; [Full SLO config](../samples/stackdriver/slo_gae_app_latency.yaml)**

The `threshold_bucket` number to reach our 724ms target latency will depend on
how the buckets boundaries are set. Learn how to [inspect your distribution metrics](https://cloud.google.com/logging/docs/logs-based-metrics/distribution-metrics#inspecting_distribution_metrics) to figure out the bucketization.

## Exporter

The `Stackdriver` exporter allows to export the error budget burn rate metric as
a **custom Stackdriver metric** that we'll use for alerting:

 * The **metric type** is `custom.googleapis.com/error_budget_burn_rate` by
 default, but can be modified using the `metric_type` field in the exporter YAML.

 * The **metric descriptor** has labels describing our SLO, amongst which the
 `service_name`, `feature_name`, and `error_budget_policy_step_name` labels.

**Example config:**

The following configuration will create the custom metric
`error_budget_burn_rate` in `Stackdriver Monitoring`:

```yaml
exporters:
  - class: Stackdriver
    project_id: "${STACKDRIVER_HOST_PROJECT_ID}"
```

Optional fields:
* `metric_type`: Metric type / name. Defaults to `error_budget_burn_rate`.
* `metric_description`: Metric description.

**&rightarrow; [Full SLO config](../samples/stackdriver/slo_lb_request_availability.yaml)**

## Alerting

Alerting is essential in any SRE approach. Having all the right metrics without
being able to alert on them is simply useless.

**Too many alerts** can be daunting, and page your SRE engineers for no valid
reasons.
**Too little alerts** can mean that your applications are not monitored at all
(no application have 100% reliability).

**Alerting on high error budget burn rates** for some hand-picked SLOs can help
reduce the noise and page only when it's needed.

**Example:**

We will define a `Stackdriver Monitoring` alert that we will **filter out on the
corresponding error budget step**.

Consider the following error budget policy config:

```yaml
- error_budget_policy_step_name: 1 hour
  measurement_window_seconds: 3600
  alerting_burn_rate_threshold: 9
  urgent_notification: true
  overburned_consequence_message: Page the SRE team to defend the SLO
  achieved_consequence_message: Last hour on track
```

Using Stackdriver UI, let's set up an alert when our error budget burn rate is
burning **9X faster** than it should in the last hour:

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

Alerts can be filtered out more (e.g: `service_name`, `feature_name`), but you
can keep global ones filtered only on `error_budget_policy_step_name` if you
want your SREs to have visibility on all the incidents. Labels will be used to
differentiate the alert messages.

## Examples

Complete SLO samples using `Stackdriver` are available in
[samples/stackdriver](../samples/stackdriver). Check them out !
