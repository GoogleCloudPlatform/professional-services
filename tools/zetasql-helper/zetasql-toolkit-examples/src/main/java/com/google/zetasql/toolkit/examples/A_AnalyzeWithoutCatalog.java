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
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import java.util.Iterator;

/**
 * Example showcasing the basic example of how to use the ZetaSQL analyzer using this toolkit
 */
public class A_AnalyzeWithoutCatalog {

  private static AnalyzerOptions getAnalyzerOptions() {
    LanguageOptions languageOptions = new LanguageOptions()
        .enableMaximumLanguageFeatures();
    languageOptions.setSupportsAllStatementKinds();

    AnalyzerOptions analyzerOptions = new AnalyzerOptions();
    analyzerOptions.setLanguageOptions(languageOptions);

    return analyzerOptions;
  }

  public static void main(String[] args) {
    // SQL script to be analyzed, notice that is has a CREATE TEMP TABLE statement,
    // which this toolkit will make sure is persisted to the catalog.
    String query = "CREATE TEMP TABLE t AS (SELECT 1 AS column);\n"
        + "SELECT column from t;";

    // Step 1: Define the AnalyzerOptions to configure the ZetaSQL analyzer
    AnalyzerOptions options = getAnalyzerOptions();

    // Step 2: Use ZetaSQLHelper.analyzeStatements to get an iterator of the ResolvedStatements
    // that result from running the analyzer
    Iterator<ResolvedStatement> statementIterator = ZetaSQLToolkit.analyzeStatements(
        query, options
    );

    // Step 3: Consume the previous iterator and use the ResolvedStatements however you need
    statementIterator.forEachRemaining(statement -> System.out.println(statement.debugString()));
  }

}
