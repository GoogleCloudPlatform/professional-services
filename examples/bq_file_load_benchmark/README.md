# BigQuery File Load Benchmark

Customers often have questions on the performance of batch file loads to
BigQuery tables. For example, how does file format, the number of columns, 
column types, number of files or file sizes affect the performance of load jobs.
While Google has high-level guidelines, we don't have hard data on how these 
parameters specifically affect performance. This project contains the tools to 
provide the data to answer these questions. 

## File Parameters
Specifc file parameters are used in this project for performance testing. While 
the list of parameters is growing, the current list of paramters and values
is as follows:

##### File Type: 

* Avro
* CSV
* JSON
* Parquet

##### Compression: 

* gzip (for CSV and JSON)
* snappy (for AVRO)

##### Number of columns
* 10
* 100
* 1000

##### Column Types
* String-only
* 50% String / 50% NUMERIC
* 10% String / 90% NUMERIC

##### Number of files
* 1
* 100
* 1000
* 10000

##### Target Data Size (Size of the BigQuery staging table used to generate each file)
* 10MB
* 100MB
* 1GB
* 2GB

These parameters are used to create combinations of file types stored on in a 
bucket on GCS. An example of a file prefix generated from the above list of file parameters is: 
`fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=100/tableSize=10MB/* `.
This prefix holds 100 uncompressed CSV files, each generated from a 10 MB BigQuery
staging table with 10 string columns. The tool loads the 100 CSV files with this prefix 
to a BigQuery table and records the performance to create a benchmark. 

In the future, a parameter for slot type will be added with values for communal
and reserved. In addition, ORC will be added as a value for file type, and struct/
array types will be added to the values for column types. 

## Benchmark Results

#### BigQuery

The results of the benchmark loads are saved in a separate BigQuery table for 
ad hoc analysis. The results table contains the following schema: 

| Field Name        | Type    | Description     |
| :------------- | :----------- | :----------- |
|  benchmarkTime | TIMESTAMP   | The time at which the benchmark was executed|
|  fileType  | STRING | The file type tested |
|  compressionType | STRING  | The method in which the file is compressed  |
|  numColumns| INTEGER   | The number of columns in each file   |
|  numRows| INTEGER   | The number of rows in the benchmark table   |
|  columnTypes | STRING  | The distribution of column types     |
|  numFiles | INTEGER   | The number of files tested  |
|  fileSize | INTEGER   | The size of each file in MB  |
|  stagingDataSize | INTEGER   | The size of the staging table used to generate each file in MB |
|  job | RECORD   | -    |'
|  job.id | STRING   | The id of the load job   |
|  job.user | STRING   | The user who executed the job   |
|  job.location | STRING   | The location of the job execution    |
|  job.startTime | TIMESTAMP   | The time at which the job started    |
|  job.endTime | TIMESTAMP   | The time at which the job ended   |
|  job.duration | NUMERIC   | The duration of the job in seconds    |
|  job.destinationTable | STRING   | The name of the benchmark table  |
|  job.sourceURI | STRING   | The path of all files loaded   |
|  job.sourceFormat | STRING   | The format of files loaded    |
|  job.totalSlotMs  | INTEGER  | The total number of slot-ms consumed by the job.    |
|  job.avgSlots     | FLOAT    | Average number of slots used throught runtime of job.    |

While the project can be configured to create results table with the above 
schema in any project and dataset, the table that currently holds the results 
is data-analytics-pocs.bq_loader_benchmark.bq_load_results.

#### DataStudio

