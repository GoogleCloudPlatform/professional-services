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
import com.google.zetasql.toolkit.validation.ShouldNotUseSelfJoinsVisitor;
import com.google.zetasql.toolkit.validation.StatementValidator;
import com.google.zetasql.toolkit.validation.ValidatingVisitor;
import com.google.zetasql.toolkit.validation.ValidationError;
import java.util.Iterator;
import java.util.List;

/**
 * Showcases how to use validations when analyzing BigQuery queries
 *
 * <p>Validations are a simple way of running checks against ResolvedStatements produced by the
 * analyzer.
 */
public class AnalyzeAndValidate {

  public static void main(String[] args) {
    String query =
        "SELECT * FROM `bigquery-public-data.samples.wikipedia` t1"
            + "INNER JOIN `bigquery-public-data.samples.wikipedia` t2 USING (title);";

    // Step 1: Create a BigQueryCatalog
    BigQueryCatalog catalog = new BigQueryCatalog("bigquery-public-data");

    // Step 2: Define the LanguageOptions and AnalyzerOptions to configure the ZetaSQL analyzer
    AnalyzerOptions options = new AnalyzerOptions();
    options.setLanguageOptions(BigQueryLanguageOptions.get());

    // Step 3: Add tables to the catalog before analyzing
    catalog.addAllTablesUsedInQuery(query, options);

    // Step 4: Use the ZetaSQLToolkitAnalyzer to get an iterator of the ResolvedStatements
    // that result from running the analysis
    ZetaSQLToolkitAnalyzer analyzer = new ZetaSQLToolkitAnalyzer(options);
    Iterator<ResolvedStatement> statementIterator = analyzer.analyzeStatements(query, catalog);

    // Step 5: Apply validations to the analyzed statements

    // Validations are implemented as subclasses of ValidatingVisitor.
    // This toolkit includes the example ShouldNotUseSelfJoinsVisitor, which fails if the query
    // performs any
    // self-joins.
    List<ValidatingVisitor> validations = List.of(new ShouldNotUseSelfJoinsVisitor());

    // Create a statement validator and use validator.validateStatements to consume the statement
    // iterator while applying the validations
    StatementValidator validator = new StatementValidator();

    try {
      validator.validateStatements(statementIterator, validations);
      System.out.println("All validations succeeded!");
    } catch (ValidationError error) {
      System.out.println(error.getMessage());
    }
  }
}
