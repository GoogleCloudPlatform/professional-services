# gcp-dataproc_serverless-running-notebooks

## Objective
Orchestrator to run Notebooks on Dataproc Serverless via Cloud Composer

## What is Dataproc Serverless?

Dataproc Serverless lets you run Spark batch workloads without requiring you to provision and manage your own cluster. You can specify workload parameters, and then submit the workload to the Dataproc Serverless service. The service will run the workload on a managed compute infrastructure, autoscaling resources as needed. Dataproc Serverless charges apply only to the time when the workload is executing.

With Dataproc Serverless, You can run Notebooks and streamline the end-to-end data science workflow without provisioning a cluster. Also, you can run Spark batch workloads without provisioning and managing the clusters and servers. This improves developer productivity and decreases infrastructure costs. A Fortune 10 retailer uses Dataproc Serverless for optimizing retail assortment space for 500M+ items.  

For more details, check this [document](https://cloud.google.com/dataproc-serverless/docs/overview)

## File Directory Structure

**dataproc_serverless**

    ├── composer_input                   
    │   ├── jobs/                       wrapper_papermill.py
    │   ├── DAGs/                       serverless_airflow.py
    ├── notebooks 
    │   ├── datasets/                   electric_vehicle_population.csv
    │   ├── jupyter/                    spark_notebook.ipynb
    │   ├── jupyter/output 
    
## File Details    
### composer_input
* **wrapper_papermill.py**: runs a papermill execution of input notebook and writes the output file into the assgined location
* **serverless_airflow.py**: orchestrates the workflow 
  * Dataproc Batch Creation :This operator runs your workloads on Dataproc Serverless
    ```
    create_batch1 = DataprocCreateBatchOperator()
    create_batch2 = DataprocCreateBatchOperator()...
    ```

### notebooks 
* **spark_notebook.ibynp** : This file creates Spark Session for Electric Vehicle Population, loads csv file in GCS and perform fundamental Spark functions
    ```
    spark = SparkSession \
        .builder \
        .appName("Spark Session for Electric Vehicle Population") \
        .getOrCreate()
    
    path=f"gs://{gcs_bucket}/dataproc_serverless/notebooks/datasets/electric_vehicle_population.csv"
    df = spark.read.csv(path, header=True)
    df.show()
    
    df.filter(df['Model Year'] > 2020).show(5)
    sortedByElectricRange = df.orderBy('Electric Range').show(10)
    ```
* **jupyter/output** : this is where papermill notebook execution outputs will be stored
        Sample Notebook Output
        ![Screenshot 2023-03-16 at 2 20 35 AM](https://user-images.githubusercontent.com/123537947/225531950-dccde663-fade-413d-9600-eb59ab669800.png)

* **electric_vehicle_population.csv** : this [dataset](https://catalog.data.gov/dataset/electric-vehicle-population-data) shows the Battery Electric Vehicles (BEVs) and Plug-in Hybrid Electric Vehicles (PHEVs) that are currently registered through Washington State Department of Licensing (DOL).

# I) Orchestrating End to End Notebook Execution workflow in Cloud Composer 

1. Make sure to modify gcs path for datasets in Notebook 

2. Create [Persistent History Server](https://cloud.google.com/dataproc/docs/concepts/jobs/history-server)

Make sure to follow the [guide](https://cloud.google.com/dataproc/docs/concepts/jobs/history-server#create_a_job_cluster) for setting up properties. For example, it must have the property 'spark:spark.history.fs.logDirectory' configured to act as a Spark history server

3. Create a Cloud Composer Environment

3. Find DAGs folder from Composer Environment and add serverless_airflow.py (DAGs file) to it in order to trigger DAGs execution:
DAG folder from Cloud Composer Console 
      
4. Have all the files available in GCS bucket, except DAGs file which should go into your Composer DAGs folder

5. Create [Variables](https://airflow.apache.org/docs/apache-airflow/stable/howto/variable.html) from Airflow UI for 
    * gcp_project - Google Cloud Project to use for the Cloud Dataproc cluster.
    * gce_zone - Google Compute Engine zone where Cloud Dataproc cluster should be
      created.
    * gcs_bucket - Google Cloud Storage bucket where all the files are stored 
    * phs_region = Persistent History Server region ex) us-central1
    * phs - Persistent History Server name

        <img width="425" alt="Screenshot 2023-02-07 at 11 29 09 AM" src="https://user-images.githubusercontent.com/123537947/217304416-2522c177-a3eb-420c-bcfa-7dc4e571d820.png">


6. Open Airflow UI to monitor DAG executions, Runs and logs
        <img width="1388" alt="Screenshot 2023-03-16 at 2 11 22 AM" src="https://user-images.githubusercontent.com/123537947/225530410-ff13ad40-50ae-416f-9898-8563e08dd019.png">

## Closing Note
If you're adapting this example for your own use consider the following:

* Setting an appropriate input path within your environment (gcs, DAGs folder, etc)
* Setting more appropriate configurations (DAGs, Dataproc cluster, persistent history server, etc)
