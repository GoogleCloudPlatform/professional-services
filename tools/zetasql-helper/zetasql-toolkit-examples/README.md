# ZetaSQL Toolkit examples

* [Analyze queries without an existing catalog](src/main/java/com/google/zetasql/toolkit/examples/AnalyzeWithoutCatalog.java)
* [Analyze BigQuery queries](src/main/java/com/google/zetasql/toolkit/examples/AnalyzeBigQuery.java)
* [Add resources to the BigQueryCatalog](src/main/java/com/google/zetasql/toolkit/examples/AddResourcesToBigQueryCatalog.java)
* [Analyze Cloud Spanner queries](src/main/java/com/google/zetasql/toolkit/examples/AnalyzeCloudSpanner.java)
* [Add resources to the SpannerCatalog](src/main/java/com/google/zetasql/toolkit/examples/AddResourcesToSpannerCatalog.java)
* [Add tables used in a query to the catalog](src/main/java/com/google/zetasql/toolkit/examples/LoadTablesUsedInQuery.java)
* [Analyze CREATE statements](src/main/java/com/google/zetasql/toolkit/examples/AnalyzingCreateStatements.java)

### Packaging examples into containers

You can package an example into a container
using [Jib](https://cloud.google.com/java/getting-started/jib)
by running the following command on the [root project directory](..).

`mvn clean packge jib:build -Dcontainer.mainClass=MAIN_CLASS`

Example:

`mvn package jib:dockerBuild -Dcontainer.mainClass=com.google.zetasql.toolkit.examples.AnalyzeWithoutCatalog`
