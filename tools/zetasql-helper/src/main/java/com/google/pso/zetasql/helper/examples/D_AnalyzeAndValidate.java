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

package com.google.pso.zetasql.helper.examples;

import com.google.pso.zetasql.helper.ZetaSQLHelper;
import com.google.pso.zetasql.helper.catalog.bigquery.BigQueryCatalog;
import com.google.pso.zetasql.helper.validation.CannotRecreateExistingTable;
import com.google.pso.zetasql.helper.validation.ValidatingVisitor;
import com.google.pso.zetasql.helper.validation.ValidationError;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import java.util.Iterator;
import java.util.List;

public class D_AnalyzeAndValidate {

  private static AnalyzerOptions getAnalyzerOptions() {
    LanguageOptions languageOptions = new LanguageOptions()
        .enableMaximumLanguageFeatures();
    languageOptions.setSupportsAllStatementKinds();

    AnalyzerOptions analyzerOptions = new AnalyzerOptions();
    analyzerOptions.setLanguageOptions(languageOptions);

    return analyzerOptions;
  }

  public static void main(String[] args) {
    String query =
        "CREATE TABLE `bigquery-public-data.samples.wikipedia` AS SELECT 1 AS column;\n"
        + "SELECT column FROM `bigquery-public-data.samples.wikipedia`;";
    AnalyzerOptions options = getAnalyzerOptions();

    BigQueryCatalog catalog = new BigQueryCatalog(
        "bigquery-public-data"
    );

    catalog.addAllTablesUsedInQuery(query, options);

    Iterator<ResolvedStatement> statementIterator = ZetaSQLHelper.analyzeStatements(
        query, options, catalog
    );

    List<ValidatingVisitor> validations = List.of(
        new CannotRecreateExistingTable(catalog.getZetaSQLCatalog())
    );

    try {
      ZetaSQLHelper.validateStatements(statementIterator, validations);
      System.out.println("All validations succeeded!");
    } catch (ValidationError error) {
      System.out.println(error.getMessage());
    }
  }

}
