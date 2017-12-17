# Dataflow using python
This repo contains several examples of the Dataflow python API.  The examples are solutions to common use cases we see 
in the field.

The solutions below become more complex as we incorporate more Dataflow features.  

## Ingesting data into BigQuery
This example shows how to ingest a raw CSV file into BigQuery with minimal transformation.  It is the simplest example
and a great one to start with in order to become familiar with Dataflow.

There are three main steps:
1. Read in the file.
2. Transform the CSV format into a dictionary format.
3. Write the data to BigQuery.

![Alt text](img/csv_file_to_bigquery.png?raw=true "CSV file to BigQuery")

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

## Joining data
Read a dataset from a file, and another from BigQuery.  Load the joined
results into BigQuery.

## Data lake to data mart
Join data from two different datasets in BigQuery, applying transformations to
the joined dataset before uploading to BigQuery.
