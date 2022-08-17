# Google BigQuery z/OS Mainframe Connector (gszutil)
This utility provides gsutil and bq equivalent utilities for IBM mainframes running z/OS. These functionalitites are ideal for Data Warehouse migration to BigQuery.

gszutil runs using IBM's jzos Java SDK and provides a shell emulator that accepts gsutil and bq command-line invocations via JCL in-stream dataset. It attempts to accept arguments that appear similar to the official command-line utilties.

The utility is deployed as a cataloged procedure called by the [JCL EXEC statement](https://www.ibm.com/docs/en/zos/2.3.0?topic=jcl-exec-statement).

This utility provides important functionality beyond gsutil by accepting a schema from a user-provided Copy Book and using this transcode COBOL datasets directly to ORC before uploading to GCS. It also allows customers to execute BigQuery queries and loads from JCL.

The streaming transcode feature eliminates intermediate processing steps prior to load into BigQuery, and when used in conjunction with the bq query and load features, the utility allows mainframe users to convert their existing Teradata ETL flows in place without changing scheduling environments.

The Mainframe Connector consists of two main componets:

* mainframe-connector-util: It is added as a dependency to provide interfaces to commonly used services like Cloud Storage, BigQuery, and Cloud Logging. It also includes a custom SSLSocketFactory which forces use of TLS ciphers supported by IBM Hardware Crypto cards.

* gszutil: provides gsutil and bq equivalent utilities for IBM mainframes running z/OS.


## Usage
### Using BQSH from JCL

All usage is driven by JCL and divided into Job Steps. Input datasets are provided by a DD statement and commands are provided by STDIN stream input. STDIN is read from all lines between "//STDIN DD *" and "/*" in each step.

Users can execute multiple commands in a single step by entering commands on separate lines or delimited by semicolon.

Typically a JES job will contain multiple steps, each step executing the [BQSH procedure](./gszutil/proclib/BQSH) with one or more gsutil or bq commands.


### DD Names (Dataset Definition)

There are a fixed set of DD names that are expected by the utility. Whether each one is required or not depends on the command being called. All MVS Datasets referenced by a DD must used Fixed Block (FB) record format.

#### KEYFILE
MVS Dataset containing a Google Cloud IAM service account JSON keyfile.

#### INFILE
MVS Dataset containing COBOL dataset to be uploaded to Google Cloud Storage.

#### COPYBOOK
MVS Dataset containing a COBOL CopyBook for the dataset referenced by the INFILE DD.

#### STDIN
Stream input used to provide shell commands.

#### QUERY
MVS Dataset containing a BigQuery Standard SQL Query.


### Example JCL
This example has 3 steps:
* Upload COBOL dataset as ORC to a bucket
* Load ORC file to BigQuery table
* Query BigQuery table

```
//STEP01 EXEC BQSH
//INFILE DD DSN=<HLQ>.DATA.FILENAME,DISP=SHR
//COPYBOOK DD DISP=SHR,DSN=<HLQ>.COPYBOOK.FILENAME
//STDIN DD *
BUCKET=my-long-bucket-name-1234
gsutil cp --replace gs://$BUCKET/tablename.orc
/*
//COND02 IF (STEP01.RC = 0) THEN
//STEP02 EXEC BQSH
//STDIN DD *
PROJECT=my-long-project-name-1234
bq load --project_id=$PROJECT \
  myproject:DATASET.TABLE \
  gs://bucket/tablename.orc/*
/*
//COND03 IF (STEP02.RC = 0) THEN
//STEP03 EXEC BQSH
//QUERY DD DSN=<HLQ>.QUERY.FILENAME,DISP=SHR 
//STDIN DD *
PROJECT=my-long-project-name-1234
bq query --project_id=$PROJECT \
  myproject:DATASET.TABLE \
  gs://bucket/tablename.orc/*
/*
```

**Note** for variables such as project ids and bucket names can also be placed in
BQSH proclib and referenced across several JCL as environment variables, thus
avoiding specifying them in each JCL. Furthermore this approach can provide seamless
transition between prod and nonprod since environment specific variables are set
it the enviroment's BQSH proclib.

In this example standard input is provided as in-stream data to the STDIN DD.
Alternatively users can provide this input via a DSN, making it easier to
manage symbol substitution if needed.

### Enabling Debug Logging
Debug logging can be enabled by editing the BQSH Procedure and setting the environment variable BQSH_ROOT_LOGGER=DEBUG \
Debug logging can be disabled by commenting out the line or setting the variable to anything other than DEBUG.

## Using with Google Cloud Storage

Check the [Using with Google Cloud Storage](./USING_WITH_GCS.md) guide.

## Using with BigQuery

Check the [Using with BigQuery](./USING_WITH_BQ.md) guide.


## Installation

### JCL Procedure Installation
The BQSH file found in the root of the repository is deployed to a PROCLIB dataset. Administrators should modify the Java classpath if they intend to use a path other than the default.

### TCPIP.DATA Configuration for VPC-SC

Either userid.ETC.IPNODES or userid.HOSTS.LOCAL may be installed as hosts file to resolve the standard Cloud Storage API endpoints as the VPC-SC endpoint.

The sample file userid.TCPIP.DATA is deployed to configure DNS to use the hosts file entries.


### Application Jar Deployment

The application is deployed as two jar files.
gszutil.jar contains the application code.
gszutil.dep.jar contains dependencies.
These two jar files must be copied to the path specified in the Java Classpath section of the BQSH Procedure.

## Running on GCE

To reduce MIPs usage the Mainframe Connectors provides funtionalitites to use an intermediate GCE VM Instance to transcode COBOL binary, packed decimal and EBCDIC to partitioned ORC files in a streaming fashion and maximize computation offload from the mainframe.

The gszutil provides a gRPC server and client in order to delegate execution to remote server.

For more detail see [this section](./gszutil/grecv/README.md).


## Test connector locally

After downloading the repo, build jar:
```
cd professional-services/tools/bigquery-zos-mainframe-connector
(cd  mainframe-util ; sbt "clean;publishLocal")
(cd  gszutil ; sbt "clean;assemblyPackageDependency" )
(cd  gszutil ; export appjar=true ; sbt "assembly" )
```

Set env variables and run BQSH main class:
```
cd ./gszutil/target/scala-2.13
export COPYBOOK="../../src/test/resources/exportCopybook.txt"
export INFILE_DSN="../../src/test/resources/mload1.dat"
export INFILE_LRECL=111
export INFILE_BLKSIZE=1110

java -cp './*' com.google.cloud.bqsh.Bqsh 
```

Input the following command through stdin
```
gsutil cp --replace --pic_t_charset="UTF-8" --remote=false gs://<my-bucket>/tablename.orc
```

## Test server - client locally

After downloading the repo, build jar:
```
cd professional-services/tools/bigquery-zos-mainframe-connector
(cd  mainframe-util ; sbt "clean;publishLocal")
(cd  gszutil ; sbt "clean;assemblyPackageDependency" )
(cd  gszutil ; export appjar=true ; sbt "assembly" )
```

Start server locally:
```
cd ./gszutil/target/scala-2.13
java -cp './*' com.google.cloud.imf.GRecv --port=51771 --chain="/path/to/server1.pem" --key="/path/to/server1.key"
```

Run client locally
```
cd ./gszutil/target/scala-2.13
export N=3
export BUCKET=<test-bucket>
export TRUST_CERT_COLLECTION_FILE_PATH="/path/to/ca.pem"
export dns_alt_name="foo.test.google.fr"
java -cp './*' com.google.cloud.imf.GRecvTest 
```


## LOAD_STATISTICS Table
The LOAD_STATISTIC table is to collect statistical info at the end of completed
BMLU command or executed query (case when multiple queries in script file) and
then writes statistical data into BQ table.

In order to write statistics into BQ table for BMLU command should be provided
argument --stats_table with BQ table name (or path). The stats_table argument
is optional, in case it’s not provided statistics will not be written for the
job. The command must be able to get projectId and datasetId as well, those
data could be provided by other arguments (project_id and dataset_id) or inside
of stats_table argument, possible options:

```
--stats_table=<DatasetId>.<TableName>   --project_id=<ProjectId>
--stats_table=<ProjectId>:<DataSetId>.<TableName
--stats_table=<ProjectId>:<TableName>   --dataset_id=<DatasetId>
--stats_table=<TableName>   --project_id=<ProjectId>   --dataset_id=<DatasetId>
```

Currently LOAD_STATISTIC is supported by the following BMLU commands:
- bq export
- gsutil cp
- bq query
- bq load

Common LOAD_STATISTIC columns include:
- job_name
- job_date
- job_time
- timestamp
- job_id
- job_type