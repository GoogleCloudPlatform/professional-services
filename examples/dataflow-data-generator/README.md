# Data Generator for Demos
This example shows a pipeline used to generate data in GCS for demos. 
The intention is for this pipeline to be a tool for partners, customers and SCEs who want to create a dummy dataset that 
looks like the schema of their actual data in order to run some queries in BigQuery to see how much data is scanned for 
cost estimates. This can be used in scenarios where there are hurdles to get over in migrating actual data to BigQuery 
to unblock integration tests and downstream development.

This pipeline has 3 steps: 
1. Write an n-line temporary file to GCS.
2. Generate a single record per line read from the GCS temporary file.
3. Write the generated data to GCS.

### Write an n-line file to GCS
This is just a very simple bit of python code to initiate a Google Cloud Stroage Client which we use to create a Bucket
and Blob object in turn. We then use the `Blob.upload_from_string` to write a file from `num_records` newline characters.

### Generate a single record per line read form GCS
In this step we use the `beam.ParDo` method to call a super class `FakeRowGen` which extends the `beam.DoFn` class. We 
define this class to create a python dictionary representing a single record that matches the provided schema. This 
process involves a combination of using the python module `faker-schema` as well as some custom logic to control key fields.
Numeric fields in these records will trend positively based on their date and where that falls on the range of minimum and 
maximum dates.

### Write the data to BigQuery
The final step, naturally, is to write the generated data into a BigQuery Table using the built in 
`beam.io.gcp.bigquery.WriteToBigQuery` method.

### Usage
This tool has several parameters to specify what kind of data you would like to generate.

#### Schema 
The schema may be specified using the `--schema_file` parameter  with a file containing a 
list of json objects with `name`,  `type`, and `mode` fields. This form follows the output of
`bq show --format=json --schema <table_reference>`. 
ie. 
```
--schema_file=gs://python-dataflow-examples/schemas/lineorder-schema.json
```
lineorder-schema.json:
```
[
    {"name": "lo_order_key",
     "type": "STRING",
     "mode": "REQUIRED"
    },
    {"name": "lo_linenumber",
     "type": "INTEGER",
     "mode": "NULLABLE"
    },
    {...}
]
```
Alternatively, the schema may be specified with a reference to an existing BigQuery table with the
`--input_bq_table` parameter. We suggest using the BigQuery UI to create an empty BigQuery table to 
avoid typos when writing your own schema json.

```
--input_bq_table=BigQueryFaker.lineorders
```

#### Number of records
To specify the number of records to generate use the `--num_records` parameter. Note we recommend only calling this
pipeline for a maximum of 50 Million records at a time. For generating larger tables you can simply call the pipeline
script several times.

```
--num_records=1000000
```

#### Output Prefix
The output is specified as a GCS prefix. Note that multiple files will be written with 
`<prefix>-<this-shard-number>-of-<total-shards>.<suffix>`. The suffix will be the appropriate suffix for the file type
based on if you pass the `--csv_schema_order` or `--avro_schema_file` parameters described later.

```
--output_prefix
```

### Output format 
Output format is specified by passing one of the `--csv_schema_order` or `--avro_schema_file` parameters.

`--csv_schema_order` should be a comma separated list specifying the order of the fieldnames for writing. 

```
--csv_schema_order=lo_order_key,lo_linenumber,...
```

`--avro_schema_file` should be a file path to the avro schema to write.

```
--avro_schema_file=/path/to/linorders.avsc
```

