# Number family recommender on migration from legacy commercial database

### Introduction
The Numeric Family Recommender is a database script that recommends the best numeric data type for NUMBER data when migrating from Oracle to Google Cloud platforms like BigQuery, AlloyDB, Cloud SQL for PostgreSQL, and Google Cloud Storage. It uses metadata and data, if necessary, to make data-driven decisions during the schema conversion phase on number data type, reducing the risk of data validation failures, unnecessary truncation of data, and excessive storage. This guide explains how to use the script during the migration process.


### Oracle Number Overview

The NUMBER data type in Oracle can vary and be dynamic in nature. It can be defined with or without precision and scale, and the declaration for a NUMBER with precision and scale is "NUMBER(p,s)". 
Precision refers to the significant digits in a number, including the digits to the left and right of the decimal point. In cases where the NUMBER data type is defined with precision and scale or with only precision, it is easier to make decisions on the data type for Google Cloud. However, when NUMBER is defined without precision or scale, it can be challenging to make decisions without knowing the underlying data.

Some samples on well defined NUMBER data type in Oracle.
- NUMBER(10,2) 
- NUMBER(2)
- NUMBER(10,-2)

Let’s take the sample table that includes multiple variants of the Number Data type within Oracle.

![Oracle Sample number data type sample](/tools/numeric-family-recommender-oracle/images/oracle-sample-ddl.jpg)


In the sample table, Top three columns are critical and mapping it to correct and optimal data type on preferred target should be critical. Underlying characteristics are only determined if sampling is performed on a dataset and accordingly mapped to optimal data type from the numeric family of target on Google Cloud.

### Number Data type Recommender

To determine the appropriate data type for a Google Cloud target, it is necessary to understand the characteristics of the source dataset. This can be done through metadata or by sampling the dataset to develop heuristics. Understanding the source dataset for numeric data involves identifying information in the Oracle schema or metadata, and if that information is not available, sampling the dataset to make recommendations on data types.

We take the Table definition sample in Oracle source, let us categorize which column data type can be inferred as per metadata and which column will need sampling of actual underlying data.

| Column name  | Recommendation approach  |
|---|---|
|  COL1_NUMBER_INT,COL2_NUMER_DECIMAL,COL3_NUMBER_HIGH_DECIMAL |  Data Driven, no precision and scale specification. |
|  COL4,COL5,COL6,COL7,COL8,COL9 | Metadata driven, include precision or both precision and scale as part of definition.  |


#### Metadata-driven decisions

To determine the best data type for a target on Google Cloud, it is necessary to understand the limitations of the numeric data type on that platform. For example, the NUMERIC type in BigQuery has a maximum precision of 38 and a hard limit on the scale of <=9. By using metadata from Oracle and building rules based on these limitations, it is possible to determine the most suitable data type for a given target on Google Cloud.

| Oracle Data type | Oracle PRECISION(p) | OracleSCALE(s) | Spark - JDBC | BIGQUERY   | PostgreSQL   |
|------------------|---------------------|----------------|--------------|------------|--------------|
| NUMBER(p)        | p < 5               | 0 OR NULL      | SMALLINT     | INT64      | SMALLINT     |
| NUMBER(p)        | p >=5 and p<10      | 0 OR NULL      | INTEGER      | INT64      | INTEGER      |
| NUMBER(p)        | p >=10 and p<19     | 0 OR NULL      | BIGINT       | INT64      | BIGINT       |
| NUMBER(p)        | p>=19 and P < 30    | 0 OR NULL      | DECIMAL(p)   | NUMERIC    | NUMERIC(p)   |
| NUMBER(p)        | p>=30               | 0 OR NULL      | DECIMAL(p)   | BIGNUMERIC | NUMERIC(p)   |
| NUMBER(p,s)      | p is not null       | s < 10         | DECIMAL(p,s) | NUMERIC    | NUMERIC(p,s) |
| NUMBER(p,s)      | p is not null       | s > 10         | DECIMAL(p,s) | BIGNUMERIC | NUMERIC(p,s) |

*Please note:-*
Based on precision and scale limit on BigQuery, we choose between different numeric options in BigQuery and map it accordingly.

Based on different targets and tools available, for instance on  PostgreSQL as target be it ora2pg to Ispirer both take care of making optimal decisions as per Data Definition or metadata. We can use metadata based decisions to review what conversion tools do and if needed revert it as per optimal recommendations.

In some cases, it may be necessary to optimize the use of metadata-driven rules. For example, when the scale is 0 and only the precision is defined, it may be desirable to map all NUMBER definitions with only precision (NUMBER(p)) to the integer family (INT/BIGINT) even if the precision is greater than 18. This can be done to further optimize the data type for a given target on Google Cloud.

#### Data-driven decisions
For NUMBER data types without precision and scale, it is difficult to determine the correct data type based on metadata alone. This is because such data types are dynamic in nature and can store any numeric value. Any assumptions made by conversion tools may be less optimal and more prone to errors.

To address this issue, it may be necessary to sample the Oracle data using a sampling approach based on a percentage set. This can help to minimize truncation when loading the data into BigQuery. The sampling will take into account the maximum and minimum values, as well as the maximum length of the data across the decimal point. It will do dynamic sampling only once per table, rather than per NUMBER column with that table.

For PostgreSQL, the correct data type can be determined based on the maximum of the left and right significant values across the decimal point. In this case, DOUBLE PRECISION may be the best choice. For Spark JDBC, the default data type may be DECIMAL(38,9) to correctly map to NUMERIC types in BigQuery.

Decision tree for Number data type without precision and scale can be as below. Conditions are executed in the order as specified in the tabular representation.

| Oracle Data Type | Max Scale length calculated                                   | Data value sampled                                    | Spark Data type | BigQuery Data type | PostgreSQL Data Type |
|------------------|---------------------------------------------------------------|-------------------------------------------------------|-----------------|--------------------|----------------------|
| NUMBER           | 0                                                             | BETWEEN -9223372036854775808  AND 9223372036854775807 | BIGINT          | INT64              | BIGINT               |
| NUMBER           | max_left_significant_digit + max_right_significant_digit <=15 |                                                       | NA              | NA                 | DOUBLE PRECISION     |
| NUMBER           | > 38                                                          | NOT NULL                                              | STRING          | BIGNUMERIC/STRING | NUMERIC              |
| NUMBER           | <10                                                           | NOT NULL                                              | DECIMAL(X,9)    | NUMERIC            | NUMERIC              |
| NUMBER           | >10                                                           | NOT NULL                                              | DECIMAL(X,Y)    | BIGNUMERIC         | NUMERIC              |
| NUMBER           | NULL                                                          | NULL                                                  | DECIMAL(38,9)   | NUMERIC            | DOUBLE PRECISION     |

###  Integration with Conversion Tool
Conversion tools like ora2pg or JDBC configuration of Spark have options to overwrite data type infer as part of fetching data or conversion. We will explore some of the options and how it can be automated as part of Schema and Code Conversion from Oracle as source.

#### Spark JDBC - customschema configuration
As part of JDBC connectivity to Databases, Spark provides customSchema option to overwrite data type based on Number Data type recommender.
Let’s take a look at the sample below to fetch dataset from Oracle Source and use the customSchema option to overwrite.

<pre>
jdbcDF = spark.read \
   .format("jdbc") \
   .option("url", "jdbc:oracle:thin:@<<hostname>>:1521/<<serviceName>>") \
   .option("dbtable", "(select /* countsample*/ * from dms_sample.sample_number_data_type where rownum < 11)") \
   .option("user", "<<user>>") \
   .option("password", "<<password>>") \two
   <b>.option("customSchema","COL4 BIGINT,COL5 BIGINT,COL1_NUMBER_INT BIGINT,COL2_NUMBER_DECIMAL DECIMAL(38,9),COL3_NUMBER_HIGH_DECIMAL STRING")</b> \ 
   .option("oracle.jdbc.timezoneAsRegion","false") \
   .option("sessionInitStatement", "ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD HH24:MI:SS'") \
   .load()
</pre>

![Spark - customSchema JDBC configuration](/tools/numeric-family-recommender-oracle/images/spark-custom-schema.jpeg)

#### Ora2pg - modify_type configuration
Ora2pg configuration provides MODIFY_TYPE options, it helps us to overwrite custom data type as compared to default assumption done by tool. By default Ora2pg assumes BIGINT for all number definitions without precision and scale.If we take our sample table as reference, we can use modify_type within Ora2pg to transform Table conversion decision.

![Ora2pg modify_type configuration](/tools/numeric-family-recommender-oracle/images/ora2pg-transform.jpeg)


Mapping data type to optimal data type is supported as part of configuration and it can be automated for more sets of tables or complete schema when migrating away from Oracle.

### Oracle Number recommender configuration.
Oracle Number data type recommender script can be configured to run for a specific set of tables or complete tables within a Schema. It dynamically builds SQL to capture data driven metrics for number without precision and scale. 

Below are some characteristics of the Oracle Number Data type recommender.
- Percentage based configuration to sampled data set to get data driven metrics including max and min length of left and right significant digits from decimal points.
- Google Cloud target supported within same execution,  BIGQUERY|SPARK-JDBC|POSTGRESQL
- Configurable to enable parallel execution while scanning data for large tables.
- Optimize option to mapped all datatypes like number(p) to integer family.
- Print Ora2pg(modify_type) and Spark(customSchema) related configurations to overwrite Data type while migrating away from Oracle.
- Dynamic logic to recommend data type across tables and scan only once for all columns within the same tables.


Sample Configuration and default input from Oracle Number Recommender script.
| Configuration                  | Default values                   | Description                                                                                                                                                                                                                                                            |
|--------------------------------|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| gcp_cloud_target_engine        | BIGQUERY\|SPARK-JDBC\|POSTGRESQL | Choose target on Google Cloud for which you want to run Oracle Number Data type recommender    We can opt for more then one target separated by \| .    All valid values are as follow    BIGQUERY    SPARK-JDBC    POSTGRESQL - applies to both CloudSQL and AlloyDB. |
| spark_target_additional_buffer | 2                                | Applicable to SPARK-JDBC only. It add buffer to scale length supported based on max length captured during sampling                                                                                                                                                    |
| scan_max_table_perc            | 10                               | It control percentage of table data to sampled to generate data characteristics and make data driven decision for number without precision and scale                                                                                                                   |
| bq_scale_above_38_as_string    | N                                | Applicable to BigQuery only.It controls if scale goes beyond 38 in length then to convert it as String for BigQuery as target.                                                                                                                                         |
| scan_data_for_all_number_col   | N                                | It controls whether to scan data for all NUMBER data types including NUMBER declaration with precision and scale defined.                                                                                                                                              |
| opti_number_def_without_scale  | Y                                | It control whether set all number with declaration as number(p) to integer family                                                                                                                                                                                      |
| scan_data_without_prec_scale   | Y                                | It controls whether to scan data for  NUMBER data type declaration without precision and scale defined. If sets to N, it will sampled gather statistics and recommend target data type only based on High and Low value                                                |
| oracle_table_parallel_degree   | 2                                | It controls the scan method on the Oracle table and if parallel needs to be enabled with how many threads.                                                                                                                                                             |
| schemaname                     | User Input                               | Add schema name to be scan for number data type recommender                                                                                                                                                                                                            |
| tablename                      | User Input                                | Add a semicolon(;) separated list of table names or add wildcard % to scan all tables in the specified schema.                                                                                                                                                         |

### Running Number Data type Recommender.
To generate recommended output using an Oracle preferred client, such as SQLplus or SQL developer, you will need minimal privileges to connect and query data. In this section, we will discuss the required grants and how to use these clients to generate the output in a spool file.

#### Minimal Oracle grants required.
To run Number recommendation, you will need minimal select privilege to query Oracle's internal dictionary views for tables and columns. On numbers without precision and scale, you will need SELECT privilege on the relevant tables to querying underlying data. \
If you are running the script from the same user for a table within its own schema, you can skip providing SELECT privilege.

```
--Replace <<password>> and <<schemaname>> to desired values.
CREATE USER num_recommender IDENTIFIED BY <<password>>;
GRANT CREATE SESSION  , CONNECT TO num_recommender;
 
--Oracle internal dictionaries
GRANT SELECT_CATALOG_ROLE to num_recommender;
 
--grant select on specific table or complete set of table in schema(hr as sample schema) to run number recommendation.
BEGIN
  FOR R IN (SELECT owner, table_name FROM all_tables WHERE owner='<<schemaname>>') LOOP
     EXECUTE IMMEDIATE 'grant select on '||R.owner||'.'||R.table_name||' to num_recommender';
  END LOOP;
END;
/
```

#### Running Oracle NUMBER recommender
Based on the configuration set, we can run the script either with sqlplus or sql developer client as per our preference. We have two different oracle script based on its version and due to limitation on identifiers. choose as per underlying oracle version.

```
Oracle_Number_Recommender_GCP_11g.sql - Oracle 11g Version only.
Oracle_Number_Recommender_GCP.sql - Newer version from Oracle 12c onwards.
```
Running from sqlplus console with users having minimal grant. 

```
sqlplus <<username>>/<<password@<<SID>>
@Oracle_Number_Recommender_GCP.sql

cat oracle_number_recommender.csv 
```

![Oracle Sample number data type sample](/tools/numeric-family-recommender-oracle/images/sqlplus.jpeg)

Running from SQL Developer console with users having minimal grant.

![Oracle Sample number data type sample](/tools/numeric-family-recommender-oracle/images/sqldev.jpeg)

Post generating recommendations from the script, we should review it and integrate it with conversion tools like Ora2pg or use it to cross validate with target schema and change as needed. Recommended script give best result as per sampling percentage defined and need review before applying for target.
