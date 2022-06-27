# Google BigQuery z/OS Mainframe Connector (gszutil)

This utility uploads data to Google Cloud Storage from a MVS batch jobs running on IBM z/OS mainframe.

It is built using IBM's jzos Java SDK and provides a shell emulator that accepts `gsutil` and `bq` command-line
invocations via JCL in-stream dataset. It attempts to accept arguments that appear similar to the official command-line
utilties.

The utility is deployed as a cataloged procedure called by
the [JCL EXEC statement](https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.ieab100/execst.htm)
.

## Usage

Users can make multiple calls in a single step by entering commands on separate lines or delimited by a semicolon (`;`).

Typically, a JES job will contain multiple steps, each step executing the `BQSH` procedure with one or more `gsutil`
or `bq` commands.


### Simple file copy

This example has 1 steps:

1. Upload z/OS dataset to Cloud Storage
   (gzip compression is enabled by default)

```
//STEP01 EXEC BQSH
//INFILE DD DSN=HLQ.DATA,DISP=SHR
//STDIN DD *
scp --inDD INFILE --outDsn gs://bucket/prefix
/*
```

### Example JCL

This example has 3 steps:

1. Upload COBOL dataset as ORC to a bucket
2. Load ORC file to BigQuery table
3. Query BigQuery table

```
//STEP01 EXEC BQSH
//INFILE DD DSN=<HLQ>.DATA.FILENAME,DISP=SHR
//COPYBOOK DD DISP=SHR,DSN=<HLQ>.COPYBOOK.FILENAME
//STDIN DD *
gsutil cp --replace gs://bucket/tablename.orc
/*
//COND02 IF (STEP01.RC = 0) THEN
//STEP02 EXEC BQSH
//STDIN DD *
bq load --project_id=myproject \
  myproject:DATASET.TABLE \
  gs://bucket/tablename.orc/*
/*
//COND03 IF (STEP02.RC = 0) THEN
//STEP03 EXEC BQSH
//QUERY DD DSN=<HLQ>.QUERY.FILENAME,DISP=SHR
//STDIN DD *
bq query --project_id=myproject \
  myproject:DATASET.TABLE \
  gs://bucket/tablename.orc/*
/*
```
The BQSH proc reads datasets either instream in the JCL or from normal 
data sets. The java main class interprets those as shell commands.
Environment variables from the BQSH proc are combined with the environment 
variables set in the scripts.

A JCL can contain multiple commands long commands can be continued on the 
following line using the ' \ ' character.

### Subcommand Usage
#### gsutil subcommands
Check the [Using with Google Cloud Storage](../USING_WITH_GCS.md) guide.
#### bq subcommands
Check the [Using with BigQuery](../USING_WITH_BQ.md) guide.

## Custom copybook types:

### 1. PIC T(N)

`N` - column length in bytes; `N` length WILL vary based on data and used encoding

`N = (max number of characters in column) * (bytes used per single character)`

`PIC T(N)` works in pair with parameter `--pic_t_charset` that present for following commands:

|Command|Type|
|---|:---:|
|'bq export'| [Export](./src/main/scala/com/google/cloud/bqsh/cmd/Export.scala)
|'gsutil cp'| [Cp](./src/main/scala/com/google/cloud/bqsh/cmd/Cp.scala)

Supported and tested encodings:

| --pic_t_charset|Max bytes per char|Details|
|---|:---:|---|
|JPNEBCDIC1399_4IJ (x-IBM939)|4| https://www.ibm.com/docs/en/zos/2.3.0?topic=locale-using-charmap-file|
|SCHEBCDIC935_6IJ (x-IBM935)|4| https://www.ibm.com/docs/en/zos/2.3.0?topic=locale-using-charmap-file|
|IBM037|1| https://en.wikipedia.org/wiki/Code_page_37 , https://www.compart.com/en/unicode/charsets/IBM037|
|UTF-8|4| https://en.wikipedia.org/wiki/UTF-8|

There are more encoding that could be used, but they were not tested.
https://docs.oracle.com/javase/8/docs/technotes/guides/intl/encoding.doc.html

### `PIC T(N)` usage recommendations

1. In case both export and import is done by BMLU app:

- Copybooks for import and export job should be the same.
- Use 4 bytes per char on calculation of column size, it should be enough for almost any encoding that can be used.

2. If upstream/export is 3rd party system (i.e. DB2) and downstream/import is BMLU:

