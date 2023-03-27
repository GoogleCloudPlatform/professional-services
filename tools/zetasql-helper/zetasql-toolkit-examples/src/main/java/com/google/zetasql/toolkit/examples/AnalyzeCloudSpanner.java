/*
 * Copyright 2023 Google LLC All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.zetasql.toolkit.examples;

import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.toolkit.ZetaSQLToolkitAnalyzer;
import com.google.zetasql.toolkit.catalog.spanner.SpannerCatalog;
import com.google.zetasql.toolkit.options.SpannerLanguageOptions;

/**
 * Example showcasing the basic usage of the {@link SpannerCatalog}, used for analyzing queries
 * while using Cloud Spanner catalog semantics.
 */
public class AnalyzeCloudSpanner {

  public static void main(String[] args) {
    String query = "UPDATE MyTable SET column2 = 5 WHERE column1 = ''; SELECT * FROM MyTable;";

    // Step 1: Configure your Cloud Spanner project, instance and database
    String spannerProjectId = "projectId";
    String spannerInstanceName = "instanceName";
    String spannerDatabaseName = "databaseName";

    // Step 2: Create your SpannerCatalog
    // This will use application default credentials to create a Spanner DatabaseClient.
    // You can also provide your own DatabaseClient or a custom implementation
    // of SpannerResourceProvider.
    SpannerCatalog catalog =
        new SpannerCatalog(spannerProjectId, spannerInstanceName, spannerDatabaseName);

    // Step 3: Add your tables to the catalog
    // In this case, we add all the tables in the database.
    catalog.addAllTablesInDatabase();

    // Step 4: Define the LanguageOptions and AnalyzerOptions to configure the ZetaSQL analyzer
    //
    // LanguageOptions are ZetaSQL's way of customizing the SQL dialect the analyzer accepts.
    // This toolkit includes properly configured LanguageOptions for Cloud Spanner.
    //
    // AnalyzerOptions are ZetaSQL's way of customizing the analyzer itself
    // Usually, setting the LanguageOptions is the only configuration required; but they can
    // be customized for more advanced use cases.
    AnalyzerOptions options = new AnalyzerOptions();
    options.setLanguageOptions(SpannerLanguageOptions.get());

    // Step 5: Run the analysis
    ZetaSQLToolkitAnalyzer analyzer = new ZetaSQLToolkitAnalyzer(options);
    analyzer
        .analyzeStatements(query, catalog)
        .forEachRemaining(statement -> System.out.println(statement.debugString()));
  }
}
