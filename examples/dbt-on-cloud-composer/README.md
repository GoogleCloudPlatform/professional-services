# Using dbt and Cloud Composer for managing BigQuery example code   

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

## Technical Requirements
These GCP services will be used in the example code:   
- Cloud Composer
- BigQuery
- Google Cloud Storage (GCS) 
- Cloud Build
- Google Container Repository (GCR)
- Cloud Source Repository (CSR)

## High Level Flow
This diagram explains the example solution's flow:   
<img src="img/dbt-on-cloud-composer-diagram.PNG" width="700">

1. The code starts from a dbt project stored in a repository. (The example is under [basic or optimized]/dbt-project folder)
2. Any changes from the dbt project will trigger Cloud Build run
3. The Cloud Build will create/update an image to GCR; and export dbt docs to GCS
4. The Airflow DAG deployed to Cloud Composer (The example is under [basic or optimized]/dag folder)
5. The dbt run triggered using KubernetesPodOperator that pulls image from the step \#3
6. At the end of the process the BigQuery objects will be created/updated (i.e datasets and tables)

## How to run

### Prerequisites
1. Cloud Composer environment   
    https://cloud.google.com/composer/docs/how-to/managing/creating
2. Set 3 ENVIRONMENT VARIABLES in the Cloud Composer (AIRFLOW_VAR_BIGQUERY_LOCATION, AIRFLOW_VAR_RUN_ENVIRONMENT, AIRFLOW_VAR_SOURCE_DATA_PROJECT)   
    https://cloud.google.com/composer/docs/how-to/managing/environment-variables
3. Cloud Source Repository (or any git provider)   
    Store the code from dbt-project in this dedicated repository   
    The repository should contain dbt_project.yml file (Check the example code under [basic or optimized]/dbt-project] folder)    
    Note that the dedicated dbt-project repository is not this example code repository (github repo)
4. Cloud Build triggers   
    Trigger build from the dbt project repository   
    https://cloud.google.com/build/docs/automating-builds/create-manage-triggers   

    Set Trigger's substitution variables : _GCS_BUCKET and _DBT_SERVICE_ACCOUNT   
    _GCS_BUCKET : A GCS bucket id for storing dbt documentation files.   
    _DBT_SERVICE_ACCOUNT : A service account to run dbt from Cloud Build.     
5. BigQuery API enabled
6. Service account to run dbt commands
7. Kubernetes Secret to be binded with the service account   
    https://cloud.google.com/kubernetes-engine/docs/concepts/secret

    Alternatively, instead of using Kubernetes Secret, Workload Identity federation can be used (recommended approach). More details in **Authentication** section below.

### Profiles for running the dbt project
Check in the /dbt-project/.dbt/profiles.yml, you will find 2 options to run the dbt:   
1. local    
    You can run the dbt project using your local machine or Cloud Shell.
    To do that, run     
    ```
    gcloud auth application-default login   
    ```

    Trigger dbt run by using this command:   
    ```
    dbt run --vars '{"project_id": [Your Project id], "bigquery_location": "us", "execution_date": "1970-01-01","source_data_project": "bigquery-public-data"}' --profiles-dir .dbt
    ```
2. remote   
    This option is for running dbt using service account   
    For example from Cloud build and Cloud Composer     
    Check cloudbuild.yaml and dag/dbt_with_kubernetes.py to see how to use this option

### Run the code
After all the Prerequisites are prepared. You will have:   
1. A dbt-project repository
2. Airflow DAG to run the dbt

Here are the follow up steps for running the code:
1. Push the code in dbt-project repository and make sure the Cloud Build triggered; and successfully create the docker image
2. In the Cloud Composer UI, run the DAG (e.g dbt_with_kubernetes.py)
3. If successfull, check the BigQuery console to check the tables

With this mechanism, you have 2 independent runs.   
Updating the dbt-project, including models, schema and configurations will run the Cloud Build to create the docker image.   
The DAG as dbt scheduler will run the dbt-project from the latest docker image available.

### Passing variables from Cloud Composer to dbt run
You can pass variables from Cloud Composer to the dbt run.    
As an example, in this code we configure the BigQuery dataset location in the US as part of the DAG.   
```
default_dbt_vars = {
        "project_id": project,

        # Example on using Cloud Composer's variable to be passed to dbt
        "bigquery_location": Variable.get("bigquery_location"),
        
        "key_file_dir": '/var/secrets/google/key.json',
        "source_data_project": Variable.get("source_data_project")
    }
```

In the dbt script, you can use the variable like this:
```
location: "{{ var('bigquery_location') }}"
```

### Authentication
When provisioning DBT runtime environment using KubernetesPodOperator there are two available options for authentication of the DBT process. To achieve better separation of concerns and follow good security practices, the identity of the DBT process (Service Account) should be different than the Cloud Composer Service Account.

Authentication options are:

- Service Account key stored as Kubernetes Secret

Create a the SA key using the command (Note: SA keys are very sensitive and easy to misuse which can be a security risk. They should be kept protected and only be used under special circunstances)
```bash
gcloud iam service-accounts keys create key-file \
    --iam-account=sa-name@project-id.iam.gserviceaccount.com
```

Then save the key json file as *key.json* and configure *kubectl* command line tool to access the GKE cluster used by the Cloud Composer environment.

```bash
gcloud container clusters get-credentials gke-cluster-name --zone cluster-zone --project project-name
```

Onced authenticated, create dbt secret in the default namespace by running
```
kubectl create secret generic dbt-sa-secret --from-file key.json=./key.json
```

Since then, in the DAG code, when creating a container, the service account key will extracted from K8s Secret and then be be mounted under /var/secrets/google paht in the container filesystem and available for DBT in the runtime.

- Workload Identity federation [**Recommended**]

A better way to manage the identity and authentication for K8s workloads is to avoid using SA Keys as Secrets and use Workload Identity federation mechanism [[documentation](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)]

Depending on the Composer version you might need to enable Workload Identity in the cluster, configure the node pool to use the GKE_METADATA metadata server to request a short-lived auth tokens. 

- Composer 1

To enable Workload Identity on a new cluster, run the following command:
```bash
gcloud container clusters create CLUSTER_NAME \
    --region=COMPUTE_REGION \
    --workload-pool=PROJECT_ID.svc.id.goog
```
Create new node pool (recommended) or update the existing one (might break the airflow setup and require extra steps):

```bash
gcloud container node-pools create NODEPOOL_NAME \
    --cluster=CLUSTER_NAME \
    --workload-metadata=GKE_METADATA
```

- Composer 2

No further actions required, as the GKE is already using Workload Identity and thanks to the Autopilot mode there's no need to manage the node pool manually.

To let the DAG to use the Workload Identity the following steps are required:

1) Create a namespace for the Kubernetes service account:
```bash
kubectl create namespace NAMESPACE
```
2) Create a Kubernetes service account for your application to use
```bash
kubectl create serviceaccount KSA_NAME \
    --namespace NAMESPACE
```
3) Assuming that the dbt-sa already exists and has a right permissions to trigger BigQuery jobs, the special binding has to be added to allow the Kubernetes service account as the IAM service account:

```bash
gcloud iam service-accounts add-iam-policy-binding GSA_NAME@GSA_PROJECT.iam.gserviceaccount.com \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:PROJECT_ID.svc.id.goog[NAMESPACE/KSA_NAME]"
```

4) Using *kubectl* tool annotate the Kubernetes service account with the email address of the IAM service account.

```bash
kubectl annotate serviceaccount KSA_NAME \
    --namespace NAMESPACE \
    iam.gke.io/gcp-service-account=GSA_NAME@GSA_PROJECT.iam.gserviceaccount.com
```

To make use of the Workload Identity in our DAG, replace the existing KubernetesPodOperator call with the one that uses the Workload Identity.

1) Composer 1
Use example configuration from the snippet below:

```python
KubernetesPodOperator(
(...)
    namespace='dbt-namespace',
    service_account_name="dbt-k8s-sa",
    affinity={
        'nodeAffinity': {
            'requiredDuringSchedulingIgnoredDuringExecution': {
                'nodeSelectorTerms': [{
                    'matchExpressions': [{
                        'key': 'cloud.google.com/gke-nodepool',
                        'operator': 'In',
                        'values': [
                            'dbt-pool',
                        ]
                    }]
                }]
            }
        }
    }
(...)
).execute(context)
```

The affinity configuration lets GKE to schedule the pod in one of the specific node-pools that are set up to use Workload Identity.

2) Composer 2

In case of Composer 2 (Autopilot), the configuration is simpler, example snippet:

```python
KubernetesPodOperator(
(...)
    namespace='dbt-tasks',
    service_account_name="dbt-k8s-sa"
(...)
).execute(context)
```

When using Workload Identity option there is no need to store the IAM SA key as a Secret in GKE what massively improves the maintenance efforts and is generally considered more secure, as there is no need to generate and export the SA Key.
