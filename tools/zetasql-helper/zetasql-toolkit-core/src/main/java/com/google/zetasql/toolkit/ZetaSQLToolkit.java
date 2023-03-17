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

package com.google.zetasql.toolkit;

import com.google.zetasql.Analyzer;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.ParseResumeLocation;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import com.google.zetasql.toolkit.catalog.CatalogWrapper;
import com.google.zetasql.toolkit.catalog.basic.BasicCatalogWrapper;
import com.google.zetasql.toolkit.catalog.bigquery.BigQueryCatalog;
import com.google.zetasql.toolkit.catalog.spanner.SpannerCatalog;
import com.google.zetasql.toolkit.validation.ValidatingVisitor;
import com.google.zetasql.toolkit.validation.ValidationError;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

/**
 * Primary class exposed by the ZetaSQL Toolkit to analyze and validate statements.
 *
 * <p>It exposes methods to analyze statements using an empty catalog, an existing {@link
 * SimpleCatalog} or a {@link CatalogWrapper} implementation (such as the {@link BigQueryCatalog} or
 * the {@link SpannerCatalog}).
 *
 * <p>When analyzing statements that create resources (e.g. a CREATE TEMP TABLE statement), this
 * class will also persist those resources to the catalog. This allows it to transparently support
 * SQL scripts that, for example, create a temp table and later query said temp table. This feature
 * supports Tables, Views, Functions, Table Valued Functions and Procedures.
 *
 * <p>Additionally, it exposes methods to validate {@link ResolvedStatement}s using {@link
 * ValidatingVisitor}s.
 */
public class ZetaSQLToolkit {

  private ZetaSQLToolkit() {}

  /**
   * Analyze a SQL query or script, starting with an empty catalog.
   *
   * <p>This method uses the {@link BasicCatalogWrapper} for maintaining the catalog. To follow the
   * semantics of a particular SQL engine (e.g. BigQuery or Spanner),
   *
   * @see #analyzeStatements(String, AnalyzerOptions, CatalogWrapper).
   * @param query The SQL query or script to analyze
   * @param options The {@link AnalyzerOptions} to use
   * @return An iterator of the resulting {@link ResolvedStatement}s
   */
  public static Iterator<ResolvedStatement> analyzeStatements(
      String query, AnalyzerOptions options) {
    return analyzeStatements(query, options, new BasicCatalogWrapper());
  }

  /**
   * Analyze a SQL query or script, using the provided {@link SimpleCatalog}.
   *
   * <p>This method uses the {@link BasicCatalogWrapper} for maintaining the catalog. To follow the
   * semantics of a particular SQL engine (e.g. BigQuery or Spanner),
   *
   * @see #analyzeStatements(String, AnalyzerOptions, CatalogWrapper).
   * @param query The SQL query or script to analyze
   * @param options The {@link AnalyzerOptions} to use
   * @param catalog The SimpleCatalog to use
   * @return An iterator of the resulting {@link ResolvedStatement}s
   */
  public static Iterator<ResolvedStatement> analyzeStatements(
      String query, AnalyzerOptions options, SimpleCatalog catalog) {
    return analyzeStatements(query, options, new BasicCatalogWrapper(catalog));
  }

  /**
   * Analyze a SQL query or script, using the provided {@link CatalogWrapper} to manage the catalog.
   *
   * <p>This toolkit includes two implementations, the {@link BigQueryCatalog} and the {@link
   * SpannerCatalog}; which can be used to run the analyzer following BigQuery or Spanner catalog
   * semantics respectively. For other use-cases, you can provide your own CatalogWrapper
   * implementation.
   *
   * @param query The SQL query or script to analyze
   * @param options The {@link AnalyzerOptions} to use
   * @param catalog The CatalogWrapper implementation to use when managing the catalog
   * @return An iterator of the resulting {@link ResolvedStatement}s
   */
  public static Iterator<ResolvedStatement> analyzeStatements(
      String query, AnalyzerOptions options, CatalogWrapper catalog) {
    ParseResumeLocation parseResumeLocation = new ParseResumeLocation(query);
    CatalogUpdaterVisitor catalogUpdaterVisitor = new CatalogUpdaterVisitor(catalog);

    return new Iterator<>() {

      private Optional<ResolvedStatement> previous = Optional.empty();

      private void applyCatalogMutation(ResolvedStatement statement) {
        statement.accept(catalogUpdaterVisitor);
      }

      @Override
      public boolean hasNext() {
        int inputLength = parseResumeLocation.getInput().getBytes().length;
        int currentPosition = parseResumeLocation.getBytePosition();
        return inputLength > currentPosition;
      }

      @Override
      public ResolvedStatement next() {
        this.previous.ifPresent(this::applyCatalogMutation);

        ResolvedStatement statement =
            Analyzer.analyzeNextStatement(
                parseResumeLocation, options, catalog.getZetaSQLCatalog());

        this.previous = Optional.of(statement);

        return statement;
      }
    };
  }

  /**
   * Applies a set of validations to the provided {@link ResolvedStatement}. Validations are
   * implemented using {@link ValidatingVisitor}s.
   *
   * @param statement The ResolvedStatement to validate
   * @param validations The list of validations tp apply
   * @throws ValidationError if any validations fail
   */
  public static void validateStatement(
      ResolvedStatement statement, List<ValidatingVisitor> validations) throws ValidationError {

    for (ValidatingVisitor validation : validations) {
      Optional<ValidationError> maybeError = validation.validate(statement);
      if (maybeError.isPresent()) {
        throw maybeError.get();
      }
    }
  }

  /**
   * Iterates the provided iterator of {@link ResolvedStatement}s and applied a set of validations
   * to each of them.
   *
   * @see #validateStatement(ResolvedStatement, List)
   * @param statementIterator The iterator of ResolvedStatements to validate
   * @param validations The list of validations tp apply
   * @throws ValidationError if any validations fail
   */
  public static void validateStatements(
      Iterator<ResolvedStatement> statementIterator, List<ValidatingVisitor> validations)
      throws ValidationError {

    while (statementIterator.hasNext()) {
      validateStatement(statementIterator.next(), validations);
    }
  }
}
