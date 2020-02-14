# Stackdriver Service Monitoring

## Backend

Using the `StackdriverServiceMonitoring` backend class, you can use the
`Stackdriver Service Monitoring API` to manage your SLOs.

SLOs are created from standard metrics available in Stackdriver Monitoring and
the data is stored in `Stackdriver Service Monitoring API` (see [docs](https://cloud.google.com/monitoring/service-monitoring/using-api)).

The following methods are available to compute SLOs with the `Stackdriver` backend:

* `basic` to create standard SLOs for Google App Engine, Google Kubernetes
Engine, and Cloud Endpoints.
* `good_bad_ratio` for metrics of type `DELTA` or `CUMULATIVE`.
* `distribution_cut` for metrics of type `DELTA` and unit `DISTRIBUTION`.

### Basic

The `basic` method is used to let the `Stackdriver Service Monitoring API`
automatically generate standardized SLOs for the following GCP services:
* **Google App Engine**
* **Google Kubernetes Engine** (with Istio)
* **Google Cloud Endpoints**

The SLO configuration uses Stackdriver [GCP metrics](https://cloud.google.com/monitoring/api/metrics_gcp) and only requires
minimal configuration compared to custom SLOs.

**Example config (App Engine availability):**

```yaml
backend:
  class:          StackdriverServiceMonitoring
  method:         basic
  project_id:     ${STACKDRIVER_HOST_PROJECT_ID}
  measurement:
    app_engine:
      project_id:   ${GAE_PROJECT_ID}
      module_id:    ${GAE_MODULE_ID}
    availability: {}
```
For details on filling the `app_engine` fields, see [AppEngine](https://cloud.google.com/monitoring/api/ref_v3/rest/v3/services#appengine) spec.

**&rightarrow; [Full SLO config](../samples/stackdriver_service_monitoring/slo_gae_app_availability_basic.yaml)**

**Example config (Cloud Endpoint latency):**

```yaml
backend:
  class:         StackdriverServiceMonitoring
  method:        basic
  project_id:    ${STACKDRIVER_HOST_PROJECT_ID}
  measurement:
    cloud_endpoints:
      service:     ${ENDPOINT_URL}
    latency:
      threshold:   724 # ms
```
For details on filling the `cloud_endpoints` fields, see [CloudEndpoint](https://cloud.google.com/monitoring/api/ref_v3/rest/v3/services#cloudendpoints) spec.

**&rightarrow; [Full SLO config](../samples/stackdriver_service_monitoring/slo_endpoint_app_latency_basic.yaml)**

**Example config (Istio service latency):**
```yaml
backend:
  class:         StackdriverServiceMonitoring
  method:        basic
  project_id:    ${STACKDRIVER_HOST_PROJECT_ID}
  measurement:
    mesh_istio:
      mesh_uid:          ${GKE_MESH_UID}
      service_namespace: ${GKE_SERVICE_NAMESPACE}
      service_name:      ${GKE_SERVICE_NAME}
    latency:
      threshold: 500 # ms
```
For details on filling the `mesh_istio` fields, see [MeshIstio](https://cloud.google.com/monitoring/api/ref_v3/rest/v3/services#meshistio)
spec.

**&rightarrow; [Full SLO config](../samples/stackdriver_service_monitoring/slo_gke_app_latency_basic.yaml)**


### Good / bad ratio

The `good_bad_ratio` method is used to compute the ratio between two metrics:

- **Good events**, i.e events we consider as 'good' from the user perspective.
- **Bad or valid events**, i.e events we consider either as 'bad' from the user perspective, or all events we consider as 'valid' for the computation of the SLO.

This method is often used for availability SLOs, but can be used for other purposes as well (see examples).

**Example config:**
```yaml
backend:
  class: StackdriverServiceMonitoring
  project_id: "${STACKDRIVER_HOST_PROJECT_ID}"
  method: good_bad_ratio
  measurement:
    filter_good: >
      project="${GAE_PROJECT_ID}"
      metric.type="appengine.googleapis.com/http/server/response_count"
      resource.type="gae_app"
      metric.labels.response_code >= 200
      metric.labels.response_code < 500
    filter_valid: >
      project="${GAE_PROJECT_ID}"
      metric.type="appengine.googleapis.com/http/server/response_count"
```

You can also use the `filter_bad` field which identifies bad events instead of
the `filter_valid` field which identifies all valid events.

**&rightarrow; [Full SLO config](../samples/stackdriver_service_monitoring/slo_gae_app_availability.yaml)**

## Distribution cut

The `distribution_cut` method is used for Stackdriver distribution-type metrics, which are usually used for latency metrics.

A distribution metric records the **statistical distribution of the extracted values** in **histogram buckets**. The extracted values are not recorded individually, but their distribution across the configured buckets are recorded, along with the `count`, `mean`, and `sum` of squared deviation of the values.

**Example config:**

```yaml
backend:
  class: StackdriverServiceMonitoring
  project_id: ${STACKDRIVER_HOST_PROJECT_ID}
  method: distribution_cut
  measurement:
    filter_valid: >
      project=${GAE_PROJECT_ID}
      metric.type=appengine.googleapis.com/http/server/response_latencies
      metric.labels.response_code >= 200
      metric.labels.response_code < 500
    range_min: 0
    range_max: 724 # ms
```

The `range_min` and `range_max` are used to specify the latency range that we
consider 'good'.

**&rightarrow; [Full SLO config](../samples/stackdriver_service_monitoring/slo_gae_app_latency.yaml)**


## Service Monitoring API considerations

### Deleting objects

To delete an SLO object in `Stackdriver Monitoring API` using the `StackdriverServiceMonitoringBackend` class, run the `slo-generator` with the `-d` (or `--delete`) flag:

```
slo-generator -f <SLO_CONFIG_PATH> -b <ERROR_BUDGET_POLICY> --delete
```

### Limitations

Since `Stackdriver Service Monitoring API` persists objects, we need ways to keep our
local SLO YAML configuration synced with the remote objects.

The following naming conventions are used to give unique ids to your SLOs:

* `service_id = ${service_name}-${feature_name}`

* `slo_id = ${service_name}-${feature_name}-${slo_name}-${window}`

**As a consequence, here are some good practices:**

* To keep track of the `Service` and `ServiceLevelObjective` objects previously
created in the API, **do not update any of the following fields** in your
configs:

  * `service_name`, `feature_name` and `slo_name` in the SLO config.

  * `window` in the Error Budget Policy.

  If you need to make updates to those fields, first run the `slo-generator`
  with the `-d` (delete) option (see [#deleting-objects](#deleting-objects)),
  then run it normally.

* To persist `ServiceLevelObjective` objects, after creating your SLO the first
  time, add the following fields in your SLO config:

  * `service_id`: Existing `Service` id.
  * `slo_id`: Existing `ServiceLevelObjective` ids. The id will be suffixed with
  the `window` field for each step in the Error Budget Policy.

  If the SLO config in your YAML file differs from the remote config, the
  remote config will be updated to match yours.

* To import an existing `ServiceLevelObjective` object, find out your Service
  and SLO ids and fill the `service_id` and `slo_ids` fields with them. There
  must be one SLO id for each step in your Error Budget Policy.

## Alerting

See the Stackdriver Service Monitoring [docs](https://cloud.google.com/monitoring/service-monitoring/alerting-on-budget-burn-rate) for instructions on alerting.

### Examples

Complete SLO samples using `Stackdriver Service Monitoring` are available in [ samples/stackdriver_service_monitoring](../samples/stackdriver_service_monitoring). Check them out !
