# BigQuery SQL Analyzer

This project is meant to be use as a starting point for developers interested in
analyzing BigQuery SQL with [ZetaSQL](https://github.com/google/zetasql).

User should be able to base themselves of this implementation as it deals with
most of the main tasks related to getting started with ZetaSQL, such as:

* [building a catalog](./src/main/java/com/pso/bigquery/optimization/BuildCatalogForProjectAndAnalyzeJoins.java)
* [creating a visitor](./src/main/java/com/pso/bigquery/optimization/analysis/visitors/ExtractScansVisitor.java)
* [managing dependencies](./pom.xml)

## What is ZetaSQL

[ZetaSQL](https://github.com/google/zetasql) is a Google-provided framework for
parsing and analyzing SQL and is, in itself, a subset of Google's internal SQL
parsing tools.

ZetaSQL defines a language (grammar, types, data model, and semantics) and a
parser and analyzer for SQL. It allows, given a SQL query and a catalog, to *
analyze* a given query. Analyzing query gives yields it's AST
(Abstract Syntax Tree), which represents the parsed contents of the query.

In the AST great deal of information is available from a query; such as the
tables it references, the joins it applies, the calculation it does, etc.

## The ZetaSQL Catalog

Many of ZetaSQL's most powerful functionalities require a catalog: a ZetaSQL
component in which BQ table definitions must be loaded. Populating a catalog
with all necessary tables might be cumbersome and time-consuming.

This project includes classes and logic necessary to build a Catalog.

## Sample code

* [BuildCatalogForProjectAndAnalyzeJoins](./src/main/java/com/pso/bigquery/optimization/BuildCatalogForProjectAndAnalyzeJoins.java):
  this sample code will add to the catalog all the tables from a given project.
  It will then analyze a BigQuery SQL and output a scan of the joins.
* [BuildCatalogBasedOnQueryAndAnalyzeJoins](./src/main/java/com/pso/bigquery/optimization/BuildCatalogBasedOnQueryAndAnalyzeJoins.java):
  this sample code will analyze a BigQuery SQL and output a scan of the joins.
  It will add to the Catalog only the tables referenced by the query.

### Sample join scan

Both examples above follow different approaches to populating the catalog. Both
will yield the same output

Sample query:
```
SELECT
  t1.col1
FROM 
  `MY_PROJECT.MY_DATASET.test_table_1` t1
LEFT JOIN
  `MY_PROJECT.MY_DATASET.test_table_2` t2 ON t1.unique_key=t2.unique_key
WHERE
 t1.col2 is not null
 AND t2.col2 is not null;
```

Sample output

```
{tableScans=[{joinColumns=[unique_key], table=MY_PROJECT.MY_DATASET.test_table_1, filterColumns=[status], joinType=}, {joinColumns=[unique_key], table=MY_PROJECT.MY_DATASET.test_table_2, filterColumns=[status], joinType=LEFT}]}
```

## ZetaSQL AST example

For this simple BigQuery query job:

``` sql
CREATE OR REPLACE TEMP TABLE my_table AS (
    SELECT 1 AS column
);

SELECT
    column + 1
FROM my_table WHERE column = 1;
```

This is a human-readable representation of what the AST looks like:

```
CreateTableAsSelectStmt
+-name_path=`my_table`
+-create_scope=CREATE_TEMP
+-create_mode=CREATE_OR_REPLACE
+-column_definition_list=
| +-ColumnDefinition(name='column', type=INT64, column=my_table.column#2)
+-output_column_list=
| +-$create_as.column#1 AS `column` [INT64]
+-query=
  +-ProjectScan
    +-column_list=[$create_as.column#1]
    +-expr_list=
    | +-column#1 := Literal(type=INT64, value=int64_value: 1)
    +-input_scan=
      +-SingleRowScan

QueryStmt
+-output_column_list=
| +-$query.computed_column#2 AS `computed_column` [INT64]
+-query=
  +-ProjectScan
    +-column_list=[$query.computed_column#2]
    +-expr_list=
    | +-computed_column#2 :=
    |   +-FunctionCall(ZetaSQL:$add(INT64, INT64) -> INT64)
    |     +-ColumnRef(type=INT64, column=my_table.column#1)
    |     +-Literal(type=INT64, value=int64_value: 1)
    +-input_scan=
      +-FilterScan
        +-column_list=[my_table.column#1]
        +-input_scan=
        | +-TableScan(column_list=[my_table.column#1], table=my_table, column_index_list=[0])
        +-filter_expr=
          +-FunctionCall(ZetaSQL:$equal(INT64, INT64) -> BOOL)
            +-ColumnRef(type=INT64, column=my_table.column#1)
            +-Literal(type=INT64, value=int64_value: 1)
```

As you can see, after analyzing a query, we can use its AST to understand the
SQL behind the query. We can extract any interesting information about the query
we want from it.

## Prerequisites

The tool requires the user to be authenticated to GCP using Application Default
Credentials, either through a service account or user credentials. This
principal needs to have the following permissions:

* Must run on Linux
* `bigquery.tables.get` permissions on the tables or views that are used by the
  analyzed queries
    * If the tool runs into a table it can't get the metadata for, the analysis
      will fail
    * See
      the [What if the query can not be parsed](#what-if-the-query-can-not-be-parsed)
      section

## Limitations

* ZetaSQL needs to know the schema of referenced tables when analysing a
  statement. The tool handles it by getting referenced tables' information using
  the BigQuery API client. This means, the principal running this tool needs
  the `bigquery.tables.get` permission in the projects we want to analyse.
* Authorization errors while trying to parse a job will lead to the tool
  assuming the job cannot be parsed and defaulting to the regex approach for
  generating pattern ids.
* ZetaSQL does not support scripting constructs. Any query job that uses these
  (e.g. `DECLARE`, `LOOP`, etc), will fail to parse and will default to the
  regex approach for generating pattern ids.

## Project Structure

This project was developed in Java using ZetaSQL's native Java bindings. It's
structured as a Maven project with the top-level package for the implementation
being `pso.bigquery.optimization`

``` bash
.
└── pso
  └── bigquery
    └── optimization      # Top-level Java package for the tool
      ├── analysis        # Package implementing logic for analyzing a BigQuery SQL and extracting information from it
      ├── catalog         # Package implementing the necessary logic to maintain a ZetaSQL catalog based on BigQuery
      ├── exceptions      # Package containing domain exceptions for the project
      ├── BuildCatalogBasedOnQueryAndAnalyzeJoins.java        # Sample code that scans a query and builds catalog on the go by adding tables referenced in the query
      └── BuildCatalogForProjectAndAnalyzeJoins.java          # Sample code that scans a query and builds catalog by adding all the tables in a given project 
```
