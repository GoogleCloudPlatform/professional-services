# Composer Workload Simulator

This project provides a framework for dynamically generating Apache Airflow DAGs to simulate workloads and test data pipelines on Google Cloud Composer. 


## How To Use

Sizing a Composer Environment is an estimated process. There are many different Airflow components (scheduler, dag processor, web server, triggerer, database, workers) to consider. Workload is dependent on your use-cases and DAG complexity. Generally, the wait-and-see approach does not build trust during the service adoption phase.

**This tool is designed to build trust in the ability for Composer to manage your specific workload (i.e. integration testing)** 

1. Take Inventory of your DAGs. Total number of DAGs, types of operators, schedules. Max concurrent dag runs and max concurrent tasks.
2. Use this inventory as a starting point for your Composer Environment size.

| Recommended preset | Total DAGs | Max concurrent DAG runs | Max concurrent tasks |
|---|---|---|---|
| Small | 50 | 15 | 18 |
| Medium | 250 | 60 | 100 |
| Large | 1000 | 250 | 400 |

3. Use this tool to generate the number of dags that matches your expected workload.
4. After deploying the generated workload to the Composer environment, use the environment Monitoring tab to determine which airflow components need to be modified.
5. Once your generated workload has stabilized and cost optimized, take note of your final Environment Configuration.


## Project Structure

```bash
├── README.md
├── configs
│   └── sample.yaml          # Sample configuration file for generating DAGs
├── dags                     # Airflow DAG definitions (auto-generated)
│   ├── experiment_1         # Organized by experiment id
│       └── dag_1.py
│   ... 
├── main.py                  # Main script to generate DAGs based on config
├── taskflow_collections     # Custom TaskFlow collections
│   ├── __init__.py
│   ├── base_taskflows.py    # Base TaskFlow definitions
│   └── google_cloud_taskflows.py # GCP-specific TaskFlow definitions 
```

## Getting Started

* **Configuration:** 
    * Create a config or modify the `configs/sample.yaml` file to adjust the desired parameters for DAG generation. See the example below for available options.
* **Generating the Airflow DAGs:** 
    * Execute `python main.py` to generate the DAG files in the `dags` folder.
    ```bash
    python3 main.py --config-file=configs/sample.yaml
    ```
    * Optionally, add an `output-dir` arg to generate the DAG files in a specified folder.

    ```bash
    python3 main.py --config-file=configs/sample.yaml --output-dir=my-directory
    ```

## Example Configuration (`configs/sample.yaml`)

```yaml
experiment_id: experiment_1
number_of_dags: 10
tasks_per_dag: 3
paused: 0.5 # weighted chance for dag to be paused

# Schedules and weights
schedules:
  "@daily": 0.5
  "0 * * * *": 0.1
  "10 * * * *": 0.1
  "20 * * * *": 0.1
  "30 * * * *": 0.1
  "40 * * * *": 0.1

# Start dates and weights
start_dates:
  "9/19/2024": 1

# taskflows and weights
taskflows:
  base:
    PythonOperator: 0.3
    KubernetesPodOperator: 0.3
    BashOperator: 0.3
    EmptyOperator: 0.3
    BranchPythonOperator: 0.3
  google_cloud:
    BigQueryInsertJobOperator: 0.001
    DataprocSubmitJobOperator: 0.001
    BeamRunJavaPipelineOperator: 0.001
    DataprocCreateBatchOperator: 0.001
    GCSToGCSOperator: 0.001
    GCSToBigQueryOperator: 0.001
    GKEStartPodOperator: 0.001

# Default settings for every generated DAG.
default_settings:
  deferrable: true
  retries: 1
  catchup: false
  is_paused_upon_creation: false # true will pause all dags
  execution_timeout: 30
  sla: 25
  project_id: your-project
  region: your-region
  mode: poke
  poke_interval: 120 
```

## Example Generated Output

Here is one generated DAG based on the above config file:

