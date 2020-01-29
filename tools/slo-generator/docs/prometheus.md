# Prometheus

## How to use the Prometheus backend

Using the `Prometheus` backend class, you can query any metrics available in Prometheus to create an SLO.

The following methods are available to compute SLOs with the `Prometheus` backend:

* `good_bad_ratio` for computing good / bad metrics ratios.
* `query_sli` for computing SLIs directly with Prometheus.

### Good / bad ratio

The `good_bad_ratio` method is used to compute the ratio between two metrics:

- **Good events**, i.e events we consider as 'good' from the user perspective.
- **Bad or valid events**, i.e events we consider either as 'bad' from the user perspective, or all events we consider as 'valid' for the computation of the SLO.

This method is often used for availability SLOs, but can be used for other purposes as well (see examples).

#### Example SLIs

**&rightarrow; Ratio of requests to Prometheus API with valid HTTP status codes**

***"We want to compute the proportion of HTTP requests that return a valid HTTP code."***

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

### Query SLI

The `query_sli` method is used to directly query the needed SLI with Prometheus: indeed, Prometheus' `PromQL` language is powerful enough that it can do ratios natively.

Consequently, this method makes it more flexible to input any PromQL SLI computation and eventually reduces the number of queries made to Prometheus.

#### Example SLIs

**&rightarrow; Ratio of requests to Prometheus API with valid HTTP status codes**

***"We want to compute the proportion of HTTP requests that return a valid HTTP code."***

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
