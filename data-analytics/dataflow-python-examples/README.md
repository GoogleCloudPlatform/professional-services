- [Dataflow using python](#dataflow-using-python)
  - [Ingesting data from a file into BigQuery](#ingesting-data-from-a-file-into-bigquery)
    - [Read data in from the file.](#read-data-in-from-the-file)
    - [Transform the CSV format into a dictionary format.](#transform-the-csv-format-into-a-dictionary-format)
    - [Write the data to BigQuery.](#write-the-data-to-bigquery)
    - [Full code examples](#full-code-examples)
  - [Transforming data in Dataflow](#transforming-data-in-dataflow)
    - [Read data in from the file.](#read-data-in-from-the-file)
    - [Transform the CSV format into a dictionary format.](#transform-the-csv-format-into-a-dictionary-format)
    - [Write the data to BigQuery.](#write-the-data-to-bigquery)
    - [Full code examples](#full-code-examples)
  - [Joining file and BigQuery datasets in Dataflow](#joining-file-and-bigquery-datasets-in-dataflow)
    - [Read in the primary dataset from a file](#read-in-the-primary-dataset-from-a-file)
    - [Read in the reference data from BigQuery](#read-in-the-reference-data-from-bigquery)
    - [Custom Python code is used to join the two datasets](#custom-python-code-is-used-to-join-the-two-datasets)
    - [The joined dataset is written out to BigQuery](#the-joined-dataset-is-written-out-to-bigquery)
    - [Full code examples](#full-code-examples)
  - [Data lake to data mart](#data-lake-to-data-mart)
    - [Read in the primary dataset from BigQuery](#read-in-the-primary-dataset-from-bigquery)
    - [Read in the reference data from BigQuery](#read-in-the-reference-data-from-bigquery)
    - [Custom Python code is used to join the two datasets](#custom-python-code-is-used-to-join-the-two-datasets)
    - [The joined dataset is written out to BigQuery](#the-joined-dataset-is-written-out-to-bigquery)
    - [Full code examples](#full-code-examples)



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

### Full code examples

Ready to dive deeper?  Check out the complete code [here](dataflow_python_examples/data_ingestion.py)

## Transforming data in Dataflow
![Alt text](img/csv_file_to_bigquery.png?raw=true "CSV file to BigQuery")

This example builds upon simple ingestion, and demonstrates some basic data type transformations.

In line with the previous example there are 3 steps.  The transformation step is made more useful by tranlating the
date format from the source data into a date format BigQuery accepts.

1. Read in the file.
2. Transform the CSV format into a dictionary format and translate the date format.
3. Write the data to BigQuery.


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

Ready to dive deeper?  Check out the complete code [here](dataflow_python_examples/data_transformation.py)

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

### Full code examples

Ready to dive deeper?  Check out the complete code [here](dataflow_python_examples/data_enrichment.py)


## Data lake to data mart
![Alt text](img/data_lake_to_data_mart.png?raw=true "Data lake to data mart")

This example demonstratings joining data from two different datasets in BigQuery, applying transformations to
the joined dataset before uploading to BigQuery.

Joining two datasets from BigQuery is a common use case when a data lake has been implemented in BigQuery.  
Creating a data mart with denormalized datasets facilitates better performance when using visualization tools.
 
This pipeline contains 4 steps:
1. Read in the primary dataset from BigQuery
2. Read in the reference data from BigQuery
3. Custom Python code is used to join the two datasets
4. The joined dataset is written out to BigQuery


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
The example using side inputs is [here](dataflow_python_examples/data_lake_to_mart.py) and the example using CoGroupByKey is 
[here](dataflow_python_examples/data_lake_to_mart_cogroupbykey.py).