- Copybooks should be crafted based on binary file layout.
- It is essential to know what encoding was used by upstream system to encode characters. You should find that encoding
  in [list](https://docs.oracle.com/javase/8/docs/technotes/guides/intl/encoding.doc.html) and add as a parameter for
  BMLU app, i.e. `--pic_t_charset=IBM037`
- You should know what columns are string columns and used PIC T for those columns in copybook.
- Size of PIC T should be taken directly from binary file (by inspection in HEX viewer), it is impossible to know how
  many bytes upstream system used to encode column.
- Upstream system may encode some metadata after string column data, this metadata should be ignored in copybook by
  adding column `FILLER PIC X(byte length of metadata)` after string column

3. If upstream/export is BMLU and downstream/import is 3rd party system (i.e. DB2):

- Copybooks should be crafted based on binary file layout that can be consumed by 3rd party system.
- It is essential to know what encoding will be used by downstream system to decode characters. You should find that
  encoding in [list](https://docs.oracle.com/javase/8/docs/technotes/guides/intl/encoding.doc.html) and add as a
  parameter for BMLU app, i.e. `--pic_t_charset=IBM037`
- You should know what columns are string columns and used PIC T for those columns in copybook.
- Size of `PIC T` should be set based on 3rd party system expectation to particular string column.
- Downstream/export system may expect some metadata after string column data, this metadata should be mentioned in
  copybook by adding column `FILLER PIC X(byte length of metadata)` after string column. This may lead to data mismatch
  so data validation is required (checking how NULL are decoded, etc).

When upstream or downstream system is not BMLU some reverse engineering is required to align binary files format.

## Environment variables

|Name|Default|Description|
|---|:---:|---|
|KEYFILE, GKEYFILE, GOOGLE_APPLICATION_CREDENTIALS | no|Path to json keyfile that provides authentication credentials to your application code.
|LOG_PROJECT|no|Cloud logging google project id|
|LOG_ID|no|Cloud logging log id|
|LOG_WRAP_SPOOL|true|Wrap log messages longer than 80 symbols|
|BQ_CONNECT_TIMEOUT_MILLIS|30000| BigQuery API client timeout (msec) in making the initial connection, occurs only upon starting the TCP connection, this usually happens if the remote machine does not answer|
|BQ_READ_TIMEOUT_MILLIS|30000|BigQuery API client timeout (msec) on waiting to read data. If the server (or network) fails to deliver any data timeout seconds after the client makes a socket read call, a read timeout error will be raised.|
|BQ_MAX_ATTEMPTS_COUNT|5|BigQuery API client max request attemts before fail. Controls retry logic.|
|STORAGE_CONNECT_TIMEOUT_MILLIS|20000|Google Storage API client timeout (msec) in making the initial connection, occurs only upon starting the TCP connection, this usually happens if the remote machine does not answer|
|STORAGE_READ_TIMEOUT_MILLIS|20000|Google Storage API client timeout (msec) on waiting to read data. If the server (or network) fails to deliver any data timeout seconds after the client makes a socket read call, a read timeout error will be raised.|
|STORAGE_MAX_ATTEMPTS_COUNT|3|Google Storage API client max request attemts before fail. Controls retry logic.|
|HTTP_CLIENT_MAX_CONNECTIONS_COUNT|max(cpu_count,&nbsp;32) | Http client is shared between BqClient, BqStorage, GCStorage clients. There are workloads, like Parallel Export, that use thread pools to parallelize read/write data. For such workloads one http connection per thread at thread pool is required.<br/>Formula for pool size:<br/>maxConnectionTotal = JOB_THREAD_POOL_SIZE * JOBS_IN_PARALLEL_COUNT<br/>JOB_THREAD_POOL_SIZE - by default it is a vCPU count<br/>JOBS_IN_PARALLEL_COUNT - by default it is 5, need load tests to detect proper number.|
|RST_STREAM_RETRY_COUNT|5|Retry count on 'Rst Stream' error and BQ Storage API stream related errors|
|RST_STREAM_MIN_TIMEOUT_SEC|5|Timeout in seconds before retry of ```Rst Stream``` error and BQ Storage API stream related errors. Max timeout is calculated as min_timeout + 15 seconds. Actual timeout will be random number between min and max, to avoid ```hot spots``` on retry. |
|GOOGLE_API_L2_RETRY_COUNT|3| Max retries before fail for Google API clients. This environment variable controls level 2 retry logic for google API http clients. It will work when level 1 retry logic controlled by STORAGE_MAX_ATTEMPTS_COUNT and BQ_MAX_ATTEMPTS_COUNT will be skipped. It may happen for some type of networking errors (broken pipe, socket timeout, handshake fail).|
|GOOGLE_API_L2_RETRY_TIMEOUT_SECONDS|5| Delay in seconds between retries for Google API clients level 2 retry logic. See GOOGLE_API_L2_RETRY_COUNT for details.|
|BQ_QUERY_CONCURRENT_UPDATE_RETRY_COUNT|5|Max retries on error "Could not serialize access to <table_name> due to concurrent update" on bq query command.
|BQ_QUERY_CONCURRENT_UPDATE_RETRY_TIMEOUT_SECONDS|2|Initial delay for "Could not serialize access to <table_name> due to concurrent update" error on bq query command.
|BQ_QUERY_CONCURRENT_UPDATE_WHITE_LIST|TABLE_STATUS|Comma separated list of tables names for which allowed retry on error "Could not serialize access to <table_name> due to concurrent update".
|GCSDSNURI|no|Default destination Google Cloud Storage Bucket for scp(Simple file copy) command. (Format: gs://bucket/prefix)|
|GCSGDGURI|no|Default destination Google Cloud Storage Bucket for scp(Simple file copy) command when source is versioned dataset (GDG - Generation Data Groups) (Example: gs://bucket-with-versioning/prefix)|
|SRVHOSTNAME|no|BMLU GRPC server DNS hostname or IP|
|SRVPORT|52701|BMLU GRPC server port|
|TRUST_CERT_COLLECTION_FILE_PATH|no|Path to trustCertCollectionFilePath for gRPC TLS authentication|
|GCSOUTURI|no|Default Cloud Storage prefix for output ORC files (Format: gs://BUCKET/PREFIX)|
|JOBDATE|UNKNOWN|JCL job starting date}|
|JOBTIME|UNKNOWN|JCL job starting time|
|_BPX_SHAREAS|no| Controls execution in shell. [More details here](https://www.ibm.com/docs/en/zos/2.2.0?topic=shell-setting-bpx-shareas-bpx-spawn-script)|
|_BPX_SPAWN_SCRIPT|no| Controls execution in shell. [More details here](https://www.ibm.com/docs/en/zos/2.2.0?topic=shell-setting-bpx-shareas-bpx-spawn-script)|

## High level architecture

![bqsh sequence diagram](./img/bqsh_high_level_sequence_diagram.png)

### Commands dispatch table

|Command|Type
|---|:---:|
|'bq mk'| [Mk](./src/main/scala/com/google/cloud/bqsh/cmd/Mk.scala)
|'bq query'| [Query](./src/main/scala/com/google/cloud/bqsh/cmd/Query.scala)
|'bq export'| [Export](./src/main/scala/com/google/cloud/bqsh/cmd/Export.scala)
|'bq load'| [Load](./src/main/scala/com/google/cloud/bqsh/cmd/Load.scala)
|'bq rm'| [Rm](./src/main/scala/com/google/cloud/bqsh/cmd/Rm.scala)
|'bq export'| [Export](./src/main/scala/com/google/cloud/bqsh/cmd/Export.scala)
|'gsutil| [Cp](./src/main/scala/com/google/cloud/bqsh/cmd/Cp.scala)
|'gsutil rm'| [GsUtilRm](./src/main/scala/com/google/cloud/bqsh/cmd/GsUtilRm.scala)
|'gszutil'| [GsZUtil](./src/main/scala/com/google/cloud/bqsh/cmd/GsZUtil.scala)
|'scp'| [Scp](./src/main/scala/com/google/cloud/bqsh/cmd/Scp.scala)
|'jclutil'| [JCLUtil](./src/main/scala/com/google/cloud/bqsh/cmd/JCLUtil.scala)
|'sdsfutil'| [SdsfUtil](./src/main/scala/com/google/cloud/bqsh/cmd/SdsfUtil.scala)

### RPC calls to Grecv

To decrease MIPS consumption at mainframe side some CPU/IO intense commands can delegate execution
to [Grecv](./src/main/scala/com/google/cloud/imf/GRecv.scala) server (via RPC call).

|Command|Type|
|---|:---:|
|'bq export'| [Export](./src/main/scala/com/google/cloud/bqsh/cmd/Export.scala)
|'gsutil| [Cp](./src/main/scala/com/google/cloud/bqsh/cmd/Cp.scala)

Commands are using a GRPC protocol to delegate execution to remote server. TLS/SSL encryption is provided by separate
tools, ```AT-TLS``` from mainframe side and ```stunnel``` at Grecv server side.


## Pre-Requisites

* [IBM SDK for z/OS, Java Technology Edition, Version 8](https://developer.ibm.com/javasdk/support/zos/)
* [SBT](https://www.scala-sbt.org/download.html)
* [pax](https://www.ibm.com/support/knowledgecenter/en/ssw_aix_72/com.ibm.aix.cmds4/pax.htm) (install
  with `sudo apt install -y pax` on debian)

## Development Environment Setup

1. Extract IBM JDK using gunzip and pax

```sh
gunzip -c SDK8_64bit_SR5_FP30.PAX.Z | pax -r
```

2. Copy `ibmjzos.jar`, `ibmjcecca.jar` and `dataaccess.jar` to `lib/` at the repository root.

## Building

Build application jar

```sh
sbt package
```

Build dependencies jar

```sh
sbt assemblyPackageDependency
```

## Installation

1. Deploy `<userid>.TCPIP.DATA` to configure DNS resolution
2. Deploy `<userid>.HOSTS.LOCAL` or `<userid>.ETC.IPNODES` if you need to send API requests to
   the `restricted.googleapis.com` VPC-SC endpoint.
3. Deploy `gszutil.dep.jar` and `gszutil.jar` to `/opt/google/lib` unix filesystem directory (or directory chosen by
   your z/OS administrator)
4. Deploy [proclib/BQSH](proclib/BQSH) to a PROCLIB MVS dataset on the mainframe. If you deployed the jar files to a
   path other than `/opt/google/lib`, you will need to modify `BQSH` to reflect the correct path.

## Limitations

The current COBOL Copy Book parser may not support all possible PIC strings. Not all gsutil and bq functionality is
implemented by the emulators included in this utility. Command-line argument compatibility is made on a best-effort
basis.

## Disclaimer

This is not an official Google product.
