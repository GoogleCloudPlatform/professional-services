# Convert a JIL job to an AirFlow DAG with dag-factory

## Create a composer environment
Let's start out by creating a Composer environment. First let's enable the API:

```bash
gcloud services enable composer.googleapis.com
```

Next let's create the Composer env, we need to make sure to use an Environment which supports Airflow 2.0 (Check out the [versions page](https://cloud.google.com/composer/docs/concepts/versioning/composer-versions#images) to see which ones support 2.0). At time of writing this, here was the latest one:

```bash
gcloud composer environments create test \
  --location us-central1 --image-version \
  composer-1.17.0-preview.0-airflow-2.0.1
```

This will actually spin up a brand new GKE cluster:

```
> gcloud container clusters list
NAME                           LOCATION       MASTER_VERSION   MASTER_IP      MACHINE_TYPE   NODE_VERSION     NUM_NODES  STATUS
us-central1-test-692672b8-gke  us-central1-f  1.18.17-gke.100  35.193.22.212  n1-standard-1  1.18.17-gke.100  3          RUNNING
```

And it also creates a GCS bucket which will be used for storage:

```bash
> gcloud composer environments describe test \
  --location us-central1 \
  --format="get(config.dagGcsPrefix)"
gs://us-central1-test-692672b8-bucket/dags
```

