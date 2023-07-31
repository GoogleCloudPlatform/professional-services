# Test DAG Generator 
This framework is used to generate test DAGs by randomly selecting Airlflow operators. These test DAGs can be used to test Cloud Composer environments and other Airflow Environments. It is designed using a configuration file which specifies number of test DAGs to be generated, total number of tasks per DAG and with confgurable parallelsim.

# How It Works
## DAG Generation
#### Usage
```
python dag_generator
```
#### Steps to be performed
- Update configurations in [config.json](./config.json) file
  - number_of_dags_to_generate: Int - put the number of test DAGs to be geberated in [out](./out) folder  
  - file_start_index: Int - Starting index value to be included in DAG file name. Each DAG file contains an index integer value example: dagFile_5.py 
  - min_number_of_task_in_dag: Int - Minimum boundary for number of tasks in the test DAGs. Actual number will be randomly selected between min and max boundaries
  - max_number_of_task_in_dag: Int -  Maximum boundary for number of tasks in the test DAGs. Actual number will be randomly selected between min and max boundaries
  - percentage_of_job_in_parallel: Int - Number of tasks that can run un parallel within each test DAG 
  - number_of_operators_defined: Int : Defines selecivity of the operator types. Curreently there are 5 operators defined and hence a value of 5 will select all operators depending upon the the number of tasks
  - task_min_time_in_sec: Int - Minimum boundary for seconds the tasks will go to sleep. Actual number will be randomly selected between min and max boundaries
  - task_max_time_in_sec: Int - Maximum boundary for seconds the tasks will go to sleep. Actual number will be randomly selected between min and max boundaries
  - schedules: List of Strings - DAG schedule is randomly seelcted from this. Sample - ["everyhalfhour", "everyhalfhour", "everyhalfhour", "everyhalfhour", "everyhalfhour"]


## Other Helper Functions


### DAG Triggerer 
This bash script triggers the test DAGs (by clearing tasks) generated via the DAG_Generator Module in a Cloud Composer Environment  


#### Usage

```
bash run_dags.sh -e {composer_env_name} \
                 -r {region} \
                 -p {project} \
                 -n {num_of_dags}
```
Note: Since this uses airflow command to clear DAG tasks, the host where this is executed must have connectivity with Cloud composer environment. Additional steps may be required for private IP environments 



### Pause DAGs 
This bash script pauses or activates the test DAGs generated via the DAG_Generator Module in a Cloud Composer Environment  

#### Usage

```
bash pause_dags.sh -a {pause or unpause} \
                   -e {env_name} \
                   -r {region} \
                   -p {project} \
                   -n {num_of_dags} 
```
Note: Since this uses airflow command to trigger DAGs, the instance where this is executed must have connectivity with Cloud composer environment. Additional steps may be required for private IP environments 

## Install
### Prerequisites
- Python 3.7+
- Cloud Composer 2+
