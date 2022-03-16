# STS Job Manager

Transferring large amounts of data, in the order of petabytes, between buckets can prove a challenge; from listing the objects, tracking the progress of the data transfer, to validating the data's integrity in the new bucket. This tool kit aims to make this task easier and relatively straightforward.

## What's Included

[`sts_job_manager.py`](./sts_job_manager.py)

- The main tool. This tool creates [Storage Transfer Service](https://cloud.google.com/storage-transfer-service) Jobs and records each job's state.

[`pause_all_jobs.py`](./pause_all_jobs.py)

- A tool for pausing all running STS Transfer Operations. This is useful for controlling the output of. The [`sts_job_manager.py`](./sts_job_manager.py) automatically resumes any paused operations during it's job management cycle.

[`prepare_tables.py`](./prepare_tables.py)

- This creates the dataset and tables if they do not exist. It can also load the job table with a list of prefixes.

[`remove_successful_one_time_jobs.py`](./remove_successful_one_time_jobs.py)

- A tool for removing successful one-time jobs with complete, successful, non-running operations.

## Getting Started

### Enable the Required APIs

The following [Cloud APIs](https://cloud.google.com/apis) are required to use this tool:

- BigQuery API
- Cloud Storage API
- Storage Transfer API

### Assign the Appropriate Permissions

#### STS Job Manager Permissions

Ensure the project's default Storage Transfer Service service account has the [required permissions](https://cloud.google.com/storage-transfer/docs/configure-access).

This tool requires an account ([user](https://cloud.google.com/iam/docs/overview#google_account) or [service account](https://cloud.google.com/iam/docs/service-accounts)) with the following permissions:

- `bigquery.datasets.create`
- `bigquery.jobs.create`
- `bigquery.tables.create`
- `bigquery.tables.getData`
- `bigquery.tables.updateData`
- `resourcemanager.projects.get`
- `storagetransfer.jobs.create`
- `storagetransfer.jobs.get`
- `storagetransfer.jobs.list`
- `storagetransfer.jobs.update`
- `storagetransfer.operations.cancel`
- `storagetransfer.operations.get`
- `storagetransfer.operations.list`
- `storagetransfer.operations.pause`
- `storagetransfer.operations.resume`
- `storagetransfer.projects.getServiceAccount`

The additional permissions are required if monitoring is enabled:

- `monitoring.metricDescriptors.create`
- `monitoring.metricDescriptors.get`
- `monitoring.metricDescriptors.list`
- `monitoring.monitoredResourceDescriptors.get`
- `monitoring.monitoredResourceDescriptors.list`
- `monitoring.timeSeries.create`

#### Pause All Jobs Permissions

Requires an account with the following permissions:

- `storagetransfer.operations.list`
- `storagetransfer.operations.pause`

#### Prepare Tables

Requires an account with the following permissions:

- `bigquery.datasets.create`
- `bigquery.tables.create`

The additional permissions are required if loading the job table with a list of prefixes:

- `bigquery.tables.updateData`

#### Remove Successful One-time Jobs

Requires an account with the following permissions:

- `storagetransfer.jobs.delete`
- `storagetransfer.jobs.list`
- `storagetransfer.operations.list`

### Choose Your Runtime

This toolkit can be ran via Docker container or directly via Python 3.7+.

#### Docker

A Dockerfile is be included in the source code for container use.

#### CLI

To run via CLI ensure [Python 3.7](https://www.python.org/), [`pip`](https://docs.python.org/3/installing/index.html), [`venv`](https://docs.python.org/library/venv.html), and the [Stackdriver Logging agent](https://cloud.google.com/logging/) agent are installed.

- Note standard installations of Python 3.7 include `pip` and `venv`.
- Note some installations, such as a [Container-Optimized OS](https://cloud.google.com/container-optimized-os/) with Logging configured upon its creation, has the Stackdriver Logging agent enabled

If you are running on macOS and have recently completed a major OS update or running on a fresh machine, run the following before the next step:

```sh
xcode-select --install
```

To prepare the Python setup, run the following:

```sh
# create a virtual environment
python3 -m venv .venv

# activate the virtual environment
source .venv/bin/activate

# install the required dependencies
pip install -r requirements.txt
```

### Prepare Your Environment

The tool will require [authentication for server to server production applications](https://cloud.google.com/docs/authentication/production). Conveniently, authentication is inherited when running applications via Compute Engine, Kubernetes Engine, App Engine, or Cloud Functions. In other environments, setting the [`GOOGLE_APPLICATION_CREDENTIALS`](https://cloud.google.com/docs/authentication/getting-started) environment variable will suffice. [Logging level](https://docs.python.org/library/logging.html#logging-levels) can be set via the `LOGLEVEL` environment variable.

### Prepare Your Database

Run the [`prepare_tables.py`](./prepare_tables.py) tool. Provided a `project_id` this will create a dataset (if one does not exist), create a job and job history tables in the dataset (if they do not exist), and populate the job table with a list of prefixes (provided a JSON file in `Array<string>` format).

## Monitoring

The STS Job Manager tool has the ability to publish a heartbeat to [Stackdriver](https://cloud.google.com/stackdriver/) with the overall job statuses on every interval (every `--sleep-timeout`). This can be enabled with `--publish-heartbeat`. If the Stackdriver project is not the same as the project inherited from the environment it can be changed with `--stackdriver-project`.

The heartbeat will be a Timeseries with type `custom.googleapis.com/sts_job_manager/status/{STATUS}`.

This heartbeat's corresponding metric will be [auto-created](https://cloud.google.com/monitoring/custom-metrics/creating-metrics#auto-creation) if it does not exist.

Additionally, [alerts](https://cloud.google.com/monitoring/alerts/) can be generated from these heartbeats.

## CLI Options

### CLI Options for STS Job Manager

```
usage: sts_job_manager.py [-h] [--dataset DATASET] [--dataset-location DATASET_LOCATION] [--job-table JOB_TABLE] [--job-history-table JOB_HISTORY_TABLE] [--config-path CONFIG_PATH] [--source-bucket SOURCE_BUCKET] [--destination-bucket DESTINATION_BUCKET] [--job-interval N] [--metrics-interval N] [--max-concurrent-jobs N] [--no-retry-on-job-error] [--allow-new-jobs-on-stalled] [--publish-heartbeat] [--stackdriver-project STACKDRIVER_PROJECT] [--overwrite-dest-objects] [--sleep-timeout N]

The STS Job Manager. This tool creates STS Jobs and records each job's state.

optional arguments:
  -h, --help                                        show this help message and exit
  --dataset DATASET                                 The name of the dataset to create and use (default: data_migration)
  --dataset-location DATASET_LOCATION               The location of the dataset (default: US)
  --job-table JOB_TABLE                             Name of the job table (default: sts_job)
  --job-history-table JOB_HISTORY_TABLE             Name of the job history table (default: sts_job_history)
  --config-path CONFIG_PATH                         A JSON config file with these commandline arguments (without the leading dashes). When an arg is found in both the config and commandline the config file arg will take precedence. (default: None)
  --source-bucket SOURCE_BUCKET                     The source bucket to transfer data from (default: migration-source)
  --destination-bucket DESTINATION_BUCKET           The destination bucket to transfer data to (default: migration-destination)
  --job-interval N                                  The amount of time between spinning up new jobs. Every job interval also runs a metrics interval. This should be >= `--sleep-timeout`. (default: 1200) (unit: seconds)
  --metrics-interval N                              Determines how often this tool gathers metrics. This should be >= `--sleep-timeout`. (default: 300) (unit: seconds)
  --max-concurrent-jobs N                           The max number of jobs allowed to run concurrently (default: 20)
  --no-retry-on-job-error                           Use this flag to disable the retrying of failed jobs. (default: False)
  --allow-new-jobs-when-stalled                     Allows new jobs to be spun up when jobs are stalled. This has the potential to allow more running STS jobs than `--max-concurrent-jobs`. (default: False)
  --publish-heartbeat                               Use this flag to enable publishing heartbeats to Stackdriver. (default: False)
  --stackdriver-project STACKDRIVER_PROJECT         The project to use when using Stackdriver. If `--publish-heartbeat` and this is not set, the project will inferred from the environment (default: None)
  --overwrite-dest-objects                          Determines if the `overwrite_objects_already_existing_in_sink` option will be used for newly created jobs. (default: False)
  --sleep-timeout N                                 Determines how long to sleep between running intervals. (default: 60) (unit: seconds)
```

### CLI Options for Preparing Tables

```
usage: prepare_tables.py [-h] [--dataset DATASET] [--dataset-location DATASET_LOCATION] [--job-prefix-source-file JOB_PREFIX_SOURCE_FILE] [--job-table JOB_TABLE] [--job-history-table JOB_HISTORY_TABLE]

Creates the dataset and tables if they do not exist. Loads the job table with a list of prefixes.

optional arguments:
  -h, --help                                        show this help message and exit
  --dataset DATASET                                 The name of the dataset to create and use (default: data_migration)
  --dataset-location DATASET_LOCATION               The location of the dataset (default: US)
  --job-prefix-source-file JOB_PREFIX_SOURCE_FILE   A JSON file with a list of prefixes in `Array<string>` format. Used when preparing tables. (default: None)
  --job-table JOB_TABLE                             Name of the job table (default: sts_job)
  --job-history-table JOB_HISTORY_TABLE             Name of the job history table (default: sts_job_history)
```

## Limits

When preparing a loaded table one may have to wait up to 90 minutes before [rows are available](https://cloud.google.com/bigquery/streaming-data-into-bigquery#dataavailability) for the STS Job Manager tool. It is recommended to follow the [latest limits on BigQuery's Data Manipulation Language (DML)](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-manipulation-language#limitations) while using this tool.

It is recommended to follow the latest [ramp-up practices for Google Cloud Storage](https://cloud.google.com/storage/docs/request-rate#ramp-up) for a smoother transfer experience.

## Debugging Failed Jobs

With large scale data transfers, the occasional transfer failure is expected. Running the following query will help you find and debug any failures:

```sql
SELECT *
FROM `data_migration.sts_job_history`
WHERE status = 'error';
```

See the failed objects in `operation_results` field.

Note the tool automatically retries failed jobs. This behavior can be disabled via `--no-retry-on-job-error`.