## Adding a python Library
By default [dag-factory](https://github.com/ajbosco/dag-factory) is not available on the Composer workers. To install python package we can follow instructions laid out in [Installing Python dependencies](https://cloud.google.com/composer/docs/how-to/using/installing-python-dependencies#gcloud). First let's create a requirements file and add `dag-factory` into it:

```bash
echo dag-factory > requirements.txt
```

Now let's update the cluster:

```bash
> gcloud composer environments update test \
--update-pypi-packages-from-file requirements.txt \
--location us-central1
```

We can login to the worker and confirm the library is on one of the workers. First get the `kubeconfig` for your Composer cluster:

```bash
> gcloud container clusters get-credentials us-central1-test-692672b8-gke --zone us-central1-f
Fetching cluster endpoint and auth data.
kubeconfig entry generated for us-central1-test-692672b8-gke.
```

Then get the namespace of the workers:

```bash
> k get ns | grep -i comp
composer-1-17-0-preview-0-airflow-2-0-1-9f69fded   Active   2d2h
```

Now let's get the pods in that namespace:

```bash
> k get pods -n composer-1-17-0-preview-0-airflow-2-0-1-9f69fded
NAME                                 READY   STATUS      RESTARTS   AGE
airflow-database-init-job-wxpcm      0/1     Completed   0          2d2h
airflow-scheduler-6cb7c67b5b-rrjvl   2/2     Running     1          2d1h
airflow-worker-989d468fc-6g5v9       2/2     Running     0          2d1h
airflow-worker-989d468fc-dt6nx       2/2     Running     0          2d1h
airflow-worker-989d468fc-pgngv       2/2     Running     0          2d1h
```

Now let's `exec` into one of the worker pods:

```bash
> k exec -it -n composer-1-17-0-preview-0-airflow-2-0-1-9f69fded airflow-worker-989d468fc-6g5v9  -c airflow-worker -- /bin/bash
airflow@airflow-worker-989d468fc-6g5v9:~$ python -V
Python 3.8.6
airflow@airflow-worker-989d468fc-6g5v9:~$ pip -V
pip 20.2.4 from /opt/python3.8/lib/python3.8/site-packages/pip (python 3.8)
airflow@airflow-worker-989d468fc-6g5v9:~$ pip list --format=freeze | grep -iE "dag|air"
apache-airflow==2.0.1+composer
apache-airflow-providers-apache-beam==1.0.0
apache-airflow-providers-cncf-kubernetes==1.0.1
apache-airflow-providers-ftp==1.0.1
apache-airflow-providers-google==2.0.0
apache-airflow-providers-http==1.1.0
apache-airflow-providers-imap==1.0.1
apache-airflow-providers-mysql==1.0.1
apache-airflow-providers-postgres==1.0.1
apache-airflow-providers-sendgrid==1.0.1
apache-airflow-providers-sqlite==1.0.1
apache-airflow-providers-ssh==1.1.0
dag-factory==0.8.0
```

Looks good.

## Run a simple dag-factory Job (Optional)

First let's create a very simple **dag-factory** yaml:

```bash
> cat dag-factory.yaml
example_dag:
  default_args:
    owner: "user"
    start_date: 1 days
  description: "this is an example dag"
  tasks:
    task_1:
      operator: airflow.operators.bash_operator.BashOperator
      bash_command: "echo 1"
    task_2:
      operator: airflow.operators.bash_operator.BashOperator
      bash_command: "echo 2"
      dependencies: [task_1]
    task_3:
      operator: airflow.operators.bash_operator.BashOperator
      bash_command: "echo 3"
      dependencies: [task_1]
```

Now let's copy that to our gcs bucket into the **data** folder:

```bash
> gsutil cp dag-factory.yaml gs://us-central1-test-692672b8-bucket/data
Copying file://dag-factory.yaml [Content-Type=application/octet-stream]...
/ [1 files][  386.0 B/  386.0 B]
Operation completed over 1 objects/386.0 B.
```

Now here is a really simple DAG that `dag-factory` can use:

```bash
> cat dag-factory-job.py
from airflow import DAG
import dagfactory

config_file = "/home/airflow/gcsfuse/data/dag-factory.yaml"
example_dag_factory = dagfactory.DagFactory(config_file)

# Creating task dependencies
example_dag_factory.clean_dags(globals())
example_dag_factory.generate_dags(globals())
```

Now let's add that DAG into our Composer cluster:

```bash
gcloud composer environments storage dags import \
    --environment test \
    --location us-central1 \
    --source dag-factory-job.py
```

Now let's run it:

```bash
> gcloud beta composer environments run test --location us-central1 dags list
kubeconfig entry generated for us-central1-test-692672b8-gke.
Executing within the following Kubernetes cluster namespace: composer-1-17-0-preview-0-airflow-2-0-1-9f69fded
dag_id           | filepath              | owner   | paused
=================+=======================+=========+=======
example_dag      | dag-factory-job.py    | user    | False
```

And:

```bash
> gcloud beta composer environments run test --location us-central1 dags trigger -- example_dag
kubeconfig entry generated for us-central1-test-692672b8-gke.
Executing within the following Kubernetes cluster namespace: composer-1-17-0-preview-0-airflow-2-0-1-9f69fded
[2021-05-23 01:35:06,850] {__init__.py:38} INFO - Loaded API auth backend: <module 'airflow.api.auth.backend.deny_all' from '/opt/python3.8/lib/python3.8/site-packages/airflow/api/auth/backend/deny_all.py'>
Created <DagRun example_dag @ 2021-05-23 01:35:07+00:00: manual__2021-05-23T01:35:07+00:00, externally triggered: True>
```

## Convering a JIL file to Dag-Factory files
To do the conversion you can run the following:

```bash
> python3 airpiler.py -i examples/use-case2.jil -p use-case2
dag-factory yaml written to: use-case2.yaml
airflow python file written to: use-case2-dag.py

Run the following to get your GCS Bucket
gcloud composer environments describe <YOUR_ENV> --location us-central1 --format="get(config.dagGcsPrefix)"

Run the following to upload the dag-factory yaml file to the bucket:
gsutil cp use-case2.yaml gs://<YOUR_ENV>/data

Then run the following to upload the airflow dag python script to your composer environment:
gcloud composer environments storage dags import --environment <YOUR_ENV> --location us-central1 --source use-case2-dag.py

Then run the following to get the URL of the Airflow UI:
gcloud composer environments describe <YOUR_ENV> --location us-central1 --format="get(config.dagGcsPrefix)"

Then visit the URL and trigger your DAG
```

Then following the instructions we can run the following to upload the files:

```bash
gsutil cp use-case2.yaml gs://us-central1-test-692672b8-bucket/data
gcloud composer environments storage dags import --environment test --location us-central1 --source use-case2-dag.py
```

Then confirm the DAG is there:

```bash
> gcloud beta composer environments run test --location us-central1 dags list
kubeconfig entry generated for us-central1-test-692672b8-gke.
Executing within the following Kubernetes cluster namespace: composer-1-17-0-preview-0-airflow-2-0-1-9f69fded
dag_id                   | filepath              | owner                | paused
=========================+=======================+======================+=======
USE_CASE_2          | use-case2-dag.py      | autosys@machine_name | False
example_dag              | dag-factory-job.py    | user  | False
```

Next we can trigger the DAG via the command line:

```bash
> gcloud beta composer environments run test --location us-central1 dags trigger -- USE_CASE_2
kubeconfig entry generated for us-central1-test-692672b8-gke.
Executing within the following Kubernetes cluster namespace: composer-1-17-0-preview-0-airflow-2-0-1-9f69fded
[2021-05-23 01:35:06,850] {__init__.py:38} INFO - Loaded API auth backend: <module 'airflow.api.auth.backend.deny_all' from '/opt/python3.8/lib/python3.8/site-packages/airflow/api/auth/backend/deny_all.py'>
Created <DagRun USE_CASE_2 @ 2021-05-23 01:35:07+00:00: manual__2021-05-23T01:35:07+00:00, externally triggered: True>
```
### Confirming the DAG Completed and it's Output
We can check all the *dag runs* for that DAG:

```bash
> gcloud beta composer environments \
  run test --location us-central1 dags \ 
  list-runs -- -d USE_CASE_2
kubeconfig entry generated for us-central1-test-692672b8-gke.
Executing within the following Kubernetes cluster namespace: composer-1-17-0-preview-0-airflow-2-0-1-9f69fded
dag_id       | run_id      | state   | execution_d | start_date  | end_date
             |             |         | ate         |             |
=============+=============+=========+=============+=============+==============
USE_CASE_2   | manual__202 | success | 2021-05-23T | 2021-05-23T | 2021-05-23T03
             | 1-05-23T03: |         | 03:25:38+00 | 03:25:38.06 | :25:52.804706
             | 25:38+00:00 |         | :00         | 4247+00:00  | +00:00
```

We can also get all the tasks for a specific DAG:

```bash
> gcloud beta composer environments \
  run test --location us-central1 dags \
  show -- USE_CASE2
kubeconfig entry generated for us-central1-test-692672b8-gke.
Executing within the following Kubernetes cluster namespace: composer-1-17-0-preview-0-airflow-2-0-1-9f69fded
[2021-05-23 03:32:15,425] {dagbag.py:448} INFO - Filling up the DagBag from /home/airflow/gcs/dags
/opt/python3.8/lib/python3.8/site-packages/airflow/providers/cncf/kubernetes/backcompat/backwards_compat_converters.py:26 DeprecationWarning: This module is deprecated. Please use `kubernetes.client.models.V1Volume`.
/opt/python3.8/lib/python3.8/site-packages/airflow/providers/cncf/kubernetes/backcompat/backwards_compat_converters.py:27 DeprecationWarning: This module is deprecated. Please use `kubernetes.client.models.V1VolumeMount`.
digraph USE_CASE2_TG_DAG {
	graph [label=USE_CASE2_DAG labelloc=t rankdir=LR]
	"task_group_USE_CASE2_TG.task_TASK_1" [color="#000000" fillcolor="#f0ede4" shape=rectangle style="filled,rounded"]
	"task_group_USE_CASE2_TG.task_TASK_1" -> "task_group_USE_CASE2_TG.task_TASK_2"
	"task_group_USE_CASE2_TG.task_TASK_2" [color="#000000" fillcolor="#f0ede4" shape=rectangle style="filled,rounded"]
}
```

All the logs are written to the GCS bucket and you can check them out by putting all the above information together ([Log folder directory structure](https://cloud.google.com/composer/docs/concepts/logs#log_folder_directory_structure) describes the format):

```bash
> gsutil cat gs://us-central1-test-692672b8-bucket/logs/example_dag/task_3/2021-05-12T15:19:58+00:00/1.log
[2021-05-12 15:21:01,602] {taskinstance.py:671} INFO - Dependencies all met for <TaskInstance: example_dag.task_3 2021-05-12T15:19:58+00:00 [queued]>@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:01,733] {taskinstance.py:671} INFO - Dependencies all met for <TaskInstance: example_dag.task_3 2021-05-12T15:19:58+00:00 [queued]>@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:01,734] {taskinstance.py:881} INFO -
--------------------------------------------------------------------------------@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:01,735] {taskinstance.py:882} INFO - Starting attempt 1 of 1@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:01,737] {taskinstance.py:883} INFO -
--------------------------------------------------------------------------------@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:01,789] {taskinstance.py:902} INFO - Executing <Task(BashOperator): task_3> on 2021-05-12T15:19:58+00:00@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:01,793] {standard_task_runner.py:54} INFO - Started process 270 to run task@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:01,861] {standard_task_runner.py:77} INFO - Running: ['airflow', 'run', 'example_dag', 'task_3', '2021-05-12T15:19:58+00:00', '--job_id', '3177', '--pool', 'default_pool', '--raw', '-sd', 'DAGS_FOLDER/dag-factory-job.py', '--cfg_path', '/tmp/tmpo9ywtef7']@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:01,864] {standard_task_runner.py:78} INFO - Job 3177: Subtask task_3@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:03,625] {logging_mixin.py:112} INFO - Running <TaskInstance: example_dag.task_3 2021-05-12T15:19:58+00:00 [running]> on host airflow-worker-6d9657f474-7pc2z@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:04,199] {bash_operator.py:114} INFO - Tmp dir root location:
 /tmp@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:04,202] {bash_operator.py:137} INFO - Temporary script location: /tmp/airflowtmpxk1vqnst/task_3rd0rmbja@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:04,202] {bash_operator.py:147} INFO - Running command: echo 3@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:04,546] {bash_operator.py:154} INFO - Output:@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:04,587] {bash_operator.py:158} INFO - 3@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:04,599] {bash_operator.py:162} INFO - Command exited with return code 0@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:05,066] {taskinstance.py:1071} INFO - Marking task as SUCCESS.dag_id=example_dag, task_id=task_3, execution_date=20210512T151958, start_date=20210512T152101, end_date=20210512T152105@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
[2021-05-12 15:21:11,928] {local_task_job.py:102} INFO - Task exited with return code 0@-@{"workflow": "example_dag", "task-id": "task_3", "execution-date": "2021-05-12T15:19:58+00:00"}
```

And you can also go to **Cloud Logging** and see the logs from there. I ended up using this filter to find my dag run:

```bash
resource.type="cloud_composer_environment" resource.labels.location="us-central1" resource.labels.environment_name="test" log_name="projects/<GCP_PROJECT>/logs/airflow-worker" severity>=DEFAULT
labels.workflow="example_dag"
```

### Checking out the AirFlow UI
You can also visit the AirFlow UI and see all the jobs that have executed. To get the URL of the UI run the following:

```bash
> gcloud composer environments describe test \
  --location us-central1 \
  --format="get(config.airflowUri)"
https://tddbc3f0ad77184ffp-tp.appspot.com
```

Upon visiting the above page and authenticating using IAP you will see a list of the available DAGS and also check out the logs as well.

