package com.google.zetasql.toolkit.examples;

import com.google.zetasql.toolkit.ZetaSQLToolkit;
import com.google.zetasql.toolkit.catalog.spanner.SpannerCatalog;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.toolkit.options.SpannerLanguageOptions;

/**
 * Example showcasing the basic usage of the {@link SpannerCatalog}, used for
 * analyzing queries while using Cloud Spanner catalog semantics.
 */
public class F_AnalyzeCloudSpanner {

  public static void main(String[] args) {
    String query = "SELECT * FROM MyTable;";

    // Step 1: Configure your Cloud Spanner project, instance and database
    String spannerProjectId = "projectId";
    String spannerInstanceName = "instanceName";
    String spannerDatabaseName = "databaseName";

    // Step 2: Create your SpannerCatalog
    // This will use application default credentials to create a Spanner DatabaseClient.
    // You can also provide your own DatabaseClient or a custom implementation
    // of SpannerResourceProvider.
    SpannerCatalog catalog = new SpannerCatalog(
        spannerProjectId, spannerInstanceName, spannerDatabaseName
    );

    // Step 3: Add your tables to the catalog
    // In this case, we add all the tables in the database.
    catalog.addAllTablesInDatabase();

    // Step 4: Set up the analyzer options
    AnalyzerOptions options = new AnalyzerOptions();
    options.setLanguageOptions(SpannerLanguageOptions.get());

    // Step 5: Run the analysis
    ZetaSQLToolkit
        .analyzeStatements(query, options, catalog)
        .forEachRemaining(statement -> System.out.println(statement.debugString()));
  }

}
