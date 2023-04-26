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
import com.google.zetasql.toolkit.usage.UsageTracker;
import com.google.zetasql.toolkit.usage.UsageTrackerImpl;
import java.util.Iterator;
import java.util.Optional;

/**
 * Primary class exposed by the ZetaSQL Toolkit to perform SQL analysis.
 *
 * <p>It exposes methods to analyze statements using an empty catalog, an existing {@link
 * SimpleCatalog} or a {@link CatalogWrapper} implementation (such as the {@link BigQueryCatalog} or
 * the {@link SpannerCatalog}).
 *
 * <p>When analyzing statements that create resources (e.g. a CREATE TEMP TABLE statement), this
 * class will also persist those resources to the catalog. This allows it to transparently support
 * SQL scripts that, for example, create a temp table and later query said temp table. This feature
 * supports Tables, Views, Functions, Table Valued Functions and Procedures.
 */
public class ZetaSQLToolkitAnalyzer {

  private final AnalyzerOptions analyzerOptions;
  private final UsageTracker usageTracker;

  /**
   * Constructs a ZetaSQLToolkitAnalyzer using the provided {@link AnalyzerOptions}
   *
   * @param analyzerOptions The AnalyzerOptions that should be used when performing analysis
   */
  public ZetaSQLToolkitAnalyzer(AnalyzerOptions analyzerOptions) {
    this(analyzerOptions, new UsageTrackerImpl());
  }

  /**
   * Constructs a ZetaSQLToolkitAnalyzer using the provided {@link AnalyzerOptions} and {@link
   * UsageTracker}.
   *
   * <p>Package-private, only used internally and for testing.
   *
   * @param analyzerOptions The AnalyzerOptions that should be used when performing analysis
   * @param usageTracker The UsageTracker used for tracking tool usage
   */
  ZetaSQLToolkitAnalyzer(AnalyzerOptions analyzerOptions, UsageTracker usageTracker) {
    this.analyzerOptions = analyzerOptions;
    this.usageTracker = usageTracker;
  }

  /**
   * Analyze a SQL query or script, starting with an empty catalog.
   *
   * <p>This method uses the {@link BasicCatalogWrapper} for maintaining the catalog. To follow the
   * semantics of a particular SQL engine (e.g. BigQuery or Spanner),
   *
   * @see #analyzeStatements(String, CatalogWrapper).
   * @param query The SQL query or script to analyze
   * @return An iterator of the resulting {@link ResolvedStatement}s
   */
  public Iterator<ResolvedStatement> analyzeStatements(String query) {
    return this.analyzeStatements(query, new BasicCatalogWrapper());
  }

  /**
   * Analyze a SQL query or script, using the provided {@link CatalogWrapper} to manage the catalog.
   * Creates a copy of the catalog before analyzing to avoid mutating the provided catalog.
   *
   * @see #analyzeStatements(String, CatalogWrapper, boolean)
   * @param query The SQL query or script to analyze
   * @param catalog The CatalogWrapper implementation to use when managing the catalog
   * @return An iterator of the resulting {@link ResolvedStatement}s
   */
  public Iterator<ResolvedStatement> analyzeStatements(String query, CatalogWrapper catalog) {
    return this.analyzeStatements(query, catalog, false);
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
   * @param catalog The CatalogWrapper implementation to use when managing the catalog
   * @param inPlace Whether to apply catalog mutations in place. If true, catalog mutations from
   *     CREATE or DROP statements are applied to the provided catalog. If false, the provided
   *     catalog is copied and the copy is used.
   * @return An iterator of the resulting {@link ResolvedStatement}s
   */
  public Iterator<ResolvedStatement> analyzeStatements(
      String query, CatalogWrapper catalog, boolean inPlace) {
    this.usageTracker.trackUsage();

    CatalogWrapper catalogForAnalysis = inPlace ? catalog : catalog.copy();

    ParseResumeLocation parseResumeLocation = new ParseResumeLocation(query);
    CatalogUpdaterVisitor catalogUpdaterVisitor = new CatalogUpdaterVisitor(catalogForAnalysis);

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
                parseResumeLocation, analyzerOptions, catalogForAnalysis.getZetaSQLCatalog());

        this.previous = Optional.of(statement);

        return statement;
      }
    };
  }
}