The results from data-analytics-pocs.bq_loader_benchmark.bq_load_results can 
also be visualized in the DataStudio dashboard [BQ File Load Benchmark](https://datastudio.google.com/c/u/0/reporting/1BaLLUWeKowOHswKcimot6f35K-yfI9DE/page/BNDj_) .

## Usage
This project contains the tools to generate files from the list of file 
parameter
combinations, load the each file combination into BigQuery, and save the results
to a BigQuery Results table. It can be configured to run in entirely from 
scratch in your own project, or it can be configured to load files that have 
already been generated in the data-analtyics-pocs project into BigQuery in your
project. Either way, the main method for the project is located in 
[`bq_file_load_benchmark.py`](bq_file_load_benchmark.py).

### Running from Scratch

#### 1. Select File Parameters
File parameters can be configured in the `FILE_PARAMETERS` dictionary in 
[`benchmark_tools/file_parameters.py`](load_benchmark_tools/load_file_parameters.py). Currently, 
no files parameters can be added to the dictionary, as this will cause errors.
However, parameters can be removed
from the dictionary if you are looking for a smaller set of file combinations. 
Note that the parameter `numFiles` has to include at least the number 1 to 
ensure that the subsequent number of files are properly created. This is 
because the program uses this first file to make copies to create subsequent 
files. This is a much faster alternative than recreating identical files.
For example, if you don't want the 1000 or 10000 as `numFile` parameters, 
you can take them out, but you must leave 1 (e.g. [1, 100]). That way the first
file can be copied to create the 100 files. 

#### 2. Create the Results Table

If running the whole project from scratch, the first step is to create a table
in BigQuery to store the results of the benchmark loads. A json file has been 
provided in the json_schemas directory ([results_table_schema.json](json_schemas/results_table_schema.json)) 
with the  above schema. The schema can be used to create the results 
table by running the using the following command:
```
python bq_file_load_benchmark.py \
--create_results_table \
--results_table_schema_path=<optional path to json schema for results table> \
--results_table_name=<results table name> \
--results_dataset_id=<dataset ID>
```

Parameters:

`--create_results_table`: Flag to indicate that a results table should be created. It has a value of 
`store_true`, so this flag will be set to False, unless it is provided in the 
command.


`--results_table_schema_path`: Optional argument. It defaults to `json_schemas/results_table_schema.json`. 
If using a json schema in a different location, provide the path to that 
schema. 


`--results_table_name`: String representing the name of the results table. Note that just the table name
is needed, not the full project_id.dataset_id.table_name indicator. 

`--dataset_id`: ID of the dataset to hold the results table. 

#### 3. Create Schemas for the Benchmark Staging Tables
In order to create the files with the above parameters, the [Dataflow Data Generator
tool](https://github.com/GoogleCloudPlatform/professional-services/tree/master/examples/dataflow-data-generator) 
from the Professional Services Examples library needs to be leveraged to create
staging tables containing combinations of `columnTypes` and `numColumns` from the
list of file parameters in [`benchmark_tools/file_parameters.py`](load_benchmark_tools/load_file_parameters.py). The staging tables
will later be resized to match the sizes in `targetDataSize` file parameter, and then
they will be extracted to files in GCS. However, before any of this can be done, JSON schemas for 
the staging tables must be created. To do this run the following command: 

```
python bq_file_load_benchmark.py \
--create_benchmark_schemas \
--benchmark_table_schemas_directory=<optional directory where schemas should be stored>
```

Parameters:

`--create_benchmark_schemas`: Flag to indicate that benchmark schemas should be created. It has a value of 
`store_true`, so this flag will be set to False, unless it is provided in the 
command.

`--benchmark_table_schemas_directory`: Optional argument for the directory where
the schemas for the staging tables are to be stored. It defaults to `json_schemas/benchmark_table_schemas`. 
If you would prefer that the schemas are written to a different directory, provide that directory. 

#### 4. Create Staging Tables
Once the schemas are created for the staging tables, the staging tables themselves can be 
created. This is a two step process. 

First, a set of staging tables are created using the data_generator_pipeline 
module in the [Dataflow Data Generator
tool](https://github.com/GoogleCloudPlatform/professional-services/tree/master/examples/dataflow-data-generator) using
the schemas created in step 3. One staging table is created for each combination of columnTypes and
numColumns file parameters. A small number of rows are created in each staging table (500 rows) to 
get the process started. Once the tables are created, they are saved in a staging dataset. The names of
staging tables are generated using their respective columnTypes and numColumms parameters. 
For example, a staging table created using the 100_STRING `columnTypes` param and 10
`numColumns` would be named `100_STRING_10`.

Second, each staging table is used to create resized staging tables to match the sizes in the `targetDataSizes` parameter.
This is accomplished using the [bq_table_resizer module](https://github.com/GoogleCloudPlatform/professional-services/blob/master/examples/dataflow-data-generator/bigquery-scripts/bq_table_resizer.py)
 of the [Dataflow Data Generator
tool](https://github.com/GoogleCloudPlatform/professional-services/tree/master/examples/dataflow-data-generator). 
The resized staging tables are saved in a second staging dataset ws). The names of
resized staging tables are generated using the name of the staging table they were 
resized from, plus the `targetDataSizes` param. For example, the `100_STRING_10` staging table 
from above will be used to create the following four tables in the
resized staging dataset: `100_STRING_10_10MB`, `100_STRING_10_100MB`, `100_STRING_10_1GB`,
`100_STRING_10_2GB`. 

To run the process of creating staging and resized staging tables, run the following
command:
```
python bq_file_load_benchmark.py \
--create_staging_tables \
--bq_project_id=<ID of project holding BigQuery resources> \
--staging_dataset_id=<ID of dataset holding staging tables> \
--resized_staging_dataset_id=<ID of dataset holding resized staging tables> \
--benchmark_table_schemas_directory=<optional directory where staging table schemas are stored> \
--dataflow_staging_location=<path on GCS to serve as staging location for Dataflow> \
--dataflow_temp_location=<path on GCS to serve as temp location for Dataflow>
```

Parameters:

`--create_staging_tables`: Flag to indicate that staging and resized staging
tables should be created. It has a value of `store_true`, so this flag will be 
set to False, unless it is provided in the 
command.

`--bq_project_id`: The ID of the project that will hold the BigQuery resources for
the benchmark, including all datasets, results tables, staging tables, and 
benchmark tables.

`--staging_dataset_id`: The ID of the dataset that will hold the first set of staging
tables. For the tool to work correctly, the `staging_dataset_id` must only contain
staging tables, and it must be different than the `--resized_staging_dataset_id`. 
Do not store tables for any other purposes in this dataset. 

`--resized_staging_dataset_id`: The ID of the dataset that will hold the resized staging
tables. For the tool to work correctly, the `resized_staging_dataset_id` must only contain
resized staging tables, and it must be different than the `--staging_dataset_id`. 
Do not store tables for any other purposes in this dataset.

`--benchmark_table_schemas_directory`: Optional argument for the directory where
the schemas for the staging tables are stored. It defaults to 
`json_schemas/benchmark_table_schemas`. If your schemas are elsehwere, provide
that directory. 

`--dataflow_staging_location`: Staging location for Dataflow on GCS. Include
the 'gs://' prefix, the name of the bucket you want to use, and any prefix. For example
'`gs://<bucket_name>/staging`. Note: be sure to use a different bucket than the one
provided in the --bucket_name parameter used below with the `--create_files` and
-`-create_benchmark` tables flags.

`--dataflow_temp_location`: Temp location for Dataflow on GCS. Include
the 'gs://' prefix, the name of the bucket you want to use, and any prefix. For example
'`gs://<bucket_name>/temp`. Note: be sure to use a different bucket than the one
provided in the --bucket_name parameter used below with the `--create_files` and
-`-create_benchmark tables flags`.

#### 5. Create Files
Once the resized staging tables are created, the next step is to use the resized
staging tables to create the files on GCS. The resized staging tables already contain
combinations of the `columnTypes`, `numColumns`, and `targetDataSize` parameters. Now 
each of the resized staging tables must be extracted to combinations of files 
generated from the fileType and compression parameters. In each combination, 
the extraction is only done for the first file (`numFiles`=1). For example,
the resized staging table `100_STRING_10_10MB` must be use to create the following
files on GCS:

* fileType=avro/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1/tableSize=10MB/file1.avro
* fileType=avro/compression=snappy/numColumns=10/columnTypes=100_STRING/numFiles=1/tableSize=10MB/file1.snappy
* fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1/tableSize=10MB/file1.csv
* fileType=csv/compression=gzip/numColumns=10/columnTypes=100_STRING/numFiles=1/tableSize=10MB/file1.gzip
* fileType=json/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1/tableSize=10MB/file1.json
* fileType=json/compression=gzip/numColumns=10/columnTypes=100_STRING/numFiles=1/tableSize=10MB/file1.gzip
* fileType=parquet/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1/tableSize=10MB/file1.parquet


The method of extracting the resized staging table depends on the combination of parameters. 
BigQuery extract jobs are used if the `fileType` is csv or json, or if the `fileType` is avro and
the resized staging table size is <= 1 GB. If the `fileType` is avro and the `targetDataSize`
is > 1 GB, DataFlow is used to generate the file, since attempting to extract a staging table
of this size to avro causes errors. If the `fileType` is parquet, DataFlow is used as well, 
since BigQuery extract jobs don't support the parquet file type. 

Once the first file for each combination is generated (`numFiles`=1), it is copied
to create the same combination of files, but where numFiles > 1. More specifically,
it is copied 100 times for `numFiles`=100, 1000 times for `numFiles`=1000, and
10000 times for `numFiles`=10000. Copying is much faster than extracting each 
table tens of thousands of times. As an example, the files listed above are 
copied to create the following 77,700 files: 

* fileType=avro/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=100/tableSize=10MB/* (contains file1.avro- file100.avro)
* fileType=avro/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1000/tableSize=10MB/* (contains file1.avro - file1000.avro)
* fileType=avro/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=10MB/* (contains file1.avro - file10000.avro)
* fileType=avro/compression=snappy/numColumns=10/columnTypes=100_STRING/numFiles=100/tableSize=10MB/* (contains file1.snappy- file100.snappy)
* fileType=avro/compression=snappy/numColumns=10/columnTypes=100_STRING/numFiles=1000/tableSize=10MB/* (contains file1.snappy - file1000.snappy)
* fileType=avro/compression=snappy/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=10MB/* (contains file1.snappy - file10000.snappy)
* fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=100/tableSize=10MB/* (contains file1.csv - file100.csv)
* fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1000/tableSize=10MB/* (contains file1.csv - file1000.csv)
* fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=10MB/* (contains file1.csv - file10000.csv)
* fileType=csv/compression=gzip/numColumns=10/columnTypes=100_STRING/numFiles=100/tableSize=10MB/* (contains file1.gzip - file100.gzip)
* fileType=csv/compression=gzip/numColumns=10/columnTypes=100_STRING/numFiles=1000/tableSize=10MB/* (contains file1.gzip - file1000.gzip)
* fileType=csv/compression=gzip/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=10MB/* (contains file1.gzip - file10000.gzip)
* fileType=json/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=100/tableSize=10MB/* (contains file1.json - file100.json)
* fileType=json/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1000/tableSize=10MB/* (contains file1.json - file1000.json)
* fileType=json/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=10MB/* (contains file1.json - file10000.json)
* fileType=json/compression=gzip/numColumns=10/columnTypes=100_STRING/numFiles=100/tableSize=10MB/* (contains file1.gzip - file100.gzip)
* fileType=json/compression=gzip/numColumns=10/columnTypes=100_STRING/numFiles=1000/tableSize=10MB/* (contains file1.gzip - file1000.gzip)
* fileType=json/compression=gzip/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=10MB/* (contains file1.gzip - file10000.gzip)
* fileType=parquet/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=100/tableSize=10MB/* (contains file1.parquet- file100.parquet)
* fileType=parquet/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1000/tableSize=10MB/* (contains file1.parquet - file1000.parquet)
* fileType=parquet/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=10MB/* (contains file1.parquet - file10000.parquet)

To complete the process of creating files, run the following command:
```
python bq_file_load_benchmark.py \
--create_files \
--gcs_project_id=<ID of project holding GCS resources> \
--resized_staging_dataset_id=<ID of dataset holding resized staging tables> \
--bucket_name=<name of bucket to hold files> \
--dataflow_staging_location=<path on GCS to serve as staging location for Dataflow> \
--dataflow_temp_location=<path on GCS to serve as temp location for Dataflow> \
--restart_file=<optional file name to restart with if program is stopped> \

```

Parameters:

`--create_files`: Flag to indicate that files should be created and stored on GCS.
It has a value of `store_true`, so this flag will be 
set to False, unless it is provided in the 
command.

`--gcs_project_id`: The ID of the project that will hold the GCS resources for
the benchmark, including all files and the bucket that holds them. 

`--resized_staging_dataset_id`: The ID of the dataset that holds the resized
staging tables generated using the `--create_staging_tables` command. 

`--bucket_name`: Name of the bucket that will hold the created files. Note that
the only purpose of this bucket should be to hold the created files, and that files
used for any other reason should be stored in a different bucket. 

`--dataflow_staging_location`: Staging location for Dataflow on GCS. Include
the 'gs://' prefix, the name of the bucket you want to use, and any prefix. For example
`gs://<bucket_name>/staging`. Note: be sure to use a different bucket than the one
provided in the `--bucket_name parameter`.

`--dataflow_temp_location`: Temp location for Dataflow on GCS. Include
the 'gs://' prefix, the name of the bucket you want to use, and any prefix. For example
`gs://<bucket_name>/temp`. Note: be sure to use a different bucket than the one
provided in the `--bucket_name parameter`.

`--restart_file`: Optional file name to start the file creation process with. Creating
each file combination can take hours, and often a backend error or a timeout will
occur, preventing all the files from being created. If this happens, copy the last file 
that was successfully created from the logs and use it here. It should start with `fileType=`
and end with the file extension. For example, 
`fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1000/tableSize=10MB/file324.csv`

#### 6. Create Benchmark Tables
The last step is to load the file combinations created above into benchmark tables
and to record information about the load performance in the results table. For each
file combination that exists, the tool creates a benchmark table, loads the file 
(or files if the numFiles > 1) into the benchmark table using a BigQuery load jobs,
waits for the load to finish, and obtains information about the benchmark table and
load job to create a results row, and inserts the results row into the results 
table. 

As a prerequisite for this step, a log sink in BigQuery that captures logs
about BigQuery must be set up in the same project that holds the benchmark
tables. To create a BigQuery is not already set up, follow [these steps](https://github.com/GoogleCloudPlatform/professional-services/tree/master/examples/bigquery-audit-log#1-getting-the-bigquery-log-data).

To create benchmnark tables, run the following command: 

```
python bq_file_load_benchmark.py \
--create_benchmark_tables \
--bq_project_id=<ID of the project holding the BigQuery resources> \
--gcs_project_id=<ID of project holding GCS resources> \
--staging_project_id=<ID of project holding staging tables> \
--staging_dataset_id=<ID of dataset holding staging tables> \
--benchmark_dataset_id=<ID of the dataset holding the benchmark tables> \
--bucket_name=<name of bucket to hold files> \
--results_table_name=<Name of results table> \
--results_dataset_id=<Name dataset holding resultst table> \
--duplicate_benchmark_tables \
--bq_logs_dataset=<Name of dataset hold BQ logs table> 

```

Parameters:

`--create_benchmark_tables`: Flag to indicate that benchmark tables should be created.
It has a value of `store_true`, so this flag will be 
set to False, unless it is provided in the 
command.

`--gcs_project_id`: The ID of the project that will hold the GCS resources for
the benchmark, including all files and the bucket that holds them. 

`--bq_project_id`: The ID of the project that will hold the BigQuery resources for
the benchmark, including all datasets, results tables, staging tables, and 
benchmark tables.

`--staging_project_id`: The ID of the project that holds the first set of staging
tables. While this will be the same as the `--bq_project_id` if running the project
from scratch, it will differ from `--bq_project_id` if you are using file combinations
that have already been created and running benchmarks/saving results in your own project. 

`--staging_dataset_id`: The ID of the dataset that will hold the first set of staging
tables. For the tool to work correctly, the `staging_dataset_id` must only contain
staging tables, and it must be different than the `--resized_staging_dataset_id`. 
Do not store tables for any other purposes in this dataset. 

`--dataset_id`: The ID of the dataset that will hold the benchmark tables. 

`--bucket_name`: Name of the bucket that will hold the file combinations to be
loaded into benchmark tables. Note that the only purpose of this bucket should 
be to hold the file combinations, and that files used for any other reason 
should be stored in a different bucket. 

`--results_table_name`: Name of the results table to hold relevant information
about the benchmark loads. 

`--results_dataset_id`: Name of the dataset that holds the results table.

`--duplicate_benchmark_tables`: Flag to indicate that a benchmark table should be
created for a given file combination, even if that file combination has a benchmark 
table already. Creating multiple benchmark tables for each file combination can 
increase the accuracy of the average runtimes calculated from the results. If 
this behavior is desired, include the flag. However, if you want to ensure that you
first have at least one benchmark table for each file combination, then leave the
flag off. In that case, the benchmark creation process will skip a file combination 
if it already has a benchmark table. 

`--bq_logs_dataset`: Name of dataset hold BQ logs table. This dataset must be
in project used for `--bq_project_id`. 


### Running with Pre-Created Files

If you don't want to run the project from scratch, and instead want to use the
file combinations that have already been generated to create your benchmark tables, 
then you can skip several steps. 

Still go through step 1 to select file parameters, and still run step 2 to create
a results table in your own project. 

Steps 3, 4, and 5 can all be skipped. 

Finally, create the benchmark tables and save the results in your own project by running the 
following command:
```
python bq_file_load_benchmark.py \
--create_benchmark_tables \
--bq_project_id=<ID of your own project holding the BigQuery resources> \
--gcs_project_id='data-analtyics-pocs' \
--staging_project_id='data-analytics-pocs' \
--staging_dataset_id='bq_loader_benchmark_staging' \
--benchmark_dataset_id=<ID of your dataset that will hold benchmark tables> \
--bucket_name='annarudy-bqloader-testfiles' \
--results_table_name=<Name of your results table> \
--results_dataset_id=<Name of the dataset that holds your results table> \
--bq_logs_dataset=<Dataset that holds the table storing logs for BQ jobs>
--duplicate_benchmark_tables

```

This will allow you to use the files that have already been created  in the bucket 
annarudy-bqloader-testfiles of the project data-analytics-pocs. 

## Testing

Tests can be run by running the following command in the bq_file_load_benchmark 
directory:

```
python -m pytest --project_id=<ID of project that will hold test resources>

```

Note that the tests will create and destroy resources in the project denoted
by `--project_id`. 
