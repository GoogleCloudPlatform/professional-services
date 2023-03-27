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
import com.google.zetasql.toolkit.validation.CannotRecreateExistingTableVisitor;
import com.google.zetasql.toolkit.validation.StatementValidator;
import com.google.zetasql.toolkit.validation.ValidatingVisitor;
import com.google.zetasql.toolkit.validation.ValidationError;

import java.util.Iterator;
import java.util.List;

/** Showcases how to use validations */
public class AnalyzeAndValidate {

  public static void main(String[] args) {
    String query =
            "CREATE TABLE `bigquery-public-data.samples.wikipedia` AS SELECT 1 AS column;\n"
                    + "SELECT column FROM `bigquery-public-data.samples.wikipedia`;";

    BigQueryCatalog catalog = new BigQueryCatalog("bigquery-public-data");

    AnalyzerOptions options = new AnalyzerOptions();
    options.setLanguageOptions(BigQueryLanguageOptions.get());

    catalog.addAllTablesUsedInQuery(query, options);

    ZetaSQLToolkitAnalyzer analyzer = new ZetaSQLToolkitAnalyzer(options);

    Iterator<ResolvedStatement> statementIterator = analyzer.analyzeStatements(query, catalog);

    List<ValidatingVisitor> validations =
            List.of(new CannotRecreateExistingTableVisitor(catalog.getZetaSQLCatalog()));

    StatementValidator validator = new StatementValidator();

    try {
      validator.validateStatements(statementIterator, validations);
      System.out.println("All validations succeeded!");
    } catch (ValidationError error) {
      System.out.println(error.getMessage());
    }
  }
}
