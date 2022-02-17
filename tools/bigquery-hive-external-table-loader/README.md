# BigQuery Hive External Table Loader

The BigQuery Hive External Table Loader is a command-line utility that launches a Spark Job to load data from ORC or Parquet Hive External Tables into BigQuery.
The utility queries Hive Metastore to retrieve partition information and generates SQL to set partition values not stored in the ORC file.
It manages creation of intermediate BigQuery Federated Formats External Tables and submits a query to select from the external table into a native BigQuery table.


## Problems Solved by BigQuery Hive External Table Loader

### ORC Positional Column Name

Previous versions of Hive write ORC files with positional column names '_0', '_1', ... with true column names stored in the MetaStore. Because BigQuery uses the ORC metadata only, tables imported from ORC files with these names have incorrect column names. Changing the column names after load requires selecting into a new table. It's also not possible to load these ORC files into an existing table because BigQuery is not able to associate the source and destination columns by name.


### Partition Values in Hive MetaStore Only

BigQuery supports reading partition values from file path, but some Hive tables are written with partition values that exist only in the MetaStore. For example, for a partitions registered using `ALTER TABLE table ADD PARTITION (dt='2019-06-03', country='us') LOCATION 'gs://bucket/dt=2019-06-03/data.orc'`, the country is not represented in the file path and would not be loaded by BigQuery. This utility queries the Hive MetaStore to obtain partition information and adds the partition column values to BigQuery by selecting a constant literal value in a SQL query along with the columns found in the ORC file. The unique SQL required for each partition means that each Hive partition with distinct partition values must be loaded in a separate BigQuery Job.


### A BigQuery Partition may be composed from Multiple Hive Partitions

BigQuery tables are typically partitioned by date only, while Hive tables may be partitioned by multiple columns. When each Hive partition is loaded in a separate job, care must be taken to achieve an atomic load operation into the destination table. An atomic load is necessary to prevent users from submitting queries against an incomplete partition. This utility appends the hive partitions into a temporary table and only overwrites the target partition once the temporary table is fully populated.


## How it works

1. User specifies source Hive partitions and destination BigQuery partition
2. The utility queries Hive MetaStore to obtain schema and partition locations

(Repeat steps 3-5 for each Hive partition)
3. A BigQuery external table is created from locations found in step 2
4. SQL is generated to rename columns and select partition values as constants
5. A Query Job is submitted to execute the generated SQL, read from the ORC file and write to a BigQuery table

6. For a Partition Refresh, step 4 appends to a temporary table. After all partitions are loaded into the temporary table, a Query Job selects from the temporary table and overwrites the target partition.



## Prerequisites

* BigQuery Dataset for permanent tables
* Service Account credentials file
* BigQuery Dataset for temporary tables (for partition refresh)



## Building

Use `sbt assembly` to build a jar that includes the utility and all dependencies other than Spark. The assembly jar is meant to be submitted as an Apache Spark application.


## Usage


### Submitting as a Spark Job

```sh
spark-submit \
    --master yarn \
    --deploy-mode cluster \
    --num-executors 1 \
    --executor-memory 2g \
    --driver-memory 2g \
    --conf spark.yarn.maxAppAttempts=1 \
    --conf spark.yarn.stagingDir=hdfs://${NAMENODE}/tmp/${LOGNAME} \
    --conf spark.yarn.dist.files=path/to/user.keytab,path/to/jaas.conf \
    --conf "spark.driver.extraJavaOptions=-djava.security.auth.login.config=jaas.conf -Djavax.security.auth.useSubjectCredsOnly=false" \
    --conf "spark.executor.extraJavaOptions=-Djava.security.auth.login.config=jaas.conf -Djavax.security.auth.useSubjectCredsOnly=false" \
    --jars=bqhiveloader.jar \
    --class com.google.cloud.bqhiveloader.BQHiveLoader \
    bqhiveloader.jar \
    --partitionRefresh ${PART_ID} \
    --partitionColumn ${PART_COL} \
    --clusterCols None \
    --partFilters "${PART_FILTER}" \
    --hiveDbName ${HIVE_DB} \
    --hiveTableName ${HIVE_DB}.${HIVE_TABLE} \
    --bqProject ${PROJECT} \
    --bqDataset ${DEST_DATASET} \
    --bqTable ${DEST_TABLE} \
    --hiveMetastoreType sql
```

### Partition Column

Column to be used as BigQuery partition column.

Specified by `--partitionColumn` command-line argument.

If the Hive column is not a string with format `YYYY-MM-DD`, a partition format must also be specified to indicate to the utility how to convert the column to a date.


### Partition Column Formats

Format strings to be used to parse Hive partition column values as date.

Provided by `--partColFormats` command-line argument followed by comma separated key/value pairs. Quoting is recommended but not required.

Example:

`--partColFormats 'date=%Y-%m-%d,month=YYYYMM'`

This is necessary if the target BigQuery table has partition columns defined as DATE type but the columns in Hive are defined as INTEGER or STRING. The format strings provided by this argument are used to parse the Hive partition value as DATE.

Supported formats:

* `%Y-%m-%d` - default date format
* `YYYYMM` - month of year (01-12)
* `YYYYWW` - week of year (01-53) Sunday as first day
* `%Y%U` - week of year (00-53) Sunday as first day
* `%Y%V` - week of year (01-53) Monday as first day; If the week containing January 1 has four or more days in the new year, then it is week 1; otherwise it is week 53 of the previous year, and the next week is week 1.
* `%Y%W` - week of year (01-53) Monday as first day
* `YRWK` - week of year (01-53) January 1 as start of Week 1

For additional information see [BigQuery DATE Format Elements](https://cloud.google.com/bigquery/docs/reference/standard-sql/date_functions#supported-format-elements-for-date)


## Cluster Columns

Columns to be used as BigQuery clustering columns.

Provided by `--clusterCols` command line argument as a comma-separated list of column names.

Example:

`--clusterCols categoryId,itemId` will create a BigQuery table with `categoryId` and `itemId` set as the clustering columns. Queries with `categoryId` in the where clause will scan significantly less data than if clustering was not enabled.

For dimension tables, it is often useful to enable clustering without date partitioning even though BigQuery does not allow use of clustering if a partition column is not set. This can be achieved by adding a partition column that is not actually used in queries.

When partition column is not specified, this utility creates an `unused` column as partition column with all values set to `NULL`.

Creation of the unused partition column can be disabled by passing `--clusterCols None` to indicate that clustering should not be configured on the destination table.


### Partition Filter

Filter expression used to select Hive partitions to be loaded.

Provided by `--partFilters` command line argument as a SQL-like string similar to a `WHERE` clause. Note: `BETWEEN` is not supported. Quoting is necessary if the filter expression contains spaces or special characters.

Examples:

`--partFilters 'date > 2019-04-18 AND region IN (US,EU) AND part = *'` selects partitions with `date` of April 19 or later with `region` 'US' or 'EU' and any `part`

`--partFilters 'date >= 2019-04-18 AND date < 2019-06-03'` selects partitions with `date` of April 18 to June 2

`--partFilters '*'` matches all partitions


### Partition Refresh

Partition ID used to specify destination partition to be overwritten with data from the selected Hive partitions.

Specified by `--refreshPartition` command-line argument followed by BigQuery partition ID with format `YYYYMMDD`.

Partition Refresh is a mode of operation that overwrites the specified partition ID of the destination BigQuery table. The Query Job that selects from the temporary table sets `project.dataset.table$YYYYMMDD` as the destination table with the Write Disposition set to `TRUNCATE` to indicate that the partition will be overwritten.

If data from outside the specified date is included from the source Hive table, the job will fail.

Users must verify that the provided partition filters select all Hive partitions intended to be included in the specified BigQuery partition.

## Integer Range Partitioning

To create a destination table with Integer Range Partitioning, add the following command line options: (modify to fit your actual start and end ranges)

```
--partitionRangeStart=199901
--partitionRangeEnd=210001
--partitionRangeInterval=10
--partitionType=RANGE
```

This will create destination tables with the specified range partitioning.

Providing range partitioning here saves users the trouble of writing the `bq mk` command because this utility obtains the table definition from Hive metastore.

### Drop, Keep or Rename Columns

The `--drop` `--keep` and `--rename` options enable modification of the columns included in the table to be loaded.

#### Drop Columns

Drop is to exclude a limited number of columns from the destination BigQuery table.

Example:

`--drop col1,col2`

#### Keep Columns

Keep is used to whitelist a limited number of columns to be included in the destination BigQuery table. Any columns not included in the list will not be loaded.

Example:

`--keep col1,col2`


#### Rename Columns

Rename modifies the name of the column in the Destination BigQuery table. If the loader utility creates the destination table, the table will have the new name. If the destination table already exists, the rename feature enables loading from a source table with different column names.

Example:

`--rename oldname1=newname1,oldname2,newname2`



### Help Text

```
BQHiveLoader google-pso-tool/bq-hive-external-table-loader/1.0
Usage: BQHiveLoader [options]

BigQuery Hive Loader is a command-line utility for loading Hive partitions into BigQuery

  --partitioned <value>    (optional) flag indicating that table is not partitioned (default: true)
  --partFilters <value>    (optional) Partition filter expression. Example: 'date > 2019-04-18 AND region IN (A,B,C) AND part = *'
  --partitionColumn <value>
                           (optional) Partition column name (default: None)
  --partitionType <value>  (optional) Partition type [DAY|RANGE] (default: DAY)
  --partitionRangeStart <value>
                           (optional) Range Partition start value
  --partitionRangeEnd <value>
                           (optional) Range Partition end value
  --partitionRangeInterval <value>
                           (optional) Range Partition interval value
  --refreshPartition <value>
                           BigQuery partition ID to refresh, formatted YYYYMMDD (default: None)
  --tempDataset <value>    Temporary BigQuery Dataset name where Hive partitions will be stored prior to select into the refresh partition (required if refreshPartition is set)
  --clusterCols <value>    (optional) Cluster columns if creating BigQuery table (default: None)
  --drop <value>           (optional) Comma-separated list of columns to be ignored (default: None)
  --keep <value>           (optional) Comma-separated list of columns to be loaded; all others will be ignored (default: None)
  --rename <value>         (optional) Column rename rules. Provided as comma separated key/value pairs oldname=newName. Example: 'dt=date,mth=month' (default: None)
  --partColFormats <value>
                           (optional) Partition Column format to be used to parse INTEGER or STRING type partition column as DATE. Provided as comma separated key/value pairs col=fmt. Example: 'date=%Y-%m-%d,month=YYYYMM' (default: None)
  --hiveJdbcUrl <value>    Hive JDBC connection string (required)
  --hiveDbName <value>     Hive database name containing partitions to be loaded (required)
  --hiveTableName <value>  Hive table name containing partitions to be loaded (required)
  --hiveMetastoreType <value>
                           (optional) Hive Metastore type (default: jdbc)
  --hiveStorageFormat <value>
                           (optional) Hive storage format (default: orc)
  --bqProject <value>      BigQuery destination project (required)
  --bqDataset <value>      BigQuery destination dataset (required)
  --bqTable <value>        BigQuery destination table (required)
  --bqKeyFile <value>      (optional) BigQuery keyfile path for all BigQuery operations. Ignored if bqCreateTableKeyFile and bqWriteKeyFile are provided
  --bqCreateTableKeyFile <value>
                           BigQuery keyfile path for external table creation. (required if bqKeyFile not set)
  --bqWriteKeyFile <value>
                           BigQuery keyfile path for write to destination table. (required if bqKeyFile not set)
  --bqLocation <value>     (optional) BigQuery Location (default: US)
  --bqOverwrite <value>    (optional) BigQuery overwrite flag. Ignored if refreshPartition is set. WARNING: ALL data in the table will be deleted. (default: false)
  --bqBatch <value>        (optional) BigQuery batch mode flag. Enable to allow BigQuery to manage Job concurrency level. Disable to cause jobs to be run immediately. (default: true)
  --gcsKeyFile <value>     GCS keyfile path for object listing (required)
  --krbKeyTab <value>      (optional) Kerberos keytab location (path/to/krb5.keytab)
  --krbPrincipal <value>   (optional) Kerberos principal (user@realm or service/host@realm)
  --dryRun <value>         (optional) When specified, requests are logged and not submitted to BigQuery (default: false)
  --useTempTable <value>   (optional) When specified, generated SQL greater than 1MB will fallback to using a temp table and separate job for each partition (default: false)
  --useTempViews <value>   (optional) When specified, generated SQL greater than 1MB will fallback to defining multiple temporary views but still attempt to load without a temp table in a single Query Job that selects from the views (default: false)
  --help                   prints this usage text
```


## Notes

### Temporary Dataset

A separate Dataset is strongly recommended for temporary tables because temporary tables are not meant to be queried by users.

Because permissions are applied at the dataset level, using the dataset where the target table is stored would cause temporary tables to be visible to end-users. This will make it more difficult to locate the production tables as temporary tables may greatly outnumber

Temporary tables are created with an expiration 6 hours from the time of creation.


### Permanent External Tables

To select from from a Hive partition stored as ORC files, this utility creates a Permanent External Table with an expiration 6 hours from time of creation. The utility will not deletes table after a load is completed. BigQuery should automatically remove the tables after the expiration time is reached.



## Documentation References

* https://cloud.google.com/bigquery/external-data-sources
* https://cloud.google.com/bigquery/external-data-cloud-storage
* https://cloud.google.com/bigquery/external-table-definition


## Disclaimer

This is not an official Google project.

