# BigQuery Remote Function Sample Code

[![Open in Cloud Shell][shell_img]][shell_link]

[shell_img]: http://gstatic.com/cloudssh/images/open-btn.png
[shell_link]: https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/K4singh/professional-services&page=editor&open_in_editor=examples/bq-remote-function/string_format

[Bigquery remote function](https://cloud.google.com/bigquery/docs/reference/standard-sql/remote-functions) allows user to deploy their custom services or libraries written in any language other than SQL and javascript, which are not present as bigquery user defined functions.
BQ remote functions provide direct integration with cloud function or cloud run

This repository has string format Java code, which can be deployed on cloud run or cloud function, and can be invoked using SQL queries from BigQuery. 

Bigquery sends HTTP request POST request to cloud run as [input json format](https://cloud.google.com/bigquery/docs/reference/standard-sql/remote-functions#input_format)
and expects endpoint to return code in [output json format](https://cloud.google.com/bigquery/docs/reference/standard-sql/remote-functions#output_format) and error message is 
also sent as [json]()
### Deployment Steps on Cloud Run:
###
[<img src="https://storage.googleapis.com/cloudrun/button.svg" alt="Run on Google Cloud" height="30">][run_button_helloworld]
###
1. Set Environment variables:
    ```
    PROJECT_NAME=$(gcloud config get-value project)
    INSTANCE_NAME=string-format
    REGION=us-central1
    JAVA_VERSION=java11
    SERVICE_ENTRY_POINT=com.google.cloud.pso.bqremotefunc.StringFormat
    ```
2. clone this git repo on GCP project and got to directory
    ```
   cd  examples/bq-remote-function/string_formatter
   ```
3. Deploy the code as cloud run using below commands:
    ```
       gcloud functions deploy $INSTANCE_NAME \
       --project=$PROJECT_NAME \
       --gen2 \
       --region=$REGION \
       --runtime=$JAVA_VERSION \
       --entry-point=$SERVICE_ENTRY_POINT \
       --trigger-http
    ```
4. Copy the https url from cloud run UI

5. Create a remote function in BigQuery.
   1. Create a connection of type **CLOUD_RESOURCE**
   
   replace connection name in below command and run on cloud shell.
   ```
   bq mk --connection \
    --display_name=<connection-name> \
    --connection_type=CLOUD_RESOURCE \
    --project_id=$PROJECT_ID \
    --location=$REGION  <connection-name>

   ```
   2. Create a remote function in BigQuery Editor with below query (replace the variables based on your environment)
    ```
   CREATE or Replace FUNCTION `<project-id>.<dataset>.<function-name>`
   (text STRING) RETURNS STRING
    REMOTE WITH CONNECTION `<BQ connection name>
    OPTIONS (endpoint = '<HTTP end point of the cloud run service>');
   ```
   
6. Use the remote function in a query just like any other user-defined functions.
```
   SELECT 
   `<project-id>.<dataset>.<function-name>`(col_name)
   from
   (select 
   * 
   from 
   unnest(['text1','text2','text3']) as col_name );
```
7. Expected Output
```
text1_test
text2_test
text3_test
```

### Logging and Monitoring the cloud run:

Go to GCP Cloud run, click the instance created 
select LOGS on action bar,
when the instance is invoked from BigQuery, you will see the logs printed,
parallely in METRICS section, you can check the request count, container utilisation and billable time.

### Cost

The cost can be calculated using [pricing calculator](https://cloud.google.com/products/calculator) for both Cloud Run 
and BigQuery utilization by entering CPU, memory and concurrent requests count.


### Clean up

To destroy delete the cloud run instance and bq remote function.

### Limitations:

BQ remote function fails to support [payload >10mb](https://cloud.google.com/bigquery/quotas#query_jobs:~:text=Maximum%20request%20size,like%20query%20parameters),  and accepts certain [data types](https://cloud.google.com/bigquery/docs/reference/standard-sql/remote-functions#limitations).

### Next steps:

For more Cloud Run samples beyond Java, see the main list in the [Cloud Run Samples repository](https://github.com/GoogleCloudPlatform/cloud-run-samples).


[run_button_helloworld]: https://deploy.cloud.run/?git_repo=https://github.com/K4singh/professional-services&dir=examples/bq-remote-function/string_format
