# BigQuery Audit Log Anomany Detection
BQ Audit log anomanly detection is a tool which uses [Cloud Data Access Audit logs](https://cloud.google.com/logging/docs/audit#:~:text=Data%20Access%20audit%20logs%20contain,read%20user%2Dprovided%20resource%20data.) for automated analysis of Big Data Cloud environments with a focus on BigQuery. The tool summarized and aggregated BigQuery Audit Logs into metric values that provide insights into BigQuery jobs. Anomalous datapoints are determined by how similar they are to other datapoints in the audit logs. 

To identify outliers, this tool showcases two methods: 

1. <b> Outliers in groups: </b> This method looks for a datapoint that differs signicantly from others within various groups (can be one of the following: 'principalEmail', 'eventName', 'projectId', 'dayOfWeek', 'hourOfDay'). This means that it identifies entities within the group which use BQ differently (more or less) from others. 
2.  <b> Time Series Analysis: </b> Looking for outliers in periodic trends by looking at audit logs chronologically. This method has an underlying assumption that BigQuery usage has trends.

A sample of the outputs can be found in [audit_log_anomaly_detection.ipynb](audit_log_anomaly_detection.ipynb).


## Requirements
This demo showcases the outputs of the tool when identifying anomalous BQ usage. To run the tool locally, you would require the following requirements:

* <b>Access to Cloud Data Access Logs in BigQuery:</b> Usually labelled `cloudaudit_googleapis_com_data_access_*` where * is a wildcard usually for the date. The data has to be in bigquery. To have access to BigQuery Audit Logs, you would have to [create a Log Sink](https://cloud.google.com/logging/docs/export/configure_export_v2). 
* <b>Same location of source and destination datasets:</b> As per BigQuery, the created view's destination dataset has to be in the same GCP location as the source dataset. 
* <b>V1 Logs:</b> This tool is build using V1 logs and requires that `protopayload_auditlog.servicedata_v1_bigquery` to be one of the fields in the Audit Logs. 
* <b>IAM Access:</b> Access to the the project, destination project, audit log dataset and destination audit log dataset. 
* <b>Jupyter Notebook:</b> Can be run using local jupyter notebook or an ai platform notebook of GCP. 

## Set Up 
### var.env file
Configure the location where the tool will extract the required data by changing the following variables in the `var.env` file. 

The <b> Source Project Dataset </b> variables determine where the audit log data will be drawn from. The <b> Destination View </b> variables determine where the generated intermediate view needed for further analysis is created. 

```
# Source Project Dataset
project_id       = "your-project-id"
data_project_id  = "your-project-id" (if different)
dataset_id       = "your-log-dataset"
audit_log_table  = "your_audit_log_data_access_*"
location         = "data_location"
audit_log_partitioned = True or False 

## Destination View 
destination_project_id = "your-project-id"
destination_dataset_id = "your-dataset-id"
summary_table_name     = "your-view-name"
```

## How it works
### <b> Creating a log sink: Getting the BigQuery log Data </b>

A detailed description of steps to collect BigQuery logs for your GCP Projects can be found [here](https://cloud.google.com/logging/docs/export/configure_export_v2).

### <b> Summarizing Audit Logs </b>
The first step is carrying out aggregations from BigQuery Data Access Audit logs. This is executed in [viewsFactory.py](viewsFactory.py). The aggregation involves using Job statistics to extract useful query and resource metric information. 

### <b> Outliers in groups </b>
The algorithm to identify outliers within a group is as follows: 
1. Aggregate the average for each individual in a selected group (eg: principalEmail). 
2. Calculate the mean and standard deviation across all the groups. 
3. User selects a sigma value which determines how stringent to look for outliers. For example, if you expect all emails in your bq environment to carrying about roughly equal jobs, you will set a lower sigma value. 
3. If the individual score more than sigma from the standard deviation, the point will be flagged as an outlier. 

### <b> Time Series Analysis </b>
The algorithm to identify time series outliers is as follows: 
1. Calculated the average totalTablesProcessed per query per hour.
2. Carry out STL composition to decompose the time series into Seasonlity and Trend which is used to calculate an estimate: <br>
`estimation = trend + seasonal`
3. Outliers are determined by finding the difference between the estimated reconstructed time series and the actual value (residual). Any residual above a sigma threshold (user defined) is flagged as an outlier in the plot below. 
 
### <b> No code view </b>
[Voila](https://github.com/voila-dashboards/voila) allows notebooks to be run with a no-code view for increased usability. 
To view a fully functional version of this sample without the code blocks, append the end of the Jupyter URL with `/voila`. <br> <br>
For example: 
* https://localhost:3000/voila