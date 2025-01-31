# Snowflake to BigQuery
This project describes the steps to perform migration of data from Snowflake to BiqQuery.

## Create GCS Bucket

Create a GCS bucket that will be used to unload data from Snowflake. For example, create a gcs bucket named “from-sf” and create a folder named “sf-data” in that bucket.


## Create Snowflake Integration

Integrations are named, first-class Snowflake objects that avoid the need for passing explicit cloud provider credentials such as secret keys or access tokens; instead, integration objects reference a Cloud Storage service account.

```
USE ROLE ACCOUNTADMIN;

CREATE STORAGE INTEGRATION gcs_int
  TYPE = EXTERNAL_STAGE
  STORAGE_PROVIDER = GCS
  ENABLED = TRUE
  STORAGE_ALLOWED_LOCATIONS = ('gcs://from-sf/sf-data/');
```


### Obtain GCP Service Account

A GCP Service account is created by Snowflake as part of creating a STORAGE INTEGRATION object for GCS.

DESCRIBE INTEGRATION gcs_int

In the output of the above command, the STORAGE_GCP_SERVICE_ACCOUNT property contains the GCP service account name.

### Create GCP Service Account

Create a Service Account in GCP by pasting the value of the STORAGE_GCP_SERVICE_ACCOUNT property into the “Service account name” as shown below



### Grant Permission to Service Account

In GCP, edit the bucket permissions of the GCS bucket to add the above Service Account as a member and grant the Storage Object Admin Role.



## Create File Formats

A parquet file format can be created in Snowflake as follows to unload snowflake data in the parquet format.

```
USE DB_NAME;
USE SCHEMA_NAME;
CREATE
OR REPLACE FILE FORMAT parquet_unload_file_format
TYPE = PARQUET
SNAPPY_COMPRESSION = TRUE
COMMENT = 'FILE FORMAT FOR UNLOADING AS PARQUET FILES';
```

## Create External Stages

In Snowflake, an EXTERNAL STAGE object references data files stored in a location outside of Snowflake.

```
USE DB_NAME;
USE SCHEMA SCHEMA_NAME;
CREATE OR REPLACE STAGE parquet_unload_gcs_stage
URL = 'gcs://from-sf/sf-data/'
storage_integration  = gcs_int
FILE_FORMAT = parquet_unload_file_format
COMMENT = 'GCS Stage for the Snowflake external Parquet export';
```

## Unload Snowflake Data

From Snowflake, use the COPY command in Snowflake to unload data from a Snowflake, table into a GCS bucket

/*
To retain the column names in the output file, use the HEADER = TRUE copy option.
*/

```
copy into @<EXTERNAL_STAGE_NAME>/<file_name_prefix>
from DB_NAME.SCHEMA_NAME.TABLE_NAME
HEADER = TRUE;
```

For example,
```
copy into @parquet_unload_gcs_stage/region
from SF01.TEST01.REGION
HEADER=TRUE;
```

At this point, the data will be unloaded as parquet files gs://from-sf/sf-data/region*

## Load data into BigQuery

Use “bq load” to load the parquet files into BigQuery

`bq load --location=US --source_format=PARQUET <gcp-project-id>:<dataset_name>.region gs://from-sf/sf-data/region*`


## Installing Command Line Client SnowSQL

On Mac,
```brew cask install snowflake-snowsql```

Snowsql is installed at
/Applications/SnowSQL.app/Contents/MacOS/snowsql

Snowsql gets added to the PATH. Open a new shell terminal or source the ~/.bash_profile to use the updated PATH.

```source ~/.bash_profile```

Then snowsql can be run from the command line as

```snowsql ```

without providing the full path.

## Migration Script
The `snowflake-bq.sh` script uses the Snowflake `snowsql` command line tool and the BigQuery `bq load` command line tool to migrate snowflake tables from Snowflake to BigQuery.

### Snowflake Config File
A config file is used by snowsql to obtain connection parameters for Snowflake. A sample snowflake config file `sf_config.txt` has been provided in this project. A named connection is defined by the config file as follows.

```
[connections.<snowflake-connection-name>]

accountname=<snowflake-account-name>
username=<snowflake-user-id>
password=<snowflake-password>
dbname=<snowflake-db>
schemaname=<snowflake-schema>
warehousename=<snowflake-warehouse>
rolename=<snowflake-role>
```
The Snowflake Role should have the appropriate privileges on the various Snowflake Objects. For example, a Role can be created in Snowflake as follows

```
CREATE ROLE <SF_ROLE>;
GRANT USAGE ON  FILE FORMAT <SF_PARQUET_FILE_FORMAT>  TO <SF_ROLE>;
GRANT USAGE ON  STAGE <SF_PARQUET_STAGE> TO <SF_ROLE>;
GRANT USAGE ON DATABASE <SF_DB> TO ROLE <SF_ROLE>;
GRANT USAGE ON SCHEMA <SF_SCHEMA> TO ROLE <SF_ROLE>;
GRANT SELECT ON ALL TABLES IN SCHEMA <SF_SCHEMA> TO ROLE <SF_ROLE>;
GRANT USAGE ON WAREHOUSE <SF_WAREHOUSE>  TO ROLE <SF_ROLE>;
GRANT ROLE <SF_ROLE> TO <SNOWFLAKE_USER>;
```

### Snowflake Tables List
A file with the list of tables to be migrated can be used to migrate a set of Snowflake tables. The following parameters are required for each Snowflake table.

SF_CONFIG = Snowflake Config File Full Path
SF_CONN = Snowflake Named Connection defined in the Config File
SF_DB = Snowflake Database
SF_SCHEMA = Snowflake Schema Name
SF_TABLE = Snowflake Table Name
SF_STAGE = Snowflake Stage Name
GCS_OUT_PATH = GCS path where data needs to be unloaded (should be one of the paths provided in the GCS Integration)
GCP_PROJECT = GCP Project ID
BQ_DATASET = BigQuery Dataset Name
BQ_TABLE = BigQuery Table Name

### Executing the script

The GCP Account used by the script should have the appropriate IAM Roles for GCS and BigQuery. The -P parameter determines the parallelism of the script.

For Example
`cat tables.list  | xargs -P 3 -L 1 ./snowflake-bq.sh`