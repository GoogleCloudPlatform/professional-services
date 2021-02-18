# Solution Deployment Instructions

1. Activate Cloud Shell.

2. Set default project and credentials.

    ```shell script
    gcloud init
    ```
3. Clone git repository to get the solution components.

    TO DO: Update git repository link once available

    ```shell script
    git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY
    ```

4. Set environment variables.

    i) Navigate to the directory ‘datalake-templates’ where you have cloned the repository.

    ii) Open the file deployment/setup-variables.sh and update the values of variables appropriately.

    iii) Run following commands to set environment variables and apply them to the enviornment parameter file.

    ```shell script
    source deployment/setup-variables.sh
    ```

5. Enable APIs required for the solution.

    ```shell script
    gcloud services enable \
    bigquery.googleapis.com \
    datacatalog.googleapis.com \
    composer.googleapis.com \
    datafusion.googleapis.com \
    storage.googleapis.com \
    dataproc.googleapis.com
    ```

6. Spin up the required resources.

    i) Create Composer Instance and setup required environment variables using gcloud command below.

    ```shell script
    gcloud composer environments create $COMPOSER_INSTANCE_NAME --location $LOCATION --image-version "composer-1.13.3-airflow-1.10.12" --python-version=3 --env-variables=env_param=/home/airflow/gcs/dags/params/env_param.json
    ```

    ii) Create BQ dataset and table for audit logging using command below.

    ```shell script
    bq --location=$LOCATION mk \
    --dataset \
    --description "BQ audit dataset for data lake jobs"  \
    $PROJECT_ID:$AUDIT_DATASET

    bq --location=$LOCATION mk \
    --dataset \
    --description "BQ dataset for data lake tables"  \
    $PROJECT_ID:$BQ_DATALAKE_DATASET

    bq mk --table $AUDIT_DATASET.load_audit_test dag_name:STRING,dag_run_id_detail:STRING,source_name:STRING,stage:STRING,status:STRING,dag_exec_ts:TIMESTAMP,task_end_ts:TIMESTAMP
    ```

    iii) Create GCS buckets for source data and archival data storage.

    ```shell script
    gsutil mb gs://$DATA_BUCKET

    gsutil mb gs://$ARCHIVAL_BUCKET
    ```

    iv) Spin up a Data Fusion instance using command below. 
    Once the instance is successfully created, proceed to the next step.

    ```shell script
    gcloud beta data-fusion instances create --project=$PROJECT_ID  --location=$LOCATION $DATA_FUSION_INSTANCE_NAME --edition=enterprise
    ```


    v) Import pipelines available under the folder datalake-templates>datafusion>pipelines by following the next step.

       - In the console navigation panel, navigate to the Big Data section, and click on Data Fusion. 
    
       - In the page that opens up, click on the view instance link for the Data Fusion instance you have just created.
         This will open Data Fusion for you.
    
       - From the 'Integrate' box, select 'List', and from the resulting page, select "Import".
    
       - Import the sample pipelines provided with this solution in the datafusion folder from the git repository .

8. Execute the command below to update parameters in env_param.json using the environment variables you have specified in step 4 in deployment/setup-variables.sh.

    ```shell script
    sh -x deployment/update-env-param-json-file.sh
    ```

9. Deploy Composer DAGs, DAG dependencies and sample data files by running the following commands.

    ```shell script
    chmod 777 deployment/composer-deployment.sh
    
    sh -x deployment/composer-deployment.sh
    
    chmod 777 deployment/copy-data-to-gcs.sh
    
    sh -x deployment/copy-data-to-gcs.sh
    ```

    After completing the above step, in the DAG folder of your Composer bucket, you should see the following folders created.

    - dependencies
    - params

    In the data bucket, you should see the following folders created.

    - data
    - metadata
    
    Navigate into each of these folders to get familiar with the contents.


# Running Composer DAG

    i) Navigate to the Airflow web UI.

    To do this, click on your Composer instance from Console, click on 'Environment Configuration' tab and click on Airflow web UI link.

    ii) Run load_shipment DAG to load data from source file to BigQuery.

# Remember to decomission the provisioned resources once you are done to avoid incurring charges to your GCP account.