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
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import com.google.zetasql.toolkit.ZetaSQLToolkitAnalyzer;
import com.google.zetasql.toolkit.catalog.bigquery.BigQueryCatalog;
import com.google.zetasql.toolkit.options.BigQueryLanguageOptions;
import java.util.Iterator;

/**
 * Example showcasing the types of create statements this toolkit can transparently handle while
 * performing analysis
 */
public class AnalyzingCreateStatements {

  public static void main(String[] args) {
    String query =
        "CREATE TEMP TABLE t AS (SELECT 1 AS column UNION ALL SELECT 2 AS column);\n"
            + "CREATE TEMP VIEW v AS (SELECT 2 AS column);\n"
            + "CREATE FUNCTION `dataset.f`(x INT64) AS ((x * 2));\n"
            + "CREATE TABLE FUNCTION `dataset.tvf`(x INT64) AS (SELECT * FROM t WHERE column = x);\n"
            + "SELECT `dataset.f`(a.column) from `dataset.tvf`(2) AS a INNER JOIN v USING (column);"
            + "CREATE PROCEDURE `dataset.procedure_name`()\nBEGIN\n\nEND;\n"
            + "CALL `dataset.procedure_name`();";

    BigQueryCatalog catalog = new BigQueryCatalog("bigquery-public-data");

    AnalyzerOptions options = new AnalyzerOptions();
    options.setLanguageOptions(BigQueryLanguageOptions.get());

    ZetaSQLToolkitAnalyzer analyzer = new ZetaSQLToolkitAnalyzer(options);
    Iterator<ResolvedStatement> statementIterator = analyzer.analyzeStatements(query, catalog);

    statementIterator.forEachRemaining(statement -> System.out.println(statement.debugString()));
  }
}
