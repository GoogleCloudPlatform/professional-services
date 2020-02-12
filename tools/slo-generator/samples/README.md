# Samples

Library of SLOs samples to facilitate writing new SLOs by starting from already
written SLO configurations.

All samples are classified into a folder named after their respective backend
or exporter class.

Each sample contains environmental variables that you should be set prior to
running the samples.

## Environmental variables
The following is listing all environmental variables found in the SLO configs:

**Common:**
- `GAE_PROJECT_ID`: Google App Engine application project id.
- `PUBSUB_PROJECT_ID`: Pub/Sub project id.
- `PUBSUB_TOPIC_NAME`: Pub/Sub topic name.

**Per backend:**

`stackdriver/` and `stackdriver_service_monitoring/`:
  - `STACKDRIVER_HOST_PROJECT_ID`: Stackdriver host project id.

`elasticsearch/`:
  - `ELASTICSEARCH_URL`: ElasticSearch instance URL.

`prometheus/`:
  - `PROMETHEUS_URL`: Prometheus instance URL.
  - `PROMETHEUS_PUSHGATEWAY_URL`: Prometheus Pushgateway instance URL.

## Running the samples

To run the samples for a backend, set the appropriate environmental variables
for that backend, then from the root of the repository, run:

```
slo-generator -f samples/<backend> -b samples/<error_budget_policy>
```

where:
* `<backend>` is the backend name (lowercase)
* `<error_budget_policy>` is the path to the error budget policy YAML file.


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
