# Airflow Metrics Collector 

Python Version : 3.9   
**This tool aggregates dag run task states and runtime, stores the data into BigQuery and creates a LookerStudio dashboard on top of the data.   
Both Airflow1 and Airflow2 are supported.** 

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

5) For Client authentication, execute:  
`gcloud auth application-default login`

Now the environment is ready !

**References:**   
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
### Airflow 1 
```
python airflow_metrics_collector.py \
   --bq-storage-project-id=nikunjbhartia-test-clients \
   --airflow-version=1 \
   --dags-gcs-folder=gs://us-central1-test-278acd57-bucket/dags \
   --ndays-history=5 \
   --skip-dagids=''
   
```

### Airflow 2
Below example also skips 2 dags for metrics collection: airflow monitoring and current dag.   
Same flags can be used in Airflow1 example above as well. 
```
python airflow_metrics_collector.py \
   --bq-storage-project-id=nikunjbhartia-test-clients \
   --airflow-version=2 \
   --dags-gcs-folder=gs://us-central1-test-278acd57-bucket/dags \
   --ndays-history=5 \
   --airflow-dagid=airflow-metrics-collector \
   --skip-dagids='airflow-monitoring,airflow-metrics-collector'
   
```

### Sample Dashboard Created 
![plot](resources/readme/images/dashboard_ss1.jpg?raw=true)
![plot](resources/readme/images/dashboard_ss2.jpg?raw=true)