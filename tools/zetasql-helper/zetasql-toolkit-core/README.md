# ZetaSQL Toolkit

The ZetaSQL Toolkit is a library that helps users use
[ZetaSQL](https://github.com/google/zetasql) Java API to perform SQL analysis
for multiple query engines.

This toolkit offers built-in support for:

* Building catalogs using BigQuery and Cloud Spanner resources.
  Supports tables, views, functions, table-valued functions and procedures.
* Analyzing queries and scripts using the BigQuery or Cloud Spanner feature
  sets.
* Analyzing scripts that mutate the catalog during execution, for example,
  through a `CREATE TABLE` statement.

## Quickstart for BigQuery

When analyzing queries using BigQuery semantics, you need to:

1. Create a `BigQueryCatalog` and add resources to it. The `BigQueryCatalog`
   supports tables, views, functions, table-valued functions and procedures.
2. Configure the ZetaSQL `AnalyzerOptions` using the BigQuery feature set.
3. Use `ZetaSQLToolkit.analyzeStatements()` to perform analysis.

### BigQuery example

``` java
String query =
    "INSERT INTO `bigquery-public-data.samples.wikipedia` (title) VALUES ('random title');\n"
    + "SELECT title, language FROM `bigquery-public-data.samples.wikipedia` WHERE title = 'random title';";

// Create a BigQueryCatalog
// By default, it will use the BigQuery API with application-default credentials
// to fetch BigQuery resources.
BigQueryCatalog catalog = new BigQueryCatalog(/*bqProjectId=*/"bigquery-public-data");

// Add resources to the catalog
// After a resource is added, it will be available when ZetaSQL perform analysis
catalog.addTable("bigquery-public-data.samples.wikipedia");

// Configure the analyzer options using the BigQuery feature set
AnalyzerOptions options = new AnalyzerOptions();
options.setLanguageOptions(BigQueryLanguageOptions.get());

// Use the ZetaSQLToolkitAnalyzer to run the analyzer
// It results an iterator over the resulting ResolvedStatements
ZetaSQLToolkitAnalyzer analyzer = new ZetaSQLToolkitAnalyzer(options);
Iterator<ResolvedStatement> statementIterator = analyzer.analyzeStatements(query, catalog);

// Use the resulting ResolvedStatements
statementIterator.forEachRemaining(
    statement -> System.out.println(statement.debugString())
);
```

### BigQuery example output

```
InsertStmt
+-table_scan=
| +-TableScan(table=bigquery-public-data.samples.wikipedia, ...)
+-insert_column_list=[bigquery-public-data.samples.wikipedia.title#1]
+-row_list=
| +-InsertRow
|   +-value_list=
|     +-DMLValue
|       +-value=
|         +-Literal(type=STRING, value=string_value: "random title")
+-column_access_list=...

QueryStmt
+-output_column_list=
| +-bigquery-public-data.samples.wikipedia.title#1 AS `title` [STRING]
| +-bigquery-public-data.samples.wikipedia.language#3 AS `language` [STRING]
+-query=
  +-ProjectScan
    +-column_list=bigquery-public-data.samples.wikipedia.[title#1, language#3]
    +-input_scan=
      +-FilterScan
        +-column_list=...
        +-input_scan=
        | +-TableScan(table=bigquery-public-data.samples.wikipedia, ...)
        +-filter_expr=
          +-FunctionCall(ZetaSQL:$equal(STRING, STRING) -> BOOL)
            +-ColumnRef(type=STRING, column=bigquery-public-data.samples.wikipedia.title#1)
            +-Literal(type=STRING, value=string_value: "random title")
```

## Quickstart for Cloud Spanner

Similarly, when analyzing queries using Spanner semantics, you need to:

1. Create a `SpannerCatalog` and add resources to it. The `SpannerCatalog`
   supports tables and views.
2. Configure the ZetaSQL `AnalyzerOptions` using the Spanner feature set.
3. Use `ZetaSQLToolkit.analyzeStatements()` to perform analysis.

### Cloud Spanner example

``` java
String query = "UPDATE MyTable SET column2 = 5 WHERE column1 = ''; SELECT * FROM MyTable;";

// Configure your Cloud Spanner project, instance and database
String spannerProjectId = "projectId";
String spannerInstanceName = "instanceName";
String spannerDatabaseName = "databaseName";

// Create your SpannerCatalog
// By default, it will use the Spanner database client with application-default 
// credentials to fetch resources.
SpannerCatalog catalog = new SpannerCatalog(
    spannerProjectId, spannerInstanceName, spannerDatabaseName
);

// Add your tables to the catalog
// After a resource is added, it will be available when ZetaSQL perform analysis
catalog.addAllTablesInDatabase();

// Configure the analyzer options
AnalyzerOptions options = new AnalyzerOptions();
options.setLanguageOptions(SpannerLanguageOptions.get());

// Use the ZetaSQLToolkitAnalyzer to run the analyzer
// It results an iterator over the resulting ResolvedStatements
ZetaSQLToolkitAnalyzer analyzer = new ZetaSQLToolkitAnalyzer(options);
Iterator<ResolvedStatement> statementIterator = analyzer.analyzeStatements(query, catalog);


// Use the resulting ResolvedStatements
statementIterator.forEachRemaining(
    statement -> System.out.println(statement.debugString())
);
```

### Cloud Spanner example output

```
UpdateStmt
+-table_scan=
| +-TableScan(table=MyTable, column_list=MyTable.[column1#1, column2#2])
+-column_access_list=READ,WRITE
+-where_expr=
| +-FunctionCall(ZetaSQL:$equal(STRING, STRING) -> BOOL)
|   +-ColumnRef(type=STRING, column=MyTable.column1#1)
|   +-Literal(type=STRING, value=string_value: "")
+-update_item_list=
  +-UpdateItem
    +-target=
    | +-ColumnRef(type=INT64, column=MyTable.column2#2)
    +-set_value=
      +-DMLValue
        +-value=
          +-Literal(type=INT64, value=int64_value: 5)

QueryStmt
+-output_column_list=
| +-MyTable.column1#1 AS `column1` [STRING]
| +-MyTable.column2#2 AS `column2` [INT64]
+-query=
  +-ProjectScan
    +-column_list=MyTable.[column1#1, column2#2]
    +-input_scan=
      +-TableScan(table=MyTable, column_list=MyTable.[column1#1, column2#2])
```

## Comprehensive examples

See a list of comprehensive usage examples [here](../zetasql-toolkit-examples).

## Support Disclaimer

This is not an officially supported Google product.