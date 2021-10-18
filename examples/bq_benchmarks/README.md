# BigQuery Benchmark Repos
Customers new to BigQuery often have questions on how to best utilize the platform with regards to performance.
For example, a common question which has routinely resurfaced in this area is the performance of file loads
into BigQuery, specifically the optimal file parameters (file type, # columns, column types, file size, etc)
for efficient load times.  As a second example, when informing customers that queries run on external data
sources are less efficient than those run on BigQuery managed tables, customers have followed up, asking
exactly how much less efficient queries on external sources are.

While Google provides some high-level guidelines on BigQuery performance in these
scenarios, we don’t provide consistent metrics on how the above factors can impact
performance. This repository seeks to create benchmarks to address questions with
quantitative data and a higher level of confidence, allowing more definitive answers
when interacting with customers.

While this repository is intended to continue growing, it currently includes the following
benchmarks:
### File Loader Benchmark
The File Loader benchmark measures the affect of file properties on performance when loading
files into BigQuery tables. Files are created using a combination of properties such as file type, compression type,
number of columns, column types (such as 100% STRING vs 50% STRING/ 50% NUMERIC), number of files,
and the size of files. Once the files are created, they are loaded into BigQuery tables.

#### Benchmark Parameters
Specific file parameters are used in this project for performance testing. While
the list of parameters is growing, the current list of parameters and values
is as follows:

**File Type**:

* Avro
* CSV
* JSON
* Parquet

**Compression**:

* gzip (for CSV and JSON)
* snappy (for AVRO)

**Number of columns**:
* 10
* 100
* 1000

**Column Types**:
* String-only
* 50% String / 50% NUMERIC
* 10% String / 90% NUMERIC

**Number of files**:
* 1
* 100
* 1000
* 10000

**Target Data Size (Size of the BigQuery staging table used to generate each file)**:
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

### Federated Query Benchmark
The federated query benchmark quantifies the difference in performance between
queries on federated (external) and managed BigQuery tables. A variety of queries
ranging in complexity will be created. These queries will be run on managed BigQuery
tables and federated Google Cloud Storage files (including AVRO, CSV, JSON, and PARQUET) of
identical schemas and sizes. The files created for the File Loader Benchmark will be reused
here to run external queries on and to create BQ Managed tables with.

#### Benchmark Parameters
Parameters for this benchmark will include the type of table, type of query,
and the table properties.

**Table Type**:

* `BQ_MANAGED`: Tables located within and managed by BigQuery.
* `EXTERNAL`: Data located in GCS files, which are used to create a temporary
external table for querying.


**Query Type**:
* `SIMPLE_SELECT_*`: Select all columns and all rows.
* `SELECT_ONE_STRING`: Select the first string field in the schema. All schemas used in the
benchmark contain at least one string field.
* `SELECT_50_PERCENT`: Select the first 50% of the table's fields.

Future iterations of this benchmark will include more complex queries, such as those
that utilize joins, subqueries, window functions, etc.

Since the files created for the File Loader Benchmark will be reused for this
benchmark, both the BQ Managed tables and GCS files will share the File Loader Benchmark
parameters, with the only difference being that the snappy compression type is not
supported for federated queries and therefore will not be included for comparison.

**File Type**:

* Avro
* CSV
* JSON
* Parquet

**Compression**:

* gzip (for CSV and JSON)

**Number of columns**:
* 10
* 100
* 1000

**Column Types**:
* String-only
* 50% String / 50% NUMERIC
* 10% String / 90% NUMERIC

**Number of files**:
* 1
* 100
* 1000
* 10000

**Target Data Size (Size of the BigQuery staging table used to generate each file)**:
* 10MB
* 100MB
* 1GB
* 2GB


## Benchmark Results

#### BigQuery

The results of the benchmarks will be saved in a separate BigQuery table for
ad hoc analysis. The results table will use the following schema: [results_table_schema.json](json_schemas/results_table_schema.json)

#### DataStudio
Once the results table is populated with data, DataStudio can be used to visualize results.
See [this article](https://support.google.com/datastudio/answer/6283323?hl=en) to get started
with DataStudio.

## Usage
This project contains the tools to create the resources needed to run the benchmarks.
The main method for the project is located in
[`bq_benchmark.py`](bq_benchmark.py).

### Prepping the Benchmarks Resources from Scratch
The following steps are needed to create the resources needed for the benchmarks.
Some steps will only be needed for certain benchmarks, so feel free to skip them if you
are only focused on a certain set of benchmarks.

#### 1. Create the Results Table (Needed for all benchmarks)

If running the whole project from scratch, the first step is to create a table
in BigQuery to store the results of the benchmark loads. A json file has been
provided in the json_schemas directory ([results_table_schema.json](json_schemas/results_table_schema.json))
with the  above schema. The schema can be used to create the results
table by running the using the following command:
```
python bq_benchmark.py \
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

#### 2. Select File Parameters (Needed for File Loader and Federated Query Benchmarks)
File parameters are used to help create the files needed for both the File Loader Benchmark and
 the Federated Query Benchmark. They can be configured in the `FILE_PARAMETERS` dictionary in
[`generic_benchmark_tools/file_parameters.py`](generic_benchmark_tools/file_parameters.py). Currently,
no file parameters can be added to the dictionary, as this will cause errors.
However, parameters can be removed
from the dictionary if you are looking for a smaller set of file combinations.
Note that the parameter `numFiles` has to include at least the number 1 to
ensure that the subsequent number of files are properly created. This is
because the program uses this first file to make copies to create subsequent
files. This is a much faster alternative than recreating identical files.
For example, if you don't want the 1000 or 10000 as `numFile` parameters,
you can take them out, but you must leave 1 (e.g. [1, 100]). That way the first
file can be copied to create the 100 files.



#### 3. Create Schemas for the Benchmark Staging Tables (Needed for File Loader and Federated Query Benchmarks)
In order to create the files with the above parameters, the [Dataflow Data Generator
tool](https://github.com/GoogleCloudPlatform/professional-services/tree/master/examples/dataflow-data-generator)
from the Professional Services Examples library needs to be leveraged to create
staging tables containing combinations of `columnTypes` and `numColumns` from the
list of file parameters in [`generic_benchmark_tools/file_parameters.py`](generic_benchmark_tools/file_parameters.py). The staging tables
will later be resized to match the sizes in `targetDataSize` file parameter, and then
they will be extracted to files in GCS. However, before any of this can be done, JSON schemas for
the staging tables must be created. To do this run the following command:

```
python bq_benchmark.py \
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

#### 4. Create Staging Tables (Needed for File Loader and Federated Query Benchmarks)
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
python bq_benchmark.py \
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
`json_schemas/benchmark_table_schemas`. If your schemas are elsewhere, provide
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

#### 5. Create Files (Needed for File Loader and Federated Query Benchmarks)
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
python bq_benchmark.py \
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

### Running the benchmarks

#### File Loader Benchmark
Once the files are created, the File Loader Benchmark can be run. As a prerequisite for this step, a log sink in BigQuery that captures logs
about BigQuery must be set up in the same project that holds the benchmark
tables. If a BigQuery log sink is not already set up, follow [these steps](https://github.com/GoogleCloudPlatform/professional-services/tree/master/examples/bigquery-audit-log#1-getting-the-bigquery-log-data).

Note that this benchmark will delete tables after recording information on load time. Before the
tables are deleted, the tables and their respective files can be used to run the Federated Query Benchmark. If
running the two benchmarks independently, each file will be used to create a BigQuery table two different times. Running the two benchmarks
at the same time can save time if results for both benchmarks are desired. In this case, the `--include_federated_query_benchmark` flag can
be added to the below command. Be aware that running the queries will add significant time to the benchmark run, so leave the
flag out of the command if the primary goal is to obtain results for the File Loader Benchmark.


To run the benchmark, use the following command:


```
python bq_benchmark.py \
--run_file_loader_benchmark \
--bq_project_id=<ID of the project holding the BigQuery resources> \
--gcs_project_id=<ID of project holding GCS resources> \
--staging_project_id=<ID of project holding staging tables> \
--staging_dataset_id=<ID of dataset holding staging tables> \
--benchmark_dataset_id=<ID of the dataset holding the benchmark tables> \
--bucket_name=<name of bucket to hold files> \
--results_table_name=<Name of results table> \
--results_dataset_id=<Name dataset holding results table> \
--duplicate_benchmark_tables \
--bq_logs_dataset=<Name of dataset hold BQ logs table>
--include_federated_query_benchmark

```

Parameters:
`--run_file_loader_benchmark`: Flag to initiate process of running the File Loader Benchmark by creating tables from files and storing results for comparison.
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

`--include_federated_query_benchmark`: Flag to indicate that the Federated Query Benchmark should
be run on the created tables and the files the tables were loaded from before
the tables are deleted. If results for both benchmarks are desired, this will save time
when compared to running each benchmark independently, since the same tables needed for the
File Loader Benchmark are needed for the Federated Query Benchmark. It has a value of `store_true`,
so this flag will be set to False, unless it is provided in the
command.


#### Federated Query Benchmark
Once the files are created, the Federated Query Benchmark can be run. As a prerequisite for this step, a log sink in BigQuery that captures logs
about BigQuery must be set up in the same project that holds the benchmark
tables. If a BigQuery log sink is not already set up, follow [these steps](https://github.com/GoogleCloudPlatform/professional-services/tree/master/examples/bigquery-audit-log#1-getting-the-bigquery-log-data).

As mentioned above, the Federated Query Benchmark can be run while running the File Loader Benchmark in addition to using
the command below. Note, though , that running federated queries on
snappy compressed files is not supported. When the File Loader Benchmark encounters a snappy compressed file, it still
loads the file into a BigQuery table to capture load results, but it will skip the Federated Query portion. When the Federated
Query Benchmark encounters a snappy compressed file, it will skip the load all together. Therefore, if obtaining Federated
Query Benchmark results is the primary goal, use the command below.

It should also be noted that since the Federated Query Benchmark loads files into tables, the load results for the File
Loader Benchmark will also be captured. This will not add significant time to the benchmark run since the tables have to
be loaded regardless.

To run the benchmark, use the following command:

```
python bq_benchmark.py \
--run_federated_query_benchmark \
--bq_project_id=<ID of the project holding the BigQuery resources> \
--gcs_project_id=<ID of project holding GCS resources> \
--staging_project_id=<ID of project holding staging tables> \
--staging_dataset_id=<ID of dataset holding staging tables> \
--benchmark_dataset_id=<ID of the dataset holding the benchmark tables> \
--bucket_name=<name of bucket to hold files> \
--results_table_name=<Name of results table> \
--results_dataset_id=<Name dataset holding results table> \
--bq_logs_dataset=<Name of dataset hold BQ logs table>

```

Parameters:
`--run_federated_query_benchmark`: Flag to initiate the process running the Federated Query
Benchmark by creating tables from files, running queries on both
the table and the files, and storing performance results.
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

`--bq_logs_dataset`: Name of dataset hold BQ logs table. This dataset must be
in project used for `--bq_project_id`.


## Testing

Tests can be run by running the following command in the bq_file_load_benchmark
directory:

```
python -m pytest --project_id=<ID of project that will hold test resources>

```

Note that the tests will create and destroy resources in the project denoted
by `--project_id`.
