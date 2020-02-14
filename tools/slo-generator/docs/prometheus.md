# Prometheus

## Backend

Using the `Prometheus` backend class, you can query any metrics available in
Prometheus to create an SLO.

The following methods are available to compute SLOs with the `Prometheus`
backend:

* `good_bad_ratio` for computing good / bad metrics ratios.
* `query_sli` for computing SLIs directly with Prometheus.

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
  class: Prometheus
  method: good_bad_ratio
  url: http://localhost:9090
  # headers:
  #   Content-Type: application/json
  #   Authorization: Basic b2s6cGFzcW==
  measurement:
    filter_good: prometheus_http_requests_total{code=~"2..", handler="/metrics"}[window]
    filter_valid: prometheus_http_requests_total{handler="/metrics"}[window]
```
* The `window` placeholder is needed in the query and will be replaced by the
corresponding `window` field set in each step of the Error Budget Policy.

* The `headers` section (commented) allows to specify Basic Authentication
credentials if needed.

**&rightarrow; [Full SLO config](../samples/prometheus/slo_prom_metrics_availability_good_bad.yaml)**


### Query SLI

The `query_sli` method is used to directly query the needed SLI with Prometheus:
indeed, Prometheus' `PromQL` language is powerful enough that it can do ratios
natively.

This method makes it more flexible to input any `PromQL` SLI computation and
eventually reduces the number of queries made to Prometheus.

See Bitnami's [article](https://engineering.bitnami.com/articles/implementing-slos-using-prometheus.html)
on engineering SLOs with Prometheus.

```yaml
backend:
  class:         Prometheus
  method:        query_sli
  url:           ${PROMETHEUS_URL}
  # headers:
  #   Content-Type: application/json
  #   Authorization: Basic b2s6cGFzcW==
  measurement:
    expression:  >
      sum(rate(prometheus_http_requests_total{code=~"2..", handler="/metrics"}[window]))
      /
      sum(rate(prometheus_http_requests_total{handler="/metrics"}[window]))
```
* The `window` placeholder is needed in the query and will be replaced by the
corresponding `window` field set in each step of the Error Budget Policy.

* The `headers` section (commented) allows to specify Basic Authentication
credentials if needed.

**&rightarrow; [Full SLO config](../samples/prometheus/slo_prom_metrics_availability_query_sli.yaml)**


## Exporter

The `Prometheus` exporter allows to export the error budget burn rate metric as
a **Prometheus metric** that can be used for alerting:

 * The **metric name** is `error_budget_burn_rate` by default, but can be
 modified using the `metric_type` field in the exporter YAML.

 * The **metric descriptor** has labels describing our SLO, amongst which the
 `service_name`, `feature_name`, and `error_budget_policy_step_name` labels.

The exporter pushes the metric to the `Prometheus`
[Pushgateway](https://prometheus.io/docs/practices/pushing/) which needs to be
running.

`Prometheus` needs to be setup to **scrape metrics from `Pushgateway`** (see
  [documentation](https://github.com/prometheus/pushgateway) for more details).

**Example config:**

```yaml
exporters:
 - class: Prometheus
   url: ${PUSHGATEWAY_URL}
```

Optional fields:
  * `metric_type`: Metric type / name. Defaults to `error_budget_burn_rate`.
  * `metric_description`: Metric description.
  * `username`: Username for Basic Auth.
  * `password`: Password for Basic Auth.
  * `job`: Name of `Pushgateway` job. Defaults to `slo-generator`.

**&rightarrow; [Full SLO config](../samples/prometheus/slo_prom_metrics_availability_query_sli.yaml)**


### Examples

Complete SLO samples using `Prometheus` are available in
[samples/prometheus](../samples/prometheus). Check them out !
