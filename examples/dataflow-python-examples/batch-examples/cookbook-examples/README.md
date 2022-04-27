Contains several examples and solutions to common use cases observed in various scenarios


- [Ingesting data from a file into BigQuery](#ingesting-data-from-a-file-into-bigquery)
- [Transforming data in Dataflow](#transforming-data-in-dataflow)
- [Joining file and BigQuery datasets in Dataflow](#joining-file-and-bigquery-datasets-in-dataflow)
- [Ingest data from files into Bigquery reading the file structure from Datastore](#ingest-data-from-files-into-bigquery-reading-the-file-structure-from-datastore)
- [Data lake to data mart](#data-lake-to-data-mart)

The solutions below become more complex as we incorporate more Dataflow features.

## Ingesting data from a file into BigQuery
![Alt text](img/csv_file_to_bigquery.png?raw=true "CSV file to BigQuery")

This example shows how to ingest a raw CSV file into BigQuery with minimal transformation.  It is the simplest example
and a great one to start with in order to become familiar with Dataflow.

There are three main steps:
1. [Read in the file](pipelines/data_ingestion.py#L100-L106).
2. [Transform the CSV format into a dictionary format](pipelines/data_ingestion.py#L107-L113).
3. [Write the data to BigQuery](pipelines/data_ingestion.py#L114-L126).


### Read data in from the file.
![Alt text](img/csv_file.png?raw=true "CSV file")

Using the built in TextIO connector allows beam to have several workers read the file in parallel.  This allows larger
 file sizes and large number of input files to scale well within beam.

Dataflow will read in each row of data from the file and distribute the data to the next stage of the data pipeline.

### Transform the CSV format into a dictionary format.
![Alt text](img/custom_python_code.png?raw=true "Custom Python code")

This is the stage of the code where you would typically put your business logic.  In this example we are simply transforming the
data from a CSV format into a python dictionary.  The dictionary maps column names to the values we want to store in
BigQuery.

### Write the data to BigQuery.
![Alt text](img/output_to_bigquery.png?raw=true "Output to BigQuery")

Writing the data to BigQuery does not require custom code.  Passing the table name and a few other optional arguments
into BigQueryIO sets up the final stage of the pipeline.

This stage of the pipeline is typically referred to as our sink.  The sink is the final destination of data.  No more
processing will occur in the pipeline after this stage.

### Full code examples

Ready to dive deeper?  Check out the complete code [here](pipelines/data_ingestion.py).

## Transforming data in Dataflow
![Alt text](img/csv_file_to_bigquery.png?raw=true "CSV file to BigQuery")

This example builds upon simple ingestion, and demonstrates some basic data type transformations.

In line with the previous example there are 3 steps.  The transformation step is made more useful by translating the
date format from the source data into a date format BigQuery accepts.

1. [Read in the file](pipelines/data_transformation.py#L136-L142).
2. [Transform the CSV format into a dictionary format and translate the date format](pipelines/data_transformation.py#L143-L149).
3. [Write the data to BigQuery](pipelines/data_transformation.py#L150-L161).


### Read data in from the file.
![Alt text](img/csv_file.png?raw=true "CSV file")

Similar to the previous example, this example uses TextIO to read the file from Google Cloud Storage.

### Transform the CSV format into a dictionary format.
![Alt text](img/custom_python_code.png?raw=true "Custom Python code")

This example builds upon the simpler ingestion example by introducing data type transformations.

### Write the data to BigQuery.
![Alt text](img/output_to_bigquery.png?raw=true "Output to BigQuery")

Just as in our previous example, this example uses BigQuery IO to write out to BigQuery.

### Full code examples

Ready to dive deeper?  Check out the complete code [here](pipelines/data_transformation.py).

## Joining file and BigQuery datasets in Dataflow
![Alt text](img/csv_join_bigquery_to_bigquery.png?raw=true "CSV file joined with BigQuery data to BigQuery")

This example demonstrates how to work with two datasets.  A primary dataset is read from a file, and another dataset
containing reference data is read from BigQuery.  The two datasets are then joined in Dataflow before writing the joined
dataset to BigQuery.

This pipeline contains 4 steps:
1. [Read in the primary dataset from a file](pipelines/data_enrichment.py#L165-L176).
2. [Read in the reference data from BigQuery](pipelines/data_enrichment.py#L155-L163).
3. [Custom Python code](pipelines/data_enrichment.py#L138-L143) is used to [join the two datasets](pipelines/data_enrichment.py#L177-L180).
4. [The joined dataset is written out to BigQuery](pipelines/data_enrichment.py#L181-L194).


### Read in the primary dataset from a file
![Alt text](img/csv_file.png?raw=true "CSV file")

Similar to previous examples, we use TextIO to read the dataset from a CSV file.

### Read in the reference data from BigQuery
![Alt text](img/import_state_name_from_bigquery.png?raw=true "Import state name data from BigQuery")

Using BigQueryIO, we can specify a query to read data from.  Dataflow then is able to distribute the data
from BigQuery to the next stages in the pipeline.

In this example the additional dataset is represented as a side input.  Side inputs in Dataflow are typically reference
datasets that fit into memory.  Other examples will explore alternative methods for joining datasets which work well for
datasets that do not fit into memory.

### Custom Python code is used to join the two datasets
![Alt text](img/3_custom_python_code.png?raw=true "Custom python code")

Using custom python code, we join the two datasets together.  Because the two datasets are dictionaries,
the python code is the same as it would be for unioning any two python dictionaries.

### The joined dataset is written out to BigQuery
![Alt text](img/4_output_to_bigquery.png?raw=true "Custom python code")

Finally the joined dataset is written out to BigQuery.  This uses the same BigQueryIO API which is used in previous
examples.

### Full code examples

Ready to dive deeper?  Check out the complete code [here](pipelines/data_enrichment.py).

## Ingest data from files into Bigquery reading the file structure from Datastore

In this example we create a Python [Apache Beam](https://beam.apache.org/) pipeline running on [Google Cloud Dataflow](https://cloud.google.com/dataflow/) to import CSV files into BigQuery using the following architecture:

![Apache Beam pipeline to import CSV into BQ](img/data_ingestion_configurable.jpg)

The architecture uses:
* [Google Cloud Storage]() to store CSV source files
* [Google Cloud Datastore](https://cloud.google.com/datastore/docs/concepts/overview) to store CSV file structure and field type
* [Google Cloud Dataflow](https://cloud.google.com/dataflow/) to read files from Google Cloud Storage, Transform data base on the structure of the file and import the data into Google BigQuery
* [Google BigQuery](https://cloud.google.com/bigquery/) to store data in a Data Lake.

You can use this script as a starting point to import your files into Google BigQuery. You'll probably need to adapt the script logic to your file name structure or to your peculiar needs.

### 1. Prerequisites
 - Up and running GCP project with enabled billing account
 - gcloud installed and initiated to your project
 - Google Cloud Datastore enabled
 - Google Cloud Dataflow API enabled
 - Google Cloud Storage Bucket containing the file to import (CSV format) using the following naming convention: `TABLENAME_*.csv`
 - Google Cloud Storage Bucket for tem and staging Google Dataflow files
 - Google BigQuery dataset
 - [Python](https://www.python.org/) >= 2.7 and python-dev module
 - gcc
 - Google Cloud [Application Default Credentials](https://cloud.google.com/sdk/gcloud/reference/auth/application-default/login)

### 2. Create virtual environment
Create a new virtual environment (recommended) and install requirements:

```
virtualenv env
source ./env/bin/activate
pip install -r requirements.txt
```

### 3. Configure Table schema
Create a file that contains the structure of the CSVs to be imported. Filename needs to follow convention: `TABLENAME.csv`.

Example:
```
name,STRING
surname,STRING
age,INTEGER
```

You can check parameters accepted by the `datastore_schema_import.py` script with the following command:
```
python pipelines/datastore_schema_import.py --help
```

Run the `datastore_schema_import.py` script to create the entry in Google Cloud Datastore using the following command:
```
python pipelines/datastore_schema_import.py --schema-file=<path_to_TABLENAME.csv>
```

### 4. Upload files into Google Cloud Storage
Upload files to be imported into Google Bigquery in a Google Cloud Storage Bucket. You can use `gsutil` using a command like:
```
gsutil cp [LOCAL_OBJECT_LOCATION] gs://[DESTINATION_BUCKET_NAME]/
```
To optimize upload of big files see the [documentation](https://cloud.google.com/solutions/transferring-big-data-sets-to-gcp).
Files need to be in CSV format, with the name of the column as first row. For example:
```
name,surname,age
test_1,test_1,30
test_2,test_2,40
"test_3, jr",surname,50
```

### 5. Run pipeline
You can check parameters accepted by the `data_ingestion_configurable.py` script with the following command:
```
python pipelines/data_ingestion_configurable --help
```

You can run the pipeline locally with the following command:
```
python pipelines/data_ingestion_configurable.py \
--project=###PUT HERE PROJECT ID### \
--input-bucket=###PUT HERE GCS BUCKET NAME: gs://bucket_name ### \
--input-path=###PUT HERE INPUT FOLDER### \
--input-files=###PUT HERE FILE NAMES### \
--bq-dataset=###PUT HERE BQ DATASET NAME###
```

or you can run the pipeline on Google Dataflow using the following command:

```
python pipelines/data_ingestion_configurable.py \
--runner=DataflowRunner \
--max_num_workers=100 \
--autoscaling_algorithm=THROUGHPUT_BASED \
--region=###PUT HERE REGION### \
--staging_location=###PUT HERE GCS STAGING LOCATION### \
--temp_location=###PUT HERE GCS TMP LOCATION###\
--project=###PUT HERE PROJECT ID### \
--input-bucket=###PUT HERE GCS BUCKET NAME### \
--input-path=###PUT HERE INPUT FOLDER### \
--input-files=###PUT HERE FILE NAMES### \
--bq-dataset=###PUT HERE BQ DATASET NAME###
```

### 6. Check results
You can check data imported into Google BigQuery from the Google Cloud Console UI.

## Data lake to data mart
![Alt text](img/data_lake_to_data_mart.png?raw=true "Data lake to data mart")

This example demonstrates joining data from two different datasets in BigQuery, applying transformations to
the joined dataset before uploading to BigQuery.

Joining two datasets from BigQuery is a common use case when a data lake has been implemented in BigQuery.
Creating a data mart with denormalized datasets facilitates better performance when using visualization tools.

This pipeline contains 4 steps:
1. [Read in the primary dataset from BigQuery](pipelines/data_lake_to_mart.py#L278-L283).
2. [Read in the reference data from BigQuery](pipelines/data_lake_to_mart.py#L248-L276).
3. [Custom Python code](pipelines/data_lake_to_mart.py#L210-L224) is used to [join the two datasets](pipelines/data_lake_to_mart.py#L284-L287).
Alternatively, [CoGroupByKey can be used to join the two datasets](pipelines/data_lake_to_mart_cogroupbykey.py#L300-L310).
4. [The joined dataset is written out to BigQuery](pipelines/data_lake_to_mart.py#L288-L301).


### Read in the primary dataset from BigQuery
![Alt text](img/1_query_orders.png?raw=true "Read from BigQuery")

Similar to previous examples, we use BigQueryIO to read the dataset from the results of a query.  In this case our
main dataset is a fake orders dataset, containing a history of orders and associated data like quantity.

### Read in the reference data from BigQuery
![Alt text](img/2_query_account_details.png?raw=true "Import state name data from BigQuery")

In this example we use a fake account details dataset.  This represents a common use case for denormalizing a dataset.
The account details information contains attributes linked to the accounts in the orders dataset.  For example the
address and city of the account.

### Custom Python code is used to join the two datasets
![Alt text](img/3_custom_python_code.png?raw=true "Custom python code")

Using custom python code, we join the two datasets together.  We provide two examples of joining these datasets.  The
first example uses side inputs, which require the dataset fit into memory.  The second example demonstrates how to use
CoGroupByKey to join the datasets.

CoGroupByKey will facilitate joins between two datesets even if neither fit into memory.  Explore the comments in the
two code examples for a more in depth explanation.

### The joined dataset is written out to BigQuery
![Alt text](img/4_output_to_bigquery.png?raw=true "Custom python code")

Finally the joined dataset is written out to BigQuery.  This uses the same BigQueryIO API which is used in previous
examples.

### Full code examples

Ready to dive deeper?  Check out the complete code.
The example using side inputs is [here](pipelines/data_lake_to_mart.py) and the example using CoGroupByKey is
[here](pipelines/data_lake_to_mart_cogroupbykey.py).

