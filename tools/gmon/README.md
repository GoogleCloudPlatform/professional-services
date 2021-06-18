# Cloud Monitoring CLI

`gmon` is a command-line interface for Cloud Monitoring written in Python.

The CLI supports the following endpoints:

-   `metrics` _(GA)_: Manage Cloud Monitoring metrics.
-   `accounts` _(EAP)_: Manage Cloud Monitoring accounts.
-   `services` _(ALPHA)_: Manage Cloud Monitoring services.
-   `slos` _(ALPHA)_: Manage Cloud Monitoring service level objectives.

Other endpoints are available directly in `gcloud alpha monitoring`, and won't
be added to `gmon`, in particular:

-   `channel-descriptors`: _(ALPHA)_ Cloud Monitoring notification channel descriptors.
-   `channels`: _(ALPHA)_ Manage Cloud Monitoring notification channels.
-   `policies` _(ALPHA)_: Manage Cloud Monitoring alerting policies.
-   `dashboards` _(GA)_: Manage Cloud Monitoring dashboards.

The goal of this CLI is to fill the gap and simplify users life to query
monitoring endpoints in a more friendly manner and troubleshoot their monitoring
setups.

## Installation
Clone the repository, then run:
```
cd tools/gmon
python3 setup.py install
```

## Endpoints
### Metrics

The `gmon metrics` command allow one to interact with Google Cloud Monitoring metrics.

You can get more information on the command by running `gmon metrics --help`, but
here is a cheatsheet:
```sh
# List all metrics in project
gmon metrics list -p <PROJECT_ID>

# List specific metrics in project (regex)
gmon metrics list custom. -p <PROJECT_ID>
gmon metrics list "(^custom.|^external.)" -p <PROJECT_ID>

# Get metric descriptor
gmon metrics get vpn.googleapis.com/gateway/connections -p <PROJECT_ID>

# Inspect metrics time series (shows last datapoints written)
gmon metrics inspect istio.io/service/client/request_count -p <PROJECT_ID>
gmon metrics inspect istio.io/service/client/request_count -p <PROJECT_ID> --window 600 # seconds
gmon metrics inspect istio.io/service/client/request_count -p <PROJECT_ID> --filter resource.labels.container_name="my_container"
gmon metrics inspect istio.io/service/client/request_count -p <PROJECT_ID> --filter metric.labels.env=prod metric.labels.period="monitoring.regex.full_match(\".*d\")" # remind yourself to escape the quotes containing the regex

# Create custom metric descriptor
gmon metrics create test/metric -p <PROJECT_ID> --value-type DOUBLE --metric-kind GAUGE --description "Test metric"

# Delete metric (descriptor + timeseries)
gmon metrics delete custom.googleapis.com/test/metric -p <PROJECT_ID>

# Delete all custom metric descriptors in project. Be careful !
gmon metrics list custom. -p <PROJECT_ID> | xargs -P8 -I {} gmon metrics delete {} -p <PROJECT_ID>

# Find and delete unused metrics descriptors (interactive)
gmon metrics delete_unused external.googleapis.com/prometheus -p <PROJECT_ID>
```

`gmon metrics` also supports partial queries, meaning if it doesn't find an exact match,
it will ask for your input. For instance:

```
# Get metric descriptor
gmon metrics get flask_app -p <PROJECT_ID>

gmon.clients.monitoring - INFO - Metric type "flask_app" not found (no exact match). Trying with regex ...
gmon.clients.monitoring - INFO - Found multiple metrics matching regex.
0. external.googleapis.com/prometheus/flask_app_gunicorn_request_duration
1. external.googleapis.com/prometheus/flask_app_gunicorn_request_duration_count
2. external.googleapis.com/prometheus/flask_app_gunicorn_request_duration_sum
3. external.googleapis.com/prometheus/flask_app_gunicorn_request_status_200
4. external.googleapis.com/prometheus/flask_app_gunicorn_request_status_404
5. external.googleapis.com/prometheus/flask_app_gunicorn_requests
6. external.googleapis.com/prometheus/flask_app_gunicorn_workers
7. external.googleapis.com/prometheus/flask_app_hello_requests
Enter your choice: 5
{'metric': {'type': 'external.googleapis.com/prometheus/flask_app_gunicorn_requests'},
 'metricKind': 'CUMULATIVE',

 'points': [{'interval': {'endTime': '2020-08-04T10:38:59.787Z',
                          'startTime': '2020-08-04T09:16:59.787Z'},
             'value': {'doubleValue': 48710.0}},
            {'interval': {'endTime': '2020-08-04T10:38:29.787Z',
                          'startTime': '2020-08-04T09:16:59.787Z'},
             'value': {'doubleValue': 48412.0}}],
 'resource': {'labels': {'cluster_name': 'demo-flask',
                         'container_name': 'statsd-exporter',
                         'location': 'europe-west1',
                         'namespace_name': 'default',
                         'pod_name': 'flask-app-tutorial-5ddd9bdc9-8xc82',
                         'project_id': 'rnm-datadog-sd'},
              'type': 'k8s_container'},
 'valueType': 'DOUBLE'}
```

### Services
The `gmon services` command allow one to interact with Google Cloud Monitoring Services.
```
# List services
gmon services list -p <PROJECT_ID>

# Get service
gmon services get -p <PROJECT_ID> <SERVICE_ID>

# Create service
gmon services create -p <PROJECT_ID> <SERVICE_ID> <SERVICE_CONFIG_PATH>

# Delete service
gmon services delete -p <PROJECT_ID> <SERVICE_ID>
```

### Service Level Objectives
The `gmon slos` command allow one to interact with Google Cloud Monitoring Service Level Objectives.

```
# List SLOs for a service
gmon slos list -p <PROJECT_ID> <SERVICE_ID>

# Get SLO
gmon slos get -p <PROJECT_ID> <SERVICE_ID> <SLO_ID>

# Create SLO
gmon slos create -p <PROJECT_ID> --config <SLO_CONFIG> <SERVICE_ID>

# Update SLO
gmon slos update -p <PROJECT_ID> --config <SLO_CONFIG> <SERVICE_ID>

# Delete SLO
gmon slos delete -p <PROJECT_ID> <SERVICE_ID> <SLO_ID>
```

### Accounts

The `gmon accounts` command allow one to interact with Google Cloud Operations accounts (formerly Stackdriver workspaces).

To use the Cloud Operations Account client, you need to be whitelisted in the
EAP program for the Accounts API. Once you are whitelisted, get your API_KEY
and create an OAUTH2 key, and set them as env variables:

```sh
export GCP_OAUTH2_CREDENTIALS=/path/to/client_secret_<ID>.apps.googleusercontent.com.json
export GCP_API_KEY=<API_KEY>
```

Then, use the `gmon accounts` command to get / create an account, or link a project to an existing account:

```
# Get Cloud Operations account
gmon accounts get -p <PROJECT_ID>

# Create Cloud Operations account
gmon accounts create -p <PROJECT_ID>

# Link project with Cloud Operations account
gmon accounts link -p <PROJECT_ID> <PROJECT_ID_TO_LINK>
```
