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

import com.google.zetasql.toolkit.ZetaSQLToolkit;
import com.google.zetasql.toolkit.catalog.bigquery.BigQueryCatalog;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import com.google.zetasql.toolkit.options.BigQueryLanguageOptions;
import java.util.Iterator;

/**
 * Example showcasing how we can add to the catalog only the tables that are used in a query,
 * to have the minimum amount of tables necessary loaded in the catalog
 */
public class C_LoadTablesUsedInQuery {

  public static void main(String[] args) {
    String query =
        "INSERT INTO `bigquery-public-data.samples.wikipedia` (title) VALUES ('random title');\n"
            + "SELECT * FROM `bigquery-public-data.samples.wikipedia` WHERE title = 'random title';";

    BigQueryCatalog catalog = new BigQueryCatalog("bigquery-public-data");

    AnalyzerOptions options = new AnalyzerOptions();
    options.setLanguageOptions(BigQueryLanguageOptions.get());

    // Will only add bigquery-public-data.samples.wikipedia to the catalog
    catalog.addAllTablesUsedInQuery(query, options);

    Iterator<ResolvedStatement> statementIterator = ZetaSQLToolkit.analyzeStatements(
        query, options, catalog
    );

    statementIterator.forEachRemaining(statement -> System.out.println(statement.debugString()));
  }

}
