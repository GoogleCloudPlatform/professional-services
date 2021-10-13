# Using dbt and Cloud Composer for managing BigQuery example code 

Author: adiwijaya@ (ping for feedback)   

DBT (Data Building Tool) is a command-line tool that enables data analysts and engineers to transform data in their warehouses simply by writing select statements.   
Cloud Composer is a fully managed data workflow orchestration service that empowers you to author, schedule, and monitor pipelines.   
    
This repository demonstrate using the dbt to manage tables in BigQuery and using Cloud Composer for schedule the dbt run.   


## Code Examples
There are two sets of example:   
1. Basic   
    The basic example is demonstrating the minimum configuration that you need to run dbt on Cloud Composer
2. Optimized   
    The optimized example is demonstrating optimization on splitting the dbt run for each models,   
    implementing incremental in the dbt model, and using Airflow execution date to handle backfill.

## How to run
To run the examples, you need:
1. Cloud Composer environment
2. Cloud Source Repository to store the dbt project
3. Cloud Build triggers
4. BigQuery API enabled
5. Service account to run dbt
6. Kubernetes Secret to be binded with the service account \#5

Check in the /dbt-project/.dbt/profiles.yml, you will find 3 options to run the dbt
1. dev    
    You can run the dbt project using your local machine or Cloud Shell.
    To do that, run     
    ```
    gcloud auth application-default login   
    ```

    Trigger dbt run by using this command:   
    ```
    dbt run --vars '{"project_id": "pso-dbt-airflow-demo", "bigquery_location": "us", "execution_date": "2016-01-01"}' --profiles-dir .dbt
    ```
2. tests    
    Tests is an option to run the dbt from remote machine. For example, in this example it's used by Cloud Build   
    Check cloudbuild.yaml file to see how to use this option
3. prod    
    Prod is used in the Cloud Composer   
    Check in the dag/dbt_with_kubernetes.py to see how to use this option   
