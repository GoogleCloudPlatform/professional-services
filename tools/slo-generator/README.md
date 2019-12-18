# SLO Generator

`slo-generator` is a tool to compute **Service Level Objectives** ([SLOs](https://landing.google.com/sre/sre-book/chapters/service-level-objectives/)), **Error Budgets** and **Burn Rates**, using policies written in JSON format, and export the computation results to available
[exporters](#exporters).

## Description
`slo-generator` will query metrics backend and compute the following metrics:

* **Service Level Objective** defined as `SLO (%) = GOOD_EVENTS / VALID_EVENTS`
* **Error Budget** defined as `ERROR_BUDGET = 100 - SLO (%)`
* **Burn Rate** (speed at which you're burning the available error budget)

#### Policies
The **SLO policy** (JSON) defines which metrics backend (e.g: Stackdriver), what metrics, and defines SLO targets are expected. An example is available [here](./tests/unit/fixtures/slo_linear.json).

The **Error Budget policy** (JSON) defines the window to query, the alerting
Burn Rate Threshold, and notification settings. An example is available [here](./tests/unit/fixtures/error_budget_policy.json).

#### Metrics backends
`slo-generator` currently supports the following **metrics backends**:
- **Stackdriver Monitoring**

Support for more backends is planned for the future (feel free to send a PR !):
- Prometheus
- Grafana
- Stackdriver Logging
- Datadog

#### Exporters
**Exporters** can be configured to send **SLO Reports** to a destination.

`slo-generator` currently supports the following **exporters**:
- **Cloud Pub/Sub** for streaming export.
- **Stackdriver Monitoring** for exporting SLO metrics to Stackdriver Monitoring
(e.g: Burn Rate metric, SLO/SLI metric).
- **BigQuery** for exporting SLO report to BigQuery for deep analytics.

The exporters configuration is put in the SLO JSON config. See example in [tests/unit/fixtures/slo_linear.json](./tests/unit/fixtures/slo_linear.json).

## Basic usage (local)

**Requirements**

* Python 3
* gcloud SDK installed

**Installation**

`slo-generator` is published on PyPI. To install it, run:
```
pip install slo-generator
```

**Write an SLO config file**

See `slo.json` files in the [`tests/unit/fixtures/`](./tests/unit/fixtures) directory to write SLO definition files.

**Write an Error Budget Policy file**

See `error_budget_policy.json` files in the [`tests/unit/fixtures/`](./tests/unit/fixtures) directory to write
Error Budget Policy files.

**Run the `slo-generator`**

```
slo-generator --slo-config=<SLO_CONFIG_FILE> --error-budget-policy=<ERROR_BUDGET_POLICY>
```
  * `<SLO_CONFIG_FILE>` is the SLO config JSON file.

  * `<ERROR_BUDGET_POLICY>` is the Error Budget Policy JSON file.

Use `slo-generator --help` to list all available arguments.

## Usage in pipelines

Once the SLO measurement has been tested locally, it's a good idea to deploy a pipeline that will automatically compute SLO reports. This pipeline can be triggered on a schedule, or by specific events.

A few pipeline examples are given below.

### Cloud Functions
`slo-generator` is frequently used as part of an SLO Reporting Pipeline made of:

* A **Cloud Scheduler** triggering an event every X minutes.
* A **PubSub topic**, triggered by the Cloud Scheduler event.
* A **Cloud Function**, triggered by the PubSub topic, running `slo-generator`.
* A **PubSub topic** to stream computation results.


Other components can be added to make results available to other destinations:
* A **Cloud Function** to export SLO reports (e.g: to BigQuery and Stackdriver Monitoring), running `slo-generator`.
* A **Stackdriver Monitoring Policy** to alert on high budget Burn Rates.

Below is a diagram of what this pipeline looks like:

![Architecture](https://raw.githubusercontent.com/terraform-google-modules/terraform-google-slo/master/diagram.png)

**Benefits:**

* **Frequent SLO / Error Budget / Burn rate reporting** (max 1 every minute) with Cloud Scheduler.

* **Real-time visualization** by streaming results to DataStudio.

* **Historical analytics** by analyzing SLO data in Bigquery.

* **Real-time alerting** by setting up Stackdriver Monitoring alerts based on
wanted SLOs.

An example of pipeline automation with Terraform can be found [here](https://github.com/terraform-google-modules/terraform-google-slo/tree/master/examples/simple_example).

### Cloud Build
`slo-generator` can also be triggered in a Cloud Build pipeline. This can be useful if we want to compute some SLOs as part of a release process (e.g: to calculate a metric on each `git` commit or push)

To do so, you need to build an image for the `slo-generator` and push it to `Google Container Registry` in your project.

To build / push the image, run:

```sh
gcloud builds submit --config=cloudbuild.yaml . -s _PROJECT_NAME=<YOUR_PROJECT_NAME>
```

Once the image is built, you can call the Terraform generator using the following snippet in your `cloudbuild.yaml`:

```yaml
---
steps:

- name: gcr.io/${_PROJECT_NAME}/slo-generator
  args: ['--slo-config', '${_SLO_CONFIG_FILE}', '--error-budget-policy', '${_ERROR_BUDGET_POLICY_FILE}']
```

Then, in another repo containing your SLO definitions, simply run the pipeline, substituting the needed variables:

```sh
gcloud builds submit . --config=cloudbuild.yaml --substitutions \
  _SLO_CONFIG_FILE=<YOUR_SLO_CONFIG_FILE> \
  _ERROR_BUDGET_POLICY_FILE=<_ERROR_BUDGET_POLICY_FILE> \
  _WORKSPACE=<ENV>
```

If your repo is a Cloud Source Repository, you can also configure a trigger for
Cloud Build, so that the pipeline is run automatically when a commit is made:

```hcl
resource "google_cloudbuild_trigger" "dev-trigger" {
  trigger_template {
    branch_name = "dev"
    repo_name   = "my-repo"
  }

  substitutions = {
    _SLO_CONFIG_FILE = "slo.json"
    _ERROR_BUDGET_POLICY_FILE = "error_budget_policy.json"
    _WORKSPACE = "dev"
  }

  filename = "cloudbuild.yaml"
}

resource "google_cloudbuild_trigger" "prod-trigger" {
  trigger_template {
    branch_name = "master"
    repo_name   = "my-repo"
  }

  substitutions = {
    _SLO_CONFIG_FILE = "slo.json"
    _ERROR_BUDGET_POLICY_FILE = "error_budget_policy.json"
  }

  filename = "cloudbuild.yaml"
}
```
