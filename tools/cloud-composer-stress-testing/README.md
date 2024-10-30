# Composer Workload Generation Solutions

Welcome to the landing page for users interested in generating workloads for [Google Cloud Composer](https://cloud.google.com/composer), a fully managed workflow orchestration service built on [Apache Airflow](https://airflow.apache.org/). This page introduces two solutions designed to help you generate and simulate workloads in Composer environments:

1. **Test DAG Generator**
2. **Composer Workload Simulator**

Both tools aim to facilitate testing, benchmarking, and simulating data pipelines within Composer. Below, we provide a high-level overview of each solution, their key features, and the differences between them to help you choose the one that best suits your needs.

---

## Solution 1: Test DAG Generator

### Overview

The **Test DAG Generator** is a framework designed to generate a large number of test DAGs (Directed Acyclic Graphs) by randomly selecting from predefined Airflow operators. It is ideal for stress-testing Cloud Composer environments and other Airflow setups by simulating parallel workloads with varying tasks and schedules.

### Key Features

- **Random DAG Generation**: Creates DAGs with a random selection of tasks and operators.
- **Configurable Parameters**: Allows customization of the number of DAGs, tasks per DAG, parallelism, and schedules through a JSON configuration file.
- **Helper Scripts**: Includes bash scripts to trigger, pause, or unpause generated DAGs within a Composer environment.
- **Ease of Use**: Simple setup and execution with minimal prerequisites.

### How It Works

1. **Configuration**: Update the `config.json` file with desired parameters such as the number of DAGs, tasks per DAG, task durations, and scheduling intervals.
2. **DAG Generation**: Run the `dag_generator` Python script to generate DAG files based on the configurations. The DAGs are output to the `out` directory.
3. **Deployment**: Upload the generated DAGs to your Composer environment's DAGs folder.
4. **Execution Control**: Use the provided `run_dags.sh` and `pause_dags.sh` scripts to trigger or control the execution of the DAGs.

### Usage Example

```bash
# Generate DAGs
python dag_generator

# Trigger DAGs
bash run_dags.sh -e your_env_name -r your_region -p your_project -n number_of_dags

# Pause or Unpause DAGs
bash pause_dags.sh -a pause -e your_env_name -r your_region -p your_project -n number_of_dags
```

### Configuration Parameters

- **number_of_dags_to_generate**: Number of DAGs to create.
- **file_start_index**: Starting index for DAG file naming.
- **min_number_of_task_in_dag** / **max_number_of_task_in_dag**: Range for the number of tasks per DAG.
- **percentage_of_job_in_parallel**: Percentage of tasks that can run in parallel.
- **number_of_operators_defined**: Selectivity of operator types to include.
- **task_min_time_in_sec** / **task_max_time_in_sec**: Sleep duration range for tasks.
- **schedules**: List of schedules from which the DAG schedule is randomly selected.

---

## Solution 2: Composer Workload Simulator

### Overview

The **Composer Workload Simulator** is a more advanced framework for dynamically generating Airflow DAGs to simulate complex workloads and test data pipelines on Cloud Composer. It allows for greater flexibility by enabling users to define custom TaskFlows and operator collections, closely mimicking real-world pipeline behaviors.

### Key Features

- **Customizable TaskFlows**: Supports the creation of custom TaskFlow collections, including both base operators and Google Cloud-specific operators.
- **Detailed Configuration**: Utilizes YAML configuration files to precisely define DAG parameters, schedules, start dates, and task distributions.
- **Workload Simulation**: Designed to help estimate and optimize Composer environment sizing based on expected workloads.
- **Project Structure**: Organized codebase with clear separation of configurations, DAGs, and TaskFlow definitions.

### How It Works

1. **Inventory Assessment**: Begin by assessing your current or expected DAG inventory, including the number of DAGs, types of operators, schedules, and concurrency requirements.
2. **Configuration**: Create or modify a YAML configuration file (e.g., `configs/sample.yaml`) to set parameters such as the number of DAGs, tasks per DAG, schedules, start dates, and TaskFlow weights.
3. **DAG Generation**: Run the `main.py` script with the specified configuration file to generate DAGs. The DAGs are organized by experiment ID in the `dags` directory.
   ```bash
   python3 main.py --config-file=configs/sample.yaml
   ```
4. **Customization**: Extend functionality by creating custom TaskFlow collections in the `taskflow_collections` directory.
5. **Deployment and Testing**: Deploy the generated DAGs to your Composer environment and use the monitoring tools to observe performance and optimize settings.

### Usage Example

```yaml
# configs/sample.yaml

experiment_id: experiment_1
number_of_dags: 10
tasks_per_dag: 3
schedules:
  "@daily": 0.5
  "0 * * * *": 0.1
start_dates:
  "9/19/2024": 1
taskflows:
  base:
    PythonOperator: 0.3
    BashOperator: 0.3
  google_cloud:
    BigQueryInsertJobOperator: 0.001
default_settings:
  retries: 1
  catchup: false
  execution_timeout: 30
  project_id: your-project
```

### TaskFlow Collections

- **Base TaskFlows**: Includes common operators like `PythonOperator`, `BashOperator`, `KubernetesPodOperator`, etc.
- **Google Cloud TaskFlows**: Features GCP-specific operators such as `BigQueryInsertJobOperator`, `DataprocSubmitJobOperator`, `GCSToBigQueryOperator`, etc.
- **Custom TaskFlows**: Allows users to define their own TaskFlows for specialized testing scenarios.

### Extensibility

Users can create custom TaskFlow collections by:

1. Adding new Python files in the `taskflow_collections` directory.
2. Defining classes with methods that return operator code snippets.
3. Importing and utilizing these classes in the main DAG generation script.

---

## Differences Between the Solutions

| Aspect                    | Test DAG Generator                                     | Composer Workload Simulator                      |
|---------------------------|--------------------------------------------------------|---------------------------------------------------|
| **Complexity**            | Simple random DAG generation with basic configurations | Advanced DAG generation with detailed configurations |
| **Customization**         | Limited to predefined operators and randomness         | Highly customizable TaskFlows and operator collections |
| **Use Case**              | Quick stress-testing with random workloads             | Simulating specific workloads to estimate environment sizing |
| **Configuration Format**  | JSON                                                   | YAML                                              |
| **Helper Scripts**        | Includes bash scripts for triggering and pausing DAGs  | Focused on DAG generation; deployment handled separately |
| **Extensibility**         | Less emphasis on extending functionality               | Designed for extensibility with custom TaskFlows  |
| **Ideal For**             | Testing parallelism and basic DAG behavior             | Mimicking real-world pipelines and performance tuning |

---

## Choosing the Right Solution

- **Use the Test DAG Generator if:**
  - You need to quickly generate a large number of DAGs for stress-testing.
  - Your testing requirements are straightforward, and you prefer simplicity.
  - You want to simulate workloads with random operator selection and basic configurations.

- **Use the Composer Workload Simulator if:**
  - You require a high degree of customization in your DAGs and tasks.
  - You are aiming to closely replicate your production workloads for accurate testing.
  - You need to estimate and optimize your Composer environment sizing based on specific workloads.
  - You want the ability to create and use custom TaskFlows, including GCP-specific operators.

---

## Installation and Prerequisites

### Common Requirements

- **Python Version**: Both solutions require Python 3.7 or higher.
- **Google Cloud Composer**: Compatible with Cloud Composer 2 or higher.
- **Airflow Knowledge**: Familiarity with Apache Airflow concepts is recommended.

### Additional Requirements for Composer Workload Simulator

- **Dependencies**: May require additional Python packages depending on the custom TaskFlows used.
- **Permissions**: Ensure you have the necessary permissions to deploy DAGs and manage resources in your GCP project.

---

## Conclusion

Both the **Test DAG Generator** and the **Composer Workload Simulator** are powerful tools to help you generate and simulate workloads in Cloud Composer environments. Your choice between them should be guided by your specific needs:

- If you need a quick and straightforward way to generate test DAGs with minimal setup, the **Test DAG Generator** is suitable.
- If you require a more detailed and customizable simulation of your workloads, with the ability to define complex TaskFlows and operators, the **Composer Workload Simulator** is the better choice.

By leveraging these tools, you can:

- **Test and Validate**: Ensure your Composer environment can handle your workloads.
- **Optimize Performance**: Identify bottlenecks and adjust configurations for optimal performance.
- **Build Confidence**: Gain trust in Composer's ability to manage your data pipelines effectively.

---

**Note**: Always monitor your Composer environment after deploying generated workloads to observe the impact and make necessary adjustments. Consider cost implications when running extensive simulations.

For more detailed instructions, refer to the respective project repositories and documentation.