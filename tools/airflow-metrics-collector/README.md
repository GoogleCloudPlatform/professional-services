# Airflow Metrics Collector 

Python Version : 3.9

## Install Dependencies


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

Now the environment is ready !

* pip: https://pip.pypa.io/
* virtualenv: https://virtualenv.pypa.io/
* Google Cloud SDK: https://cloud.google.com/sdk/

## Usage 
```
airflow_metrics_collector.py [-h] \
   --bq-storage-project-id BQ_STORAGE_PROJECT_ID \
   --dags-gcs-folder DAGS_GCS_FOLDER \
   --ndays-history NDAYS_HISTORY \
   --airflow-version {1,2} \
   --bq-billing-project-id BQ_BILLING_PROJECT_ID \
   --bq-storage-dataset BQ_STORAGE_DATASET
   --bq-dataset-location BQ_DATASET_LOCATION \
   --bq-table-name BQ_TABLE_NAME
   --bq-view-name BQ_VIEW_NAME \
   --airflow-dag-filename AIRFLOW_DAG_FILENAME \
   --airflow-dagid AIRFLOW_DAGID \
   --airflow-dag-schedule AIRFLOW_DAG_SCHEDULE \
   --skip-dagids SKIP_DAGIDS \ 
   --report-name REPORT_NAME
```

Example: 
```
python airflow_metrics_collector.py \
   --bq-storage-project-id=nikunjbhartia-test-clients \
   --airflow-version=2 \
   --dags-gcs-folder=gs://us-central1-test-278acd57-bucket/dags \
   --ndays-history=5 \
   --skip-dagids=['']
   
```
