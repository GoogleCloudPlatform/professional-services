# Datadog

## Backend

Using the `Datadog` backend class, you can query any metrics available in
Datadog to create an SLO.

The following methods are available to compute SLOs with the `Datadog`
backend:

* `good_bad_ratio` for computing good / bad metrics ratios.
* `query_sli` for computing SLIs directly with Datadog.
* `query_slo` for getting SLO value from Datadog SLO endpoint.

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
  class:   Datadog
  method:  good_bad_ratio
  api_key: ${DATADOG_API_KEY}
  app_key: ${DATADOG_APP_KEY
  measurement:
    filter_good: sum:system.disk.used{*}
    filter_valid: sum:system.disk.total{*}
```
**&rightarrow; [Full SLO config](../samples/datadog/slo_dd_disk_utilization_ratio.yaml)**


### Query SLI

The `query_sli` method is used to directly query the needed SLI with Datadog:
indeed, Datadog's query language is powerful enough that it can do ratios
natively.

This method makes it more flexible to input any `Datadog` SLI computation and
eventually reduces the number of queries made to Datadog.

```yaml
backend:
  class:   Datadog
  method:  query_sli
  api_key: ${DATADOG_API_KEY}
  app_key: ${DATADOG_APP_KEY
  measurement:
    expression: sum:system.disk.used{*} / sum:system.disk.total{*}
```

**&rightarrow; [Full SLO config](../samples/datadog/slo_dd_disk_utilization_query_sli.yaml)**

### Query SLO

The `query_slo` method is used to directly query the needed SLO with Datadog:
indeed, Datadog has SLO objects that you can directly refer to in your config by inputing their `slo_id`.

This method makes it more flexible to input any `Datadog` SLI computation and
eventually reduces the number of queries made to Datadog.

To query the value from Datadog SLO, simply add a `slo_id` field at the top level of your configuration.

```yaml
slo_id:  ${DATADOG_SLO_ID}
...
backend:
  class:   Datadog
  method:  query_sli
  api_key: ${DATADOG_API_KEY}
  app_key: ${DATADOG_APP_KEY
```

**&rightarrow; [Full SLO config](../samples/datadog/slo_dd_disk_utilization_query_slo.yaml)**

### Examples

Complete SLO samples using `Datadog` are available in
[samples/datadog](../samples/datadog). Check them out !
