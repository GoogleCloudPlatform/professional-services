# How to run pipeline locally?
1. Setup python enviroment. Follow `Local Developemnt - Dependecies setup` instructions in top level README.md file
2. Ensure that your application-default login is up to date
   
    `gcloud auth application-default login`
3. Run main script providing input and output pahts. Those paths can point to local filesystem or GCS
```bash
python main.py --input gs://gcs-path  --output gs://gcs-path
```
Estimated run time bellow 1 min

# How to run pipeline in cloud?

## Use gcloud script
1. Authenticate with google cloud: `gcloud auth login`
2. In script [run_escape_quotes_dataflow_template.sh](run_escape_quotes_dataflow_template.sh) - Update `GCS_INPUT` and `GCS_OUTPUT` variavbles with GCS uri `gs://path-to-files`
3. `bash run_escape_quotes_dataflow_template.sh`
   Estimated run time: ~8 min

## Use Airflow DAG
1. Update [dataflow_test_dag.py](..%2F..%2Fairflow%2Fdataflow_test_dag.py) and upload it to Airflow. Trigger the DAG

Estimated run time: ~8 min