Alternatively, you can write directly to a BigQuery table by specifying an `--output_table`. However, if you are generating 
more than 100K records, you may run into the limitation of the python SDK where WriteToBigQuery does not orchestrate multiple
load jobs you hit one of the single load job limitations [BEAM-2801](https://issues.apache.org/jira/browse/BEAM-2801). If you 
are not concerned with having many duplicates, you can generate an initial BigQuery table with `--num_records=10000000` and 
then use [`bq_table_resizer.py`](bigquery-scripts/bq_table_resizer.py) to copy the table into itself until it reaches the 
desired size.

```
--output_table=project:dataset.table
```

#### Sparsity (optional)
Data is seldom full for every record so you can specify the probability of a NULLABLE column being null with the `--p_null` parameter.

```
--p_null=0.2
```


#### Keys and IDs (optional)
The data generator will parse your field names and generate keys/ids for fields whose name contains "_key" or "_id". 
The cardinality of such key columns can be controlled with the `--n_keys` parameter. 

##### Primary Key (optional)
The data generator can support a primary key columns by passing a comma separated list of field names to `--primary_key_cols`. 
Note this is done by a deduplication process at the end of the pipeline. This may be a bottleneck for large data volumes. 
Also, using this parameter might cause you to fall short of `--num_records` output records due to the deduplicaiton. 
To mitigate this you can set `--n_keys` to a number much larger than the number of records you are generating.

#### Date Parameters (optional)
To constrain the dates generated in date columns one can use the `--min_date` and `--max_date` parameters.
The minimum date will default to January 1, 2000 and the max_date will default to today.
If you are using these parameters be sure to use YYYY-MM-DD format.

```
--min_date=1970-01-01 \
--max_date=2010-01-01
```

#### Number Parameters (optional)
The range of integers and/or floats can be constrained with the `--max_int` and `--max_float` parameters.
These default to 100 Million. 
The number of decimal places in a float can be controlled with the `--float_precision` parameter.
The default float precision is 2.
Both integers and floats can be constrained to strictly positive values using
the `--strictly_pos=True`.
True is the default.

#### Write Disposition (optional)
The BigQuery write disposition can be specified using the `--write_disp` parameter.
The default is WRITE_APPEND.

#### Dataflow Pipeline parameters
For basic usage we recommend the following parameters:
```
python data_generator_pipeline.py \
--project=<PROJECT ID> \
--setup_file=./setup.py \
--worker_machine_type=n1-highcpu-8 \ # This is a high cpu process so tuning the machine type will boost performance 
--runner=DataflowRunner \ # run on Dataflow workers
--staging_location=gs://<BUCKET NAME>/test \
--temp_location=gs://<BUCKET NAME>/temp \
--save_main_session \ # serializes main session and sends to each worker
```
For isolating your Dataflow workers on a private network you can additionally specify:
```
...
--use_public_ips=false \
--region=us-east1 \
--subnetwork=<FULL PATH TO SUBNET> \
--network=<NETWORK ID>
```

### Modifying FakeRowGen
You may want to change the `FakeRowGen` DoFn class to more accurately spoof your data. You can use `special_map` to map
substrings in field names to [Faker Providers](https://faker.readthedocs.io/en/latest/providers.html). The only
requirement for this DoFn is for it to return a list containing a single python dictionary mapping field names to values. 
So hack away if you need something more specific any python code is fair game. Keep in mind 
that if you use a non-standard module (available in PyPI) you will need to make sure it gets installed on each of the workers or you will get 
namespace issues. This can be done most simply by adding the module to `requirements.txt`. 

## BigQuery Scripts

Included are two BigQuery utility scripts to help you with your data generating needs. The first helps with loading many gcs files to BigQuery
while staying under the 15TB per load job limit. 

### BigQuery batch loads
This script is meant to orchestrate BigQuery load jobs of many
json files on Google Cloud Storage. It ensures that each load 
stays under the 15 TB per load job limit. It operates on the 
output of gsutil -l.

This script can be called with the following arguments:

`--project`: GCP project ID

`--dataset`: BigQuery datset ID containing the table your wish 
    to populate.

`--table`: BigQuery table ID of the table you wish to populate

`--source_file`: This is the output of gsutil -l with the URI of
    each file that you would like to load

`--create_table`: Boolean specifying if this script should create 
    the destination table.

`--schema_file`: Path to a json file defining the destination BigQuery
    table schema.

`--partitioning_column`: name of the field for date partitioning.

`--max_bad_records`: Number of permissible bad records per load job.


####Example Usage: 
```
gsutil -l gs://<bucket>/path/to/json/<file prefix>-*.json >> ./files_to_load.txt

python file_15TB_batcher.py --project=<project> \
--dataset=<dataset_id> \
--table=<table_id> \
--source_file=files_to_load.txt
```

### BigQuery table resizer
This script is to help increase the size of a table based on a generated or sample.
If you are short on time and have a requirement to generate a 100TB table you can 
use this script to generate a few GB and copy table into itself until it it is the
desired size or number of rows. While this would be inapropriate for accurate
performance benchmarking it can be used to get a query specific cost estimate.
This script can be used to copy a table in place or create a new table if you 
want to maintain the record of the original records. You can specify the target 
table suze in either number of rows or GB.

#### Example Usage

```
python bq_table_resizer.py \
--project my-project-id \
--source_dataset my-dataset-id \
--source_table my-source-table-id \
--destination_dataset my-dataset-id \
--destination_table my-new-table-id \
--target_gb 15000 \
--location US
```
