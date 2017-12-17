# Dataflow using python
This repo contains several examples of the Dataflow python API.  The examples are solutions to common use cases we see 
in the field.

The solutions below become more complex as we incorporate more Dataflow features.  

## Ingesting data from a file into BigQuery
![Alt text](img/csv_file_to_bigquery.png?raw=true "CSV file to BigQuery")

This example shows how to ingest a raw CSV file into BigQuery with minimal transformation.  It is the simplest example
and a great one to start with in order to become familiar with Dataflow.

There are three main steps:
1. Read in the file.
2. Transform the CSV format into a dictionary format.
3. Write the data to BigQuery.


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

## Transforming data
Transform data from file and load into BigQuery.

## Joining file and BigQuery datasets in Dataflow
![Alt text](img/csv_join_bigquery_to_bigquery.png?raw=true "CSV file joined with BigQuery data to BigQuery")

This example demonstrates how to work with two datasets.  A primary dataset is read from a file, and another dataset 
containing reference is read from BigQuery.  The two datasets are then joined in Dataflow before writing the joined 
dataset down to BigQuery.  
 
This pipeline contains 4 steps:
1. Read in the primary dataset from a file
2. Read in the reference data from BigQuery
3. Custom Python code is used to join the two datasets
4. The joined dataset is written out to BigQuery


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

## Data lake to data mart
Join data from two different datasets in BigQuery, applying transformations to
the joined dataset before uploading to BigQuery.
