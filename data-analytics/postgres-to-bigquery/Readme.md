# Airflow pipeline of loading data from Postgres to BigQuery
## Overview
This is an Airflow pipeline of conitnuous ingesting data from Postgres to BigQuery. The original purpose of this project was to migrate data from RDS and Redshift to BigQuery.

### Background
When migrate data from RDS and Redshift to Google Cloud Platform, it is a good practice to setup replication peer in Google Cloud SQL Postgres to sync with RDS and Redshift. This is because 1) these systems are Postgre complaint 2) Moving data to GCP first makes data and BigQuery live in the same network to ensure reliability.

## Designs
### Overview of Pipeline
This pipeline starts off by exporting Cloud SQL Postgres data. It can be modified to export from regular Postgres data base. Airflow pipeline will kick in after the data is available. It will first export data and schema in JSON format to local and then transfer to GCS staging bucket. From there, the data will be loaded into BigQuery by loading jobs.

Separate job will regenerate table list on schedule to keep up with the database info. The table list will be uploaded to GCS bucket. The loading Airflow jobs will download the table list and process them.

At the end, Airflow job will reset variables and clean local and GCS staging area.

### Schema Export
Since BigQuery requires schema to load JSON format data, the pipeline uses Postgres JSON features and metadata table to generate JSON schema.
```
SELECT column_name,data_type FROM information_schema.columns WHERE table_schema = '{0}’ AND table_name='{1}' ORDER BY ordinal_position
```
However, we also extract column data type and put into BigQuery schema. We have to convert Postgres data types to BigQuery data types. So far, this code does not handle nested data types yet.
```
SELECT row_to_json(table_json) || ',' FROM (select column_name as name,
CASE
WHEN is_nullable::boolean='t' THEN 'NULLABLE'
WHEN is_nullable::boolean='f' THEN 'REQUIRED'
END as mode ,
CASE
WHEN (data_type = 'text' OR data_type='varchar'
OR data_type ='character varying' OR data_type = 'unknown'
OR data_type='char' OR data_type='character') THEN 'STRING'
WHEN (data_type = 'integer' OR data_type='smallint'
OR data_type='bigint') THEN 'INTEGER'
WHEN (data_type = 'boolean') THEN 'BOOLEAN'
WHEN (data_type = 'real' OR data_type = 'double precision'
OR data_type='numeric' OR data_type='decimal') THEN 'FLOAT'
WHEN (data_type='date') THEN 'DATE'
WHEN (data_type='time' OR data_type='time without time zone'
OR data_type='time with time zone') THEN 'TIME'
WHEN (data_type='timestamp' OR data_type='timestamp without time zone' OR data_type='timestamp with time zone') THEN 'TIMESTAMP' END AS type
FROM information_schema.columns
WHERE table_schema = '{0}' and table_name ='{1}'
ORDER BY ordinal_position)
table_json
```

### Data Export
Postgres data is exported by using the COPY statement and write to local disk files. After getting the data on disks, pipeline will upload them into GCS bucket and delete from local disks to free up space.

### Availability & Consistency During Loading
BigQuery provides atomic loading operations. It means that before data loading is finished, queries against BigQuery will return current table instead of the new table. However, BigQuery currently does not provide this ability on the dataset level.

The solution here is to load the data into a dataset with timestamp. In the dataset that provides external access, we create views using the table’s name. The query inside the views point to the dataset that contains the actual data. Once the data is uploaded into the new dataset. We update the view query to point to the new dataset simultaneously across all views. Because this is only metadata update, the operations take little time.

During the data uploading, users who query the dataset will still read from the dataset from the last time across all tables. So the data consistency is guaranteed unless view updating phase has error.

### Data Source Updates
The data pipeline considered possible changes could happen to the source tables and source databases. The data pipeline will copy data from the transformed operational data. So any changes in the tables will reflected in the destination without changes. It is possible to add transform operations in the pipeline job via either Python code or Dataflow job. Those code will need to consider the changes in schema.

For changes in databases such as adding or deleting tables, a separate “generate table list” job is in the pipeline to query the source database and generate a list of tables and save it to GCS bucket.

The loading pipeline job will download the table list every time Airflow refresh code. But it will not download the table list while the loading job is running to avoid Airflow task list refresh.

### Manage Database Connections
In order to separate the database information from the code, Airflow provides Connection feature to manage interactions with external system. After installing the Python crypto package, Airflow can store encrypted passwords. By referring to the Connection_ID set in the Get Start part, the driver can pass the database connection to different tasks.

In each task, to access the connection object passed, users can do:
```
def xxx_task(db_connection, ……...):
    connection = db_connection.get_conn()
    cur = connection.cursor()
    ………
    connection.close()
```

Sometimes, the number of connection to external database or other systems could cause issues. You can limit the number of connection by putting those tasks into an Airflow Pool set in the Get Start part. It can help limit the number of concurrent connections.

### BigQuery Datasets Rotation
Each job will load data into a new BigQuery dataset with the name of <Dataset Name>_YYYY_MM_DD_HH_MM. The reason of this is that we do not need to keep all the dataset history. So after the data is loaded, the dataset from last run is no longer useful, therefore, the pipeline job will delete the entire dataset from the last run.

Data accessing is not affected by this dataset rotation mechanism. Because we create views in another dataset with standard name and only update the view query to read from the updated dataset.

Airflow job uses Airflow Variable to keep track of the timestamp of last run. When the loading phase and view updating phase are finished, the pipeline will delete the dataset of the last run by getting the suffix from Airflow Variable. After deletion is done, the current timestamp is set to be the value of the Airflow Variable for next time the pipeline run.

### Configuration
All the job configurations are in the file “cloudsql_to_bigquery.cfg”.

### Automation
When creating Airflow cluster to run this pipeline, you need to upload the scripts to a GCS bucket. Then you can create the VMs to run Airflow cluster with GCP startup script "airflow_startup.sh". It will setup all the software environment and configure Airflow cluster for you.

You also need to create Cloud SQL instances of Postgres and MySQL. The latter is for Airflow backend to store configuration and job data. 

CloudSQL has access control which limits the IP address allowed to connect to it. GCP provides Cloud SQL Proxy to avoid configuring IP address. The startup process also install Supervisor to manage Cloud SQL Proxy. To change Cloud SQL information, you can modify cloud_sql_proxy.conf.
