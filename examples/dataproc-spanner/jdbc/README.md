## BigQuery to Spanner using Apache Spark in Scala

### Why create this repo ? 

 * Google Cloud customers need to move data from BigQuery to Spanner using Apache Spark in Scala
 * Dataproc [templates](https://github.com/GoogleCloudPlatform/dataproc-templates) cannot help as they are written in Python & Java
 * The Apache Spark SQL [connector](https://github.com/GoogleCloudDataproc/spark-spanner-connector) for Google Cloud Spanner only supports reads not writes 

### Why is this a hard problem ? 

**1. data type mapping**

The [spark-bigquery-connector](https://github.com/GoogleCloudDataproc/spark-bigquery-connector?tab=readme-ov-file#data-types) reads from BigQuery and converts BigQuery Google SQL Types into SparkSQL Types.

Apahce Spark JDBC is used to write to spanner, converting SparkSQL types into Spanner GoogleSQL types.

For some BigQuery GoogleSQL types, there is not equivalent in SparkSQL & Spanner GoogleSQL.

| BigQuery GoogleSQL Type   | SparkSQL Type | Spanner GoogleSQL Type |Notes |
|----------|---------------|--------------|--------------|
| [INT64](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#integer_types)       |   LongType       | [INT64](https://cloud.google.com/spanner/docs/reference/standard-sql/data-types#integer_types)        |   |
| [FLOAT64](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#floating_point_types) | DoubleType    | [FLOAT64](https://cloud.google.com/spanner/docs/reference/standard-sql/data-types#floating_point_types)      |  |
| [NUMERIC](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#decimal_types) |   DecimalType     | [NUMERIC](https://cloud.google.com/spanner/docs/reference/standard-sql/data-types#decimal_types)      |  |
| [BIGNUMERIC](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#decimal_types) |  DecimalType      | [NUMERIC](https://cloud.google.com/spanner/docs/reference/standard-sql/data-types#decimal_types)      | Spark & Spanner have no Big Numeric support  |
| [BOOL](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#boolean_type)     |     BooleanType      | [BOOL](https://cloud.google.com/spanner/docs/reference/standard-sql/data-types#boolean_type)         |  |
| [STRING](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#string_type)     |      StringType   | [STRING(MAX)](https://cloud.google.com/spanner/docs/reference/standard-sql/data-types#string_type)  |  |
| [DATE](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#date_type)     |   DateType      |[DATE](https://cloud.google.com/spanner/docs/reference/standard-sql/data-types#date_type)  |  |
| [DATETIME](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#datetime_type)     |   StringType      | [STRING(MAX)](https://cloud.google.com/spanner/docs/reference/standard-sql/data-types#string_type)  | Spark & Spanner have no DATETIME type|
| [TIME](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#time_type)     |    LongType     | [INT64](https://cloud.google.com/spanner/docs/reference/standard-sql/data-types#integer_types)  | Spark & Spanner have no TIME type|
| [TIMESTAMP](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#timestamp_type)     |   TimestampType      |[TIMESTAMP](https://cloud.google.com/spanner/docs/reference/standard-sql/data-types#timestamp_type)  |  |

**2. no jdbc dialect for spanner**

When using Apache Spark JDBC in Scala, there are pre-built SQL [dialects](https://github.com/apache/spark/tree/071feabbd4325504332679dfa620bc5ee4359370/sql/core/src/main/scala/org/apache/spark/sql/jdbc) for known databases:

* Teradata
* Postgres
* Oracle
* MySQL
* MsSqlServer
* H2
* DB2

However, there is no pre-built SQL dialect for Spanner.

When using Apache Spark JDBC in Scala to read or write with Spanner, the default JDBC SQL dialect is used which is incompatible with Spanner.

For this reason a new custom SQL dialect had to be written for Spanner, for use with Apache Spark JDBC in Scala.

### How to build this code & use this template ?

1. [Dataproc2.2](https://cloud.google.com/dataproc/docs/concepts/versioning/dataproc-release-2.2) images are the target execution environment
2. Given dataproc image, need Java JDK 11 
3. Given dataproc image, need Scala 2.12.18
4. Also need sbt
5. Build a JAR of this code by running ```sbt package``` from root of this repo. We call this the ```APP_JAR```
6. upload JAR of this code to Google Cloud Storage
7. upload a JAR of the Spanner JDBC [driver](https://cloud.google.com/spanner/docs/jdbc-drivers) to Google Cloud Storage. We call this the ```SPANNER_JDBC_JAR```
8. If it does not exist, create a Spanner table with schema equal to source BigQuery table
9. Sumit a job to your dataproc cluster to move data from BigQuery to Spanner

```shell
gcloud dataproc jobs submit spark --cluster ${CLUSTER_NAME} \
    --region=us-central1 \
    --jar=${GCS_BUCKET_JARS}/${APP_JAR_NAME} \
    --jars=${GCS_BUCKET_JARS}/${SPANNER_JDBC_JAR} \
    -- ${BQ_PROJECT_ID} ${BQ_DATASET} ${BQ_TABLE} ${BQ_TABLE_PK} ${SPANNER_PROJECT_ID} ${SPANNER_INSTANCE} ${NUM_SPANNER_NODES} ${SPANNER_DB} ${SPANNER_TABLE} ${JDBC_BATCH_SIZE}
```

Where the arguments have this meaning

| cmd line arg   | meaning | example |
|----------|---------------|--------------|
| CLUSTER_NAME | The name of your Dataproc cluster       | my_cluster      |
| GCS_BUCKET_JARS | The Google Cloud Storage bucket for JARs       | gs://my-jar-bucket      |
| APP_JAR_NAME     | As above, the JAR of this template code          | spark-bigquery-spanner.jar         |
| SPANNER_JDBC_JAR     | As above, the JAR of Spanner JDBC driver          | google-cloud-spanner-jdbc-2.17.1-single-jar-with-dependencies.jar         |
| BQ_PROJECT_ID     | The ID of the GCP project with BigQuery source data        | ```gcloud config list core/project --format="value(core.project)"```  |
| BQ_DATASET     | The BigQuery dataset with source data        | my_bq_dataset  |
| BQ_TABLE     | The BigQuery table with source data        | my_bq_table  |
| BQ_TABLE_PK     | Primary key column name of the BigQuery table        | my_pk_column_name  |
| SPANNER_PROJECT_ID     | The ID of the GCP project with Spanner target        | ```BQ_PROJECT_ID=$(gcloud config list core/project --format="value(core.project)")```  |
| SPANNER_INSTANCE     | The Spanner instance with target table        | my_spanner_instance  |
| NUM_SPANNER_NODES     | The number of nodes the spanner instance has        | ```gcloud spanner instances describe ${SPANNER_INSTANCE} --format="value(nodeCount)"```  |
| SPANNER_DB     | The Spanner database with target table        | my_spanner_db  |
| SPANNER_TABLE     | The target table in Spanner        | my_spanner_table  |
| JDBC_BATCH_SIZE     | The number of rows to bundle into a single write to Spanner        | 200  |

### Example of using this template

#### Example - part 1 of 4 - environment variables + setup

```shell
export PROJECT_ID=$(gcloud config list core/project --format="value(core.project)")
export PROJECT_NUM=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
export GEO_REGION="US"
export GCS_BUCKET="gs://${PROJECT_ID}-sparkbigqueryspanner"
export GCS_BUCKET_JARS="${GCS_BUCKET}/jars"
export BQ_PROJECT_ID="bigquery-public-data"
export BQ_DATASET="austin_311"
export BQ_TABLE="311_service_requests"
export BQ_TABLE_PK="unique_key"
export SPANNER_INSTANCE="sparkbigqueryspanner-demo-instance"
export SPANNER_DB="sparkbigqueryspanner-demo--db"
export SPANNER_TABLE="service_requests_copy"
export JDBC_BATCH_SIZE="200"
export CLUSTER_NAME="sparkbigqueryspanner-demo-cluster"
export APP_JAR_NAME="spark-bigquery-spanner_2.12-0.1.0-SNAPSHOT.jar"
export SPANNER_JDBC_JAR="google-cloud-spanner-jdbc-2.17.1-single-jar-with-dependencies.jar"
```

#### Example - part 2 of 4 - BigQuery table (source)

we will use the public table

```shell
bigquery-public-data.austin_311.311_service_requests
```

It has 1,860,505 rows

#### Example - part 3 of 4 - Spanner table (sink)

create a spanner instance

```shell
gcloud spanner instances create ${SPANNER_INSTANCE} \
  --project=${PROJECT_ID}  \
  --config=regional-us-central1 \
  --description="Demo replication from BigQuery" \
  --nodes=1
```

create environmental variable to record num nodes for later usage in template
```shell
export NUM_SPANNER_NODES=$(gcloud spanner instances describe ${SPANNER_INSTANCE} --format="value(nodeCount)")
```

create a database within the spanner instance (with dialect GoogleSQL)

```shell
gcloud spanner databases create ${SPANNER_DB} \
  --instance=${SPANNER_INSTANCE}
```

create a table in our Spanner DB: 
 *  column names matching BigQuery table names
 *  column types as per mapping table above


```shell
gcloud spanner databases ddl update ${SPANNER_DB} \
--instance=${SPANNER_INSTANCE} \
--ddl='CREATE TABLE service_requests_copy ( unique_key STRING(MAX), complaint_description STRING(MAX), source STRING(MAX), status STRING(MAX), status_change_date TIMESTAMP, created_date TIMESTAMP, last_update_date TIMESTAMP, close_date TIMESTAMP, incident_address STRING(MAX), street_number STRING(MAX), street_name STRING(MAX), city STRING(MAX), incident_zip INT64, county STRING(MAX), state_plane_x_coordinate STRING(MAX), state_plane_y_coordinate FLOAT64, latitude FLOAT64, longitude FLOAT64, location STRING(MAX), council_district_code INT64, map_page STRING(MAX), map_tile STRING(MAX)) PRIMARY KEY (unique_key)'
```

#### Example - part 4 of 4 - Run Scala Spark Job on Dataproc

create a dataproc cluster

```shell
gcloud dataproc clusters create ${CLUSTER_NAME} \
  --region us-central1 \
  --no-address \
  --master-machine-type n2-standard-4 \
  --master-boot-disk-type pd-balanced \
  --master-boot-disk-size 500 \
  --num-workers 2 \
  --worker-machine-type n2-standard-4 \
  --worker-boot-disk-type pd-balanced \
  --worker-boot-disk-size 500 \
  --image-version 2.2-debian12 \
  --project ${PROJECT_ID}
```

create a bucket to hold JARs

```shell
gcloud storage buckets create ${GCS_BUCKET} \
  --project=${PROJECT_ID} \
  --location=${GEO_REGION} \
  --uniform-bucket-level-access
```

Upload required JARs to Google Cloud Storage bucket

 * ```APP_JAR```, the JAR of this code by running ```sbt package``` from root of this repo
 * ```SPANNER_JDBC_JAR```, the JAR of the Spanner JDBC [driver](https://cloud.google.com/spanner/docs/jdbc-drivers)

launch Scala Apache Spark job on Dataproc cluster

```shell
gcloud dataproc jobs submit spark --cluster ${CLUSTER_NAME} \
    --region=us-central1 \
    --jar=${GCS_BUCKET_JARS}/${APP_JAR_NAME} \
    --jars=${GCS_BUCKET_JARS}/${SPANNER_JDBC_JAR} \
    -- ${BQ_PROJECT_ID} ${BQ_DATASET} ${BQ_TABLE} ${BQ_TABLE_PK} ${PROJECT_ID} ${SPANNER_INSTANCE} ${NUM_SPANNER_NODES} ${SPANNER_DB} ${SPANNER_TABLE} ${JDBC_BATCH_SIZE}
```