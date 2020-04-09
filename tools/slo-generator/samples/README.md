# SLO Library

This folder is an SLO library to facilitate writing new SLOs by starting from
already written SLO configurations.

All samples are classified into a folder named after their respective backend
or exporter class.

Each sample contains environmental variables that should be set prior to
running it.

## Environmental variables

The following is listing all environmental variables found in the SLO configs,
per backend:

`stackdriver/`:
  - `STACKDRIVER_HOST_PROJECT_ID`: Stackdriver host project id.
  - `STACKDRIVER_LOG_METRIC_NAME`: Stackdriver log-based metric name.
  - `GAE_PROJECT_ID`: Google App Engine application project id.
  - `GAE_MODULE_ID`: Google App Engine application module id.
  - `PUBSUB_PROJECT_ID`: Pub/Sub project id.
  - `PUBSUB_TOPIC_NAME`: Pub/Sub topic name.

`stackdriver_service_monitoring/`:
  - `STACKDRIVER_HOST_PROJECT_ID`: Stackdriver host project id.
  - `STACKDRIVER_LOG_METRIC_NAME`: Stackdriver log-based metric name.
  - `GAE_PROJECT_ID`: Google App Engine application project id.
  - `GAE_MODULE_ID`: Google App Engine application module id.
  - `PUBSUB_PROJECT_ID`: Pub/Sub project id.
  - `PUBSUB_TOPIC_NAME`: Pub/Sub topic name.
  - `GKE_PROJECT_ID`: GKE project id.
  - `GKE_LOCATION`: GKE location.
  - `GKE_CLUSTER_NAME`: GKE cluster name.
  - `GKE_SERVICE_NAMESPACE`: GKE service namespace.
  - `GKE_SERVICE_NAME`: GKE service name.

`elasticsearch/`:
  - `ELASTICSEARCH_URL`: ElasticSearch instance URL.

`prometheus/`:
  - `PROMETHEUS_URL`: Prometheus instance URL.
  - `PROMETHEUS_PUSHGATEWAY_URL`: Prometheus Pushgateway instance URL.

You can either set those variables for the backends you want to try, or set all
of those in an `.env` file and then `source` it. Note that the actual GCP resources
you're pointing to need to exist.

## Running the samples

To run one sample:
```
slo-generator -f samples/stackdriver/<filename>.yaml
```

To run all the samples for a backend:

```
slo-generator -f samples/<backend> -b samples/<error_budget_policy>
```
*where:*
* `<backend>` is the backend name (lowercase)
* `<error_budget_policy>` is the path to the error budget policy YAML file.

***Note:*** *if you want to enable the exporters as well, you can add the
`--export` flag.*


### Examples

##### Stackdriver
```
slo-generator -f samples/stackdriver -b error_budget_policy.yaml
```

##### Stackdriver Service Monitoring
```
slo-generator -f samples/stackdriver_service_monitoring -b error_budget_policy_ssm.yaml
```

***Note:*** *the Error Budget Policy is different for this backend, because it only
supports steps where the `window` is a multiple of 24 hours.*

##### Prometheus
```
slo-generator -f samples/prometheus -b error_budget_policy.yaml
```

##### Elasticsearch
```
slo-generator -f samples/elasticsearch -b error_budget_policy.yaml
```