```python
# -------------------------------------------------
# Base Taskflow Imports 
# -------------------------------------------------

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import (
    PythonOperator,
    BranchPythonOperator,
)
from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator

# -------------------------------------------------
# Google Cloud Taskflow Imports 
# -------------------------------------------------

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import (
    PythonOperator,
)
from airflow.providers.google.cloud.operators.dataproc import (
    DataprocCreateClusterOperator,
    DataprocDeleteClusterOperator,
    DataprocSubmitJobOperator,
    DataprocCreateBatchOperator,
)
from airflow.providers.apache.beam.hooks.beam import BeamRunnerType
from airflow.providers.apache.beam.operators.beam import BeamRunJavaPipelineOperator
from airflow.providers.google.cloud.operators.gcs import (
    GCSCreateBucketOperator,
    GCSDeleteBucketOperator,
)
from airflow.providers.google.cloud.transfers.gcs_to_gcs import (
    GCSToGCSOperator
)
from airflow.providers.google.cloud.operators.bigquery import (
    BigQueryCreateEmptyDatasetOperator,
    BigQueryDeleteDatasetOperator,
    BigQueryInsertJobOperator
)
from airflow.providers.google.cloud.transfers.gcs_to_bigquery import (
    GCSToBigQueryOperator,
)
from airflow.providers.google.cloud.operators.kubernetes_engine import (
    GKECreateClusterOperator,
    GKEDeleteClusterOperator,
    GKEStartPodOperator,
)

# -------------------------------------------------
# Begin DAG
# -------------------------------------------------

with DAG(
    dag_id="experiment_1_dag_1",
    description="This DAG was auto-generated for experimentation purposes.",
    schedule="20 * * * *",
    default_args={
        "retries": 1,
        "execution_timeout": timedelta(minutes=30),
        "sla": timedelta(minutes=25),
        "deferrable": True,
    },
    start_date=datetime.strptime("9/19/2024", "%m/%d/%Y"),
    catchup=False,
    is_paused_upon_creation=False,
    tags=['load_simulation']
) as dag:

    # -------------------------------------------------
    # Default PythonOperator Taskflow 
    # -------------------------------------------------
        
    task_0 = PythonOperator(
        task_id="hello_world_0",
        python_callable=lambda: print(f"Hello World from DAG: experiment_1_dag_1, Task: 0"),
    )

    # -------------------------------------------------
    # Default EmptyOperator Taskflow 
    # -------------------------------------------------

    task_1 = EmptyOperator(
        task_id=f"empty_task_1",
    )
    
    # -------------------------------------------------
    # Default PythonOperator Taskflow 
    # -------------------------------------------------
        
    task_2 = PythonOperator(
        task_id="hello_world_2",
        python_callable=lambda: print(f"Hello World from DAG: experiment_1_dag_1, Task: 2"),
    )
    
    task_0 >> task_1 >> task_2
```

## TaskFlow Collections

This project utilizes custom TaskFlow collections (1 or more operators to simulate a use-case):

* **`base_taskflows`:**  Provides reusable TaskFlows for common operations:
    *  `PythonOperator`: Executes a Python callable.
    *  `BashOperator`: Executes a Bash command.
    *  `KubernetesPodOperator`:  Runs a pod on a Kubernetes cluster.
    *  `BranchPythonOperator`:  Conditionally chooses a downstream task.
    *  `EmptyOperator`:  A no-op task, useful for defining dependencies.

* **`google_cloud_taskflows`:** Offers specialized TaskFlows for interacting with GCP services:
    *  `BigQueryInsertJobOperator`: Executes a BigQuery query.
    *  `DataprocSubmitJobOperator`: Submits a Hive job to a Dataproc cluster.
    *  `BeamRunJavaPipelineOperator`: Runs a Java pipeline on Dataflow.
    *  `DataprocCreateBatchOperator`: Creates a batch workload on Dataproc.
    *  `GCSToGCSOperator`: Copies data between GCS buckets.
    *  `GCSToBigQueryOperator`: Loads data from GCS to BigQuery.
    *  `GKEStartPodOperator`: Starts a pod on a GKE cluster.


## Creating Custom TaskFlow Collections

You can extend the functionality of this project by creating your own TaskFlow collections. Here's how:

1. **Create a new Python file:** In the `taskflow_collections` directory, create a new file (e.g., `my_custom_taskflows.py`).

2. **Define a class:**  Create a class that inherits from `BaseTaskFlows` (or create a new base class if needed).

3. **Implement TaskFlow methods:** Add methods to your class that generate the code for your custom TaskFlows. These methods should return strings containing the Airflow operator definitions.

    ```python
    from taskflow_collections.base_taskflows import BaseTaskFlows

    class MyCustomTaskFlows(BaseTaskFlows):
        def __init__(self, dag_id, my_param):
            super().__init__(dag_id)
            self.my_param = my_param

        def my_custom_operator_taskflow(self, task_id: str):
            return f"""
            task_{task_id} = MyCustomOperator( # at least one task id must be `task_{task_id}` to ensure the final DAG structure stays intact.
                task_id="my_custom_task_{task_id}",
                my_param=self.my_param,
            )
            """
    ```

4. **Import and use in `main.py`:**  
    * Import your new class in `main.py`.
    *  Update the `generate_tasks` function in `main.py` to include your custom TaskFlows.
    *  Modify the `configs/sample.yaml` file to add your custom TaskFlow collection and assign weights to the tasks.


## Notes

1. There may be inefficiencies in the dags (duplicate imports) or inaccuracies in the amount of tasks that actually get generated (usually more than specified). This is a simulation tool and not meant to be generating optimized DAGs. Use this to get an idea for the Composer environment size that can handle your maximum intended workload.


2. Calculating Tasks per Minute

calculate the tasks per minute with the given configuration above:

- Define Variables

D: Number of DAGs = 10
t: Tasks per DAG = 3
W_d: Weight of the "@daily" schedule = 0.5
W_h: Sum of weights for all hourly schedules = 0.6

- Use the Equation

```
T = D * t * (W_d / 1440 + W_h / 60)
T = 10 * 3 * (0.5 / 1440 + 0.6 / 60)
T = 0.3 tasks per minute
```


## TODO

- Add XCom task flow
- Add Sensor task flow
- Add Variables task flow
