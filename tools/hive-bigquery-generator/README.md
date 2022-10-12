
# Hive BigQuery External Table and View Generator
## Purpose
This tool reads all Hive Tables from the Hive Metastore via Thrift Protocol and
creates required BigQuery External Table and Views. This tool also create audit
tables in BigQuery which are used to create Audit Dashboards in GCP DataStudio.

Find all the details in this [Readme Doc](https://docs.google.com/document/d/1NhdvnJ77G7WjLgibxGNFfMV4JmbVsln4bnmTcOUhRL4/edit#)

## Usage
```
java -jar hive-bq-external-tool-0.0.1-SNAPSHOT.jar  > execution.log 2>&1 &
```

##Tool Operations and Outputs
- Reads Hive Metastore and serializes all HiveTable objects to a local
json file in output directory from the list of allowlisted Hive Databases
- Loads this json file to BigQuery Table in the given audit dataset
- For every valid Hive Table (Managed / External) this creates two BigQuery Resources
   - External BQ Table:
  `<bq-project>.<external-table-prefix>_<hive-db-name>.<hive-table-name>`
   - BQ View:
   `<bq-project>.<view-prefix>_<hive-db-name>.<hive-table-name>`
- Creates a BigQuery Metastore view on top of BigQuery Information Schema Tables
for all the created datasets.
- Based on the execution responses from every query, it serializes all the created
sql DDL statements for External and Views into a local json file in output folder.
And uploads this file to a BQ Table for audit purposes.

## Properties
There are multiple ways to pass application properties to the tool.

###Using application.yml File
Keep this file in the same folder as the jar file.
Application will pick up this file implicitly without passing this to the application.

**Below is the default application property file used by the app.**
```
view-generator:
  thread-pool: 100
  hive:
    metastore-connection-pool: 100
    thrift-uris: "thrift://10.116.1.35:9083,thrift://10.116.1.58:9083,thrift://10.116.1.61:9083"
    filters:
      db-allow-lists: ["bigfoot_external_neo","bigfoot_journal","bigfoot_snapshot","bigfoot_common","test_bigfoot_external_neo"]
      table-type-deny-lists: [ "VIRTUAL_VIEW" ]
      file-format-deny-lists: [ "JSON" ]

  bigquery:
    location: "asia-south1"
    project: "fks-batch-gcs-storage"
    external-table-dataset-prefix: "bqext_"
    view-dataset-prefix: "bq_"
    audit:
      dataset: "view_generator_audit"
      hive-metastore-stats-table: "hive_table_stats"
      tool-execution-stats-table: "bq_external_view_stats"
      bigquery-metastore-stats-table: "bq_ext_stats_from_bqmetastore"
      select-view-check: false
  logfiles:
    output-folder: "output"
```

###Using Command Line
Instead of using a properties file, you can pass all the parameters
via command line as mentioned below.

Note: These are the 5 minimum set of properties to be set
App will fail if these are not specified
```
java \
  -Dview-generator.hive.thrift-uris="thrift://10.116.1.35:9083,thrift://10.116.1.58:9083,thrift://10.116.1.61:9083" \
  -Dview-generator.bigquery.location="asia-south1" \
  -Dview-generator.bigquery.project="fks-batch-gcs-storage" \
  -Dview-generator.bigquery.external-table-dataset-prefix="bqext_" \
  -Dview-generator.bigquery.view-dataset-prefix="bq_" \
  -jar hive-bq-external-tool-0.0.1-SNAPSHOT.jar  > execution.log 2>&1 &
```

Other optional parameters can be set in the same way
```
java \
  -Dview-generator.hive.thrift-uris="thrift://10.116.1.35:9083,thrift://10.116.1.58:9083,thrift://10.116.1.61:9083" \
  -Dview-generator.hive.filters.db-allow-list="bigfoot_external_neo,bigfoot_journal,bigfoot_snapshot,bigfoot_common,test_bigfoot_external_neo" \
  -Dview-generator.hive.filters.table-type-deny-list="VIRTUAL_VIEW" \
  -Dview-generator.hive.filters.file-format-deny-list="JSON" \
  -Dview-generator.bigquery.location="asia-south1" \
  -Dview-generator.bigquery.project="fks-batch-gcs-storage" \
  -Dview-generator.bigquery.external-table-dataset-prefix="bqext_" \
  -Dview-generator.bigquery.view-dataset-prefix="bq_" \
  -jar hive-bq-external-tool-0.0.1-SNAPSHOT.jar  > execution.log 2>&1 &
```


###TODO
- Tests
- Replace e.printstacktraces with : log.error("<custom-msg>", e);
- better error handling
