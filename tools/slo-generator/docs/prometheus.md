# Prometheus

## Backend

Using the `Prometheus` backend class, you can query any metrics available in Prometheus to create an SLO.

The following methods are available to compute SLOs with the `Prometheus` backend:

* `good_bad_ratio` for computing good / bad metrics ratios.
* `query_sli` for computing SLIs directly with Prometheus.

### Good / bad ratio

The `good_bad_ratio` method is used to compute the ratio between two metrics:

- **Good events**, i.e events we consider as 'good' from the user perspective.
- **Bad or valid events**, i.e events we consider either as 'bad' from the user perspective, or all events we consider as 'valid' for the computation of the SLO.

This method is often used for availability SLOs, but can be used for other purposes as well (see examples).

### Query SLI

The `query_sli` method is used to directly query the needed SLI with Prometheus: indeed, Prometheus' `PromQL` language is powerful enough that it can do ratios natively.

Consequently, this method makes it more flexible to input any PromQL SLI computation and eventually reduces the number of queries made to Prometheus.

See Bitnami's [article](https://engineering.bitnami.com/articles/implementing-slos-using-prometheus.html) on engineering SLOs with Prometheus.

### Examples

Complete examples using the `Prometheus` backend are available in the `samples/` folder:

- [slo_sd_pubsub_throughput.yaml](../samples/slo_sd_pubsub_throughput.yaml)
- [slo_sd_gae_app_availability.yaml](../samples/slo_sd_gae_app_availability.yaml)
- [slo_sd_gae_app_latency64ms.yaml](../samples/slo_sd_gae_app_latency64ms.yaml)
- [slo_sd_gae_app_latency724ms.yaml](../samples/slo_sd_gae_app_latency724ms.yaml)

The following examples show how to populate the `backend` section for the Prometheus backend.

**&rightarrow; Example 1: Ratio of requests to Prometheus API with valid HTTP status codes**

> We want to compute the proportion of HTTP requests that return a
> valid HTTP code.
>
> -- <cite>SRE Engineer</cite>

Example config:

```yaml
backend:
  class: Prometheus
  method: good_bad_ratio
  url: http://localhost:9090
  # headers:
  #   Content-Type: application/json
  #   Authorization: Basic b2s6cGFzcW==
  measurement:
    filter_good: prometheus_http_requests_total{code=~"2..", handler="/metrics"}[window]
    filter_valid: prometheus_http_requests_total{handler="/metrics"}[window]
    # filter_bad: prometheus_http_requests_total{code=~"5..", handler="/metrics"}[window]  # use as alternative to `filter_valid` field
```

***Note:*** *the `window` placeholder is needed in the query and will be replaced by the corresponding `window` field set in the `error_budget_policy.yaml`.*

**&rightarrow; Example 2: Ratio of requests to Prometheus API with valid HTTP status codes**

> We want to compute the proportion of HTTP requests that return a
> valid HTTP code.
>
> -- <cite>SRE Engineer</cite>

Example config:

```yaml
backend:
  class: Prometheus
  method: query_sli
  url: http://localhost:9090
  # headers:
  #   Content-Type: application/json
  #   Authorization: Basic b2s6cGFzcW==  # username:password
  measurement:
    expression: >
      sum(rate(prometheus_http_requests_total{code=~"2..", handler="/metrics"}[window]))
      /
      sum(rate(prometheus_http_requests_total{handler="/metrics"}[window]))
```

***Note:*** *the `window` placeholder is needed in the query and will be replaced by the corresponding `window` field set in the `error_budget_policy.yaml`.*

## Exporter

The `Prometheus` exporter allows to export the error budget burn rate metric as a **Prometheus metric** that can be used for alerting:

 * The **metric name** is `error_budget_burn_rate` by default, but can be modified using the `metric_type` field in the exporter YAML.

 * The **metric descriptor** has labels describing our SLO, amongst which the `service_name`, `feature_name`, and `error_budget_policy_step_name` labels.

The exporter pushes the metric to the Prometheus [Pushgateway](https://prometheus.io/docs/practices/pushing/) which needs to be running.

Prometheus needs to be setup to scrape metrics from the Pushgateway (see [documentation](https://github.com/prometheus/pushgateway) for more details).


### Example

> We want to track the error budgets for our service in real-time.
>
> -- <cite>SRE Engineer</cite>.

Example config:

```yaml
exporters:
 - class: Prometheus
   # Optional fields
   url: http://localhost:9091               # Prometheus pushgateway URL
   username: ${PUSHGATEWAY_USERNAME}        # Basic auth username
   password: ${PUSHGATEWAY_PASSWORD}        # Basic auth password
   job: sample_job                          # Name of pushgateway job
   metric_type: error_budget_burn_rate_app1 # Name of metric to push
   metric_description: Error budget burn rate (gauge) for App1
```
