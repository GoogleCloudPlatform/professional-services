# gcp-dataproc-running-notebooks
## Objective
Orchestrating the workflow of running Jupyter Notebooks on a Dataproc cluser via PySpark job 

## File Directory Structure
    ├── composer_input                   
    │   ├── initialization_scripts/     init_pip_gcsfuse.sh 
    │   ├── jobs/                       wrapper_papermill.py
    │   ├── DAGs/                       composer_pyspark_notebook.py
    ├── notebooks 
    │   ├── python/                     sample.py
    │   ├── jupyter/                    sample_notebook.ipynb
    │   ├── jupyter/output 
    
## File Details    
### composer_input
* **init_pip_gscfuse.sh**: this script completes following two tasks
  * Installs desired python packages 
  * Installs [gcsfuse](https://github.com/GoogleCloudPlatform/gcsfuse/blob/master/docs/installing.md) and mounts the desired bucket to the path
* **wrapper_papermill.py**: runs a papermill execution of input notebook and writes the output file into the assgined location
* **composer_pyspark_notebook.py**: orchestrates the workflow 
  * Dataproc Cluster Creation 
    ```
      create_dataproc_cluster = dataproc_operator.DataprocClusterCreateOperator()
    ```
  * Dataproc PySpark Job submission
    ```
      pyspark_task = DataprocSubmitJobOperator()
    ```
  * Dataproc Cluster Deletion
    ```
      delete_dataproc_cluster = dataproc_operator.DataprocClusterDeleteOperator()
    ```
### notebooks 
* **sample.py** : sample python in *GCS bucket* which will be directly invoked by the notebook (this is possible because of [gcsfuse](https://github.com/GoogleCloudPlatform/gcsfuse/blob/master/docs/installing.md) mounting GCS bucket as a file system)
* **sample_notebook.ibynp** :
  * verify if GCS buckets are mounted at pwd as a file system
  * verify Python files in mounted GCS buckets are executable via **!python** and **%run** command
    ```
    !ls /path-1 
    !sudo python /path-1/sample.py
    %run /path-1/sample.py
    ```
* jupyter/output: this is where papermill notebook execution outputs will be stored

# I) Orchestrating End to End Notebook Execution workflow in Cloud Composer 

1. Make sure to ctrl+f `EDIT:` in each file to modify details

2. Create a Cloud Composer Environment

3. Find DAGs folder from Composer Environment and add composer_pyspark_notebook.py (DAGs file) to it in order to trigger DAGs execution:

DAG folder from Cloud Composer Console 
![Screenshot 2023-02-07 at 9 04 12 AM](https://user-images.githubusercontent.com/123537947/217266654-f7a017fb-7470-4e04-9803-a72be6f652bd.png)

4. Have all the files available in GCS bucket, except DAGs file which should go into your Composer DAGs folder

5. From Composer environment, create two Airflow variables (see composer_pyspark_notebook.py for the usage)
<img width="425" alt="Screenshot 2023-02-07 at 11 29 09 AM" src="https://user-images.githubusercontent.com/123537947/217304416-2522c177-a3eb-420c-bcfa-7dc4e571d820.png">

https://airflow.apache.org/concepts.html#variables
* gcp_project - Google Cloud Project to use for the Cloud Dataproc cluster.
* gce_zone - Google Compute Engine zone where Cloud Dataproc cluster should be
  created.

e. Open Airflow UI to monitor DAG executions, Runs and logs
    
![image](https://user-images.githubusercontent.com/123537947/215648916-811a8331-b61a-45a5-8f5a-b61f3fd4fdd0.png)

## II) Running a Jupyter notebook on a Dataproc cluster
Refer to this [GCP tutorial](https://cloud.google.com/dataproc/docs/tutorials/jupyter-notebook) to 
* install the Dataproc Jupyter and Anaconda components on a new cluster (utilize initialization script from this repository)
* connect to the Jupyter notebook UI running on the cluster from your local browser using the [Dataproc Component Gateway](https://cloud.google.com/dataproc/docs/concepts/accessing/dataproc-gateways)

## Closing Note
If you're adapting this example for your own use consider the following:

* Setting an appropriate input path within your environment (gcs, mounting point for gcsfuse, DAGs folder, etc)
* Setting more appropriate configurations (DAGs, Dataproc cluster, init_script, etc)

## Contributors
* Kristin Kim (Google)
* Jerry Ding (Google) - wrapper_papermill.py