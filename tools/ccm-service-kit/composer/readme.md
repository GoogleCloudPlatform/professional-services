# Multi Cloud Billing Solution Cloud Composer set up

## Introduction

We recommend Composer to orchestrate the whole pipeline. You will find the scripts in the git repository. It is important to understand that this architecture is just a standard and each user is free to choose another tool to develop this ETL.

## Airflow scripts
Under the composer directory you will find the following scripts:

- dags
    - This folder will contains the dags to be executed in the Composer server and the dependencies.
    - This folder should be sync with the composer bucket in your CI/CD pipelines to keep the code updated in the airflow server.
- dags/dependencies
    - This directory contains the following folders:
        - operators: we created the LoadFileFromAPI operator to get a file over an API request and load it into GCS. You can extend this operator based on your needs.
        - queries: this folder has all the queries needed to create and refresh the unified schema. If you need, you can modify or extend the queries.
        - scripts: under this folder you will find a script that executes a transfer service job and the variable_reader script.
        - variables: you will find a json file with the variables that the dags will be using. You have to edit this file.

## How to use it

First you need to edit the following variables:

1. Go to **composer/dags/dependencies/variables/variables.json**

```
{
    "project_id" : "<your-project>",
    "ccm_bucket" : "<bucket-name>",
    "prefix_azure_lz" : "<folder-name>",
    "prefix_aws_lz" : "<folder-name>",
    "prefix_hist_azure" : "<folder-name>",
    "prefix_hist_aws" : "<folder-name>",
    "sts_id_azure" : "<transferJobs/id>",
    "sts_id_aws" : "<transferJobs/id>",
    "gcp_billing_table" : "<table-name>",
    "ccm_staging_dataset" : "<dataset-id>",
    "ccm_final_dataset" : "<dataset-id>"
}
```

Once you have the variables.json files set up properly, if you use another structure of directories, you have yo edit the following path:

2. Go to **composer/dags/dependencies/scripts/variable_reader.py**

```
def getVariables():

    """
    This function read a json file and return all the values.
    """

    #Replace the path with your default location in gcs keeping the /home/airflow/gcs/ structure
    with open('/home/airflow/gcs/dags/dependencies/variables/variables.json') as f:
        variables = json.load(f)

    return variables
```

> **_NOTE:_**  If you want you can use the airflow variables instead of the variable reader. You can load the variables manually in the airflow UI or create a CI/CD pipeline to do it.

Register the billing export schema of AWS and Azure

3. Go to composer/dependencies/queries/schemas.py

```
class Schema():
    
    """
    The purpose of this class is to define the schema for the tables that will use a BQ Load job.
    Replace here with your own billing schema.
    """

    AZURE_BILLING = [
                        {
                            "mode": "NULLABLE",
                            "name": "invoice_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "previous_invoice_id",
                            "type": "STRING"
                        },
                        ...
```

> **_NOTE:_** We have to define the schema because sometimes the cloud providers change the headers of the files. 

Edit the way to get the files from AWS and Azure
4. Go to **/composer/dags/dag-ccm-pipeline.py**

```
   ## First we need to get the files from each cloud provider

    ## If you want to get the file from Azure using API you have to replace this task and use the LoadFileFromAPI operator
    run_azure_sts = PythonOperator(
        task_id = "run_azure_sts",
        python_callable=invoke_sts_job,
        op_kwargs={"sts_id": azure_sts_id, "project":project_id }
    )

    ## If you want to get the file from AWS using API you have to replace this task and use the LoadFileFromAPI operator
    run_aws_sts = PythonOperator(
        task_id = "run_aws_sts",
        python_callable=invoke_sts_job,
        op_kwargs={"sts_id": aws_sts_id, "project":project_id }
    )

```

Edit the dag-ccm-pipeline dag base on your need

5. Go to **/composer/dags/dag-ccm-pipeline.py**

```
# Define DAG's tasks order of execution 

    [run_azure_sts, run_aws_sts] >> azure_raw_data_load >> aws_raw_data_load >> clean_unified_list >> gcp_insert_to_unified_list >> azure_insert_to_unified_list >> aws_insert_to_unified_list
    aws_insert_to_unified_list >> dim_product_refresh >> dim_resurce_location_refresh >> dim_project_refresh >> dim_currency_refresh >> dim_charge_refresh
    dim_charge_refresh >> dim_billing_account_refresh >> dim_charge_type_refresh >> dim_service_refresh >> dim_service_type_refresh
    dim_service_type_refresh >> fact_unified_cloud_billing_inserts >> [move_azure_file_to_historical,move_aws_file_to_historical]

```

> **_NOTE:_** You have to extend this dag and plan how you will handle the potential exceptions. 

## Important

> **_NOTE:_**  This is just a base line to create an ETL in order to use the CCM Phase 2 block in Looker.





## Example of a workflow execution

![workflow execution](ccm-airflow-tasks.png)
