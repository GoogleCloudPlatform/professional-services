# Airflow States Collector 
 
This tool creates an Airflow Dag which incrementally collects DagRun and TaskInstance metadata information and stores the information to a BigQuery Table. 
The tool also creates a BQ View which de-duplicates data, and gets latest state for every taskinstance. Then it creates a LookerStudio Dashboard on the BQ view.

Both Airflow1 and Airflow2 are supported.

State Information Captured by the tool:
- DagRuns: DagId, runId, run_start_ts, run_end_ts
- TaskInstance: Id, job_id, operator, start_ts, end_ts, updated_ts

## Architecture  
![plot](resources/readme/images/architecture.png?raw=true)

## Install Dependencies
Python Version : 3.9

1)  Install ```pip```_ and ```virtualenv```_ if you do not already have them.
    You may want to refer to the ```Python Development Environment Setup Guide``` for Google Cloud Platform for instructions.

Python Development Environment Setup Guide:
https://cloud.google.com/python/setup

2) Cd to project folder

3) Create a virtualenv.

    ```
    $ virtualenv --python python3 env
    $ source env/bin/activate
    ```

4) Install the dependencies needed to run the samples.

   `$ pip install -r requirements.txt`

5) For Client authentication, execute:  
`gcloud auth application-default login`

Now the environment is ready !

**References:**   
* pip: https://pip.pypa.io/
* virtualenv: https://virtualenv.pypa.io/
* Google Cloud SDK: https://cloud.google.com/sdk/

## Usage 

```
python airflow_states_collector.py  [-h / --help] \
    --bq-storage-project-id BQ_STORAGE_PROJECT_ID \ 
    --dags-gcs-folder DAGS_GCS_FOLDER \
    --ndays-history NDAYS_HISTORY \
    --airflow-version {1,2} \
    [--bq-billing-project-id BQ_BILLING_PROJECT_ID] \ 
    [--bq-storage-dataset BQ_STORAGE_DATASET] \
    [--bq-dataset-location BQ_DATASET_LOCATION] \ 
    [--bq-table-name BQ_TABLE_NAME] \
    [--bq-partition-expiry-days BQ_PARTITION_EXPIRY_DAYS] \
    [--bq-view-name BQ_VIEW_NAME] \
    [--airflow-dag-filename AIRFLOW_DAG_FILENAME] \
    [--airflow-dagid AIRFLOW_DAGID] \
    [--airflow-dag-schedule AIRFLOW_DAG_SCHEDULE] \ 
    [--skip-dagids SKIP_DAGIDS] \
    [--report-name REPORT_NAME] \
    [--bq-insert-batch-size BQ_INSERT_BATCH_SIZE] \
```

### Arguments

|          Argument           | Description                                                                                                                                 |
|:---------------------------:|---------------------------------------------------------------------------------------------------------------------------------------------|
|   --bq-storage-project-id   | (Required) BigQuery Project where airflow States BQ table and views will be created                                                         |
|      --dags-gcs-folder      | (Required) Airflow DAG folder GCS path. Eg: gs://<bucket-name>/dags                                                                         |
|       --ndays-history       | (Required) Number of days for historic States collection of all airflow Dags                                                                |
|      --airflow-version      | (Required) Airflow Version. Choose between 1 or 2                                                                                           |
|   --bq-billing-project-id   | (Optional) BigQuery Project which will be billed for Dashboard Queries. Defaults to storage project                                         |
|    --bq-storage-dataset     | (Optional) BigQuery Dataset for storing airflow States tables. Defaults to 'airflow'                                                        |
|    --bq-dataset-location    | (Optional) BigQuery Dataset Location. Ideal if its in the same location as airflow. Defaults to 'US'                                        |
|       --bq-table-name       | (Optional) BigQuery Airflow states Table Name. Defaults to 'airflow_states'                                                                 |
| --bq-partition-expiry-days  | (Optional) Number of latest partitions to keep in the Airflow States table. Default to 30 days                                              |
|       --bq-view-name        | (Optional) BigQuery Airflow states View Name which contains latest record for every dagrun's task. Defaults to 'airflow_latest_states_view' |
|   --airflow-dag-filename    | (Optional) Airflow dag file name to be stored in GCS. Defaults to 'dag_airflow_states_collector.py'                                         |
|       --airflow-dagid       | (Optional) Airflow dag ID. Defaults to 'airflow_states_collector'                                                                           |
|   --airflow-dag-schedule    | (Optional) Airflow dag schedule. Defaults to every 5 mins i.e. '*/5 * * * *'                                                                |
|        --skip-dagids        | (Optional) Airflow DagIds (comma-seperated) to be skipped for states collection. Defaults to 'airflow_monitoring'                           |
|        --report-name        | (Optional) LookerStudio dashboard name that will be created. Defaults to 'Airflow States Dashboard'                                         |
|   --bq-insert-batch-size    | (Optional) Number of records in single BQ Insert Query. Defaults to 150. Decrease this value if you observe BQ Query max length failures    |


### Examples: 
#### Airflow 1 
```
python airflow_states_collector.py \
   --bq-storage-project-id=nikunjbhartia-test-clients \
   --airflow-version=1 \
   --dags-gcs-folder=gs://us-central1-test-278acd57-bucket/dags \
   --ndays-history=5 \
   --skip-dagids=''
   
```

### Airflow 2
Below example also skips 2 dags for states collection: airflow monitoring and current dag.   
Same flags can be used in Airflow1 example above as well. 
```
python airflow_states_collector.py \
   --bq-storage-project-id=nikunjbhartia-test-clients \
   --airflow-version=2 \
   --dags-gcs-folder=gs://us-central1-test-278acd57-bucket/dags \
   --ndays-history=5 \
   --airflow-dagid=airflow-states-collector \
   --skip-dagids='airflow-monitoring,airflow-states-collector'
   
```

## Sample Dashboard  
![plot](resources/readme/images/dashboard_ss1.png?raw=true)
![plot](resources/readme/images/dashboard_ss2.png?raw=true)
![plot](resources/readme/images/dashboard_ss3.png?raw=true)