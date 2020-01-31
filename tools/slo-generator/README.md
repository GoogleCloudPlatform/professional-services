# SLO Generator

`slo-generator` is a tool to compute and export **Service Level Objectives** ([SLOs](https://landing.google.com/sre/sre-book/chapters/service-level-objectives/)),
**Error Budgets** and **Burn Rates**, using policies written in JSON or YAML format.

## Description
`slo-generator` will query metrics backend and compute the following metrics:

* **Service Level Objective** defined as `SLO (%) = GOOD_EVENTS / VALID_EVENTS`
* **Error Budget** defined as `ERROR_BUDGET = 100 - SLO (%)`
* **Burn Rate** defined as `BURN_RATE = ERROR_BUDGET / ERROR_BUDGET_TARGET`

## Local usage

**Requirements**

* Python 3
* gcloud SDK installed

**Installation**

`slo-generator` is published on PyPI. To install it, run:

```sh
pip3 install slo-generator
```

**Run the `slo-generator`**

```
slo-generator -f <SLO_CONFIG_PATH> -b <ERROR_BUDGET_POLICY>
```
  * `<SLO_CONFIG_PATH>` is the [SLO config](#slo_configuration) file or folder.
    If a folder path is passed, the SLO configs filenames should match the pattern `slo_*.yaml` to be loaded.

  * `<ERROR_BUDGET_POLICY>` is the [Error Budget Policy](#error_budget_policy) file.

Use `slo-generator --help` to list all available arguments.

To enable debug logs, set the environment variable `DEBUG` to `1` before running the `slo-generator`:

```
export DEBUG=1
```

## Configuration

The `slo-generator` requires two configuration files to run, the **SLO configuration** file and the **Error budget policy** file.

**SLO configuration**

The **SLO configuration** (JSON or YAML) is composed of the following fields:

* **SLO metadata**:
  * `slo_name`: Name of this SLO.
  * `slo_description`: Description of this SLO.
  * `slo_target`: SLO target (between 0 and 1).
  * `service_name`: Name of the monitored service.
  * `feature_name`: Name of the monitored subsystem.


* **SLI configuration**:
  * `backend`: Specific documentation and examples are available for each supported backends:
    * [Stackdriver Monitoring](docs/stackdriver.md)
    * [Prometheus](docs/prometheus.md)
    * [ElasticSearch](docs/elasticsearch.md)


- **Exporter configuration**:
  * `exporters`: A list of exporters to export results to. Specific documentation is available for each supported exporters:
      * [Cloud Pub/Sub](docs/pubsub.md) to stream SLO reports.
      * [BigQuery](docs/bigquery.md) to export SLO reports to BigQuery for historical analysis and DataStudio reporting.
      * [Stackdriver Monitoring](docs/stackdriver.md#how-to-use-the-stackdriver-exporter) to export the `error_budget_burn_rate` metric to Stackdriver Monitoring.
      * [Prometheus](docs/prometheus.md#how-to-use-the-prometheus-exporter) to export the `error_budget_burn_rate` metric to Prometheus.

***Note:*** *you can use environment variables in your SLO configs by using `${}` syntax to avoid having sensitive data in version control. Environment variables will be replaced at run time.*

==> An example SLO configuration file is available [here](samples/slo_sd_gae_app_availability.yaml).

**Error Budget policy**

The **Error Budget policy** (JSON or YAML) is a list of multiple error budgets, each one composed of the following fields:

* `window`: Time window for this error budget.
* `alerting_burn_rate_threshold`: Target burnrate threshold over which alerting is needed.
* `urgent_notification`: boolean whether violating this error budget should trigger a page.
* `overburned_consequence_message`: message to show when the error budget is above the target.
* `achieved_consequence_message`: message to show when the error budget is within the target.

==> An example Error Budget policy is available [here](tests/unit/fixtures/error_budget_policy.yaml).


## Extending the SLO generator

The `slo-generator` tool is designed to add more backends and exporters as it moves forward. Users, customers and Google folks should be able to easily add the metrics backend or the export of their choosing.

To prepare for development, you need to fork this repository and work on your own branch so that you can later submit your changes as a GitHub Pull Request.

Once you have forked the repo on GitHub, clone it locally and install the `slo-generator` in a Python virtual environment:
```
git clone https://<your_fork>/professional-services
cd professional-services/tools/slo-generator
python3 -m venv venv/
source venv/bin/activate
```

Install `slo-generator` locally in development mode, so that you can start making changes to it:
```
python setup.py develop
```

**New backend**

To add a new backend, one must:

* Add a new file `slo-generator/backends/<backend>.py`

* Write a new Python class called `<Backend>` (capitalized) that inherits from `slo_generator.backends.base.MetricBackend`:

***Example with a fake Datadog backend:***

* Add a new backend file:

  ```sh
  touch slo-generator/backends/datadog.py
  ```

* Fill the content of `datadog.py`:

  ```python
  from slo_generator.backends.base import MetricBackend

  class Datadog(MetricBackend):
    def __init__(self, **kwargs):
      # instantiate your client here, or do nothing if your backend
      # doesn't need it.
      url = kwargs['url']
      self.client = DatadogClient(url)

    def query(self, *args, **kwargs):
      # add code to query your backend here.
      return self.client.query(*args, **kwargs)

    @staticmethod
    def count(timeseries):
      # add code to count the number of events in the timeseries returned

    def good_bad_ratio(self, *kwargs):
      # this should return a tuple `(good_event_count, bad_event_count)`
      # or a float `SLI value`.
      good_event_query = kwargs['measurement']['filter_good']
      bad_event_query = kwargs['measurement']['filter_bad']
      good_timeseries = self.query(good_event_query)
      bad_timeseries = self.query(bad_event_query)
      good_count = Datadog.count(good_timeseries)
      bad_count = Datadog.count(bad_timeseries)
      return (good_count, bad_count)

    def my_random_method():
      # this should return a tuple `(good_event_count, bad_event_count)`
      # or a float `SLI value`.
      my_sli_value = self.compute_random_stuff()
      return my_sli_value
  ```
* Write a sample SLO configs (`slo_test.yaml`):

  ```yaml
  service_name: test
  feature_name: test
  slo_name: datadog
  slo_description: Test Datadog SLO
  backend:
    class: Datadog
    url: datadog.mycompany.com
    measurement:
      filter_good: avg:system.disk.free{*}.rollup(avg, {window})
      filter_valid: avg:system.disk.used{*}.rollup(avg, {window})
  ```

* Run a test with the SLO generator:
  ```sh
  slo-generator --slo-config=slo_test.yaml --error_budget_policy=budget.yaml
  ```

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
