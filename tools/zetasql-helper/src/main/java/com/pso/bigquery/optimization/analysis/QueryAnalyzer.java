/*
 * Copyright 2022 Google LLC All Rights Reserved
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
package com.pso.bigquery.optimization.analysis;

import com.google.cloud.bigquery.Table;
import com.google.gson.JsonElement;
import com.google.zetasql.Analyzer;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.ParseResumeLocation;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import com.pso.bigquery.optimization.analysis.visitors.CreateJsonQueryStructureVisitor;
import com.pso.bigquery.optimization.analysis.visitors.ExtractScansVisitor;
import com.pso.bigquery.optimization.analysis.visitors.ExtractScansVisitor.QueryScan;
import com.pso.bigquery.optimization.catalog.BigQuerySchemaConverter;
import com.pso.bigquery.optimization.catalog.BigQueryTableParser;
import com.pso.bigquery.optimization.catalog.BigQueryTableService;
import com.pso.bigquery.optimization.catalog.CatalogUtils;
import io.vavr.collection.Seq;
import io.vavr.control.Try;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;

/**
 * The QueryAnalyzer parses a BigQuery job using ZetaSQL and extracts information from it. It
 * returns a QueryAnalysisResult with findings if the job is successfully parsed with ZetaSQL.
 */
public class QueryAnalyzer {

  private final BigQueryTableService bqTableService;

  public QueryAnalyzer() {
    this(null);
  }

  public QueryAnalyzer(BigQueryTableService bqTableService) {
    this.bqTableService = bqTableService;
  }

  public static boolean hasNextStatement(ParseResumeLocation parseResumeLocation) {
    return parseResumeLocation.getInput().getBytes().length > parseResumeLocation.getBytePosition();
  }

  public AnalyzerOptions getAnalyzerOptions() {
    LanguageOptions languageOptions = new LanguageOptions().enableMaximumLanguageFeatures();
    languageOptions.setSupportsAllStatementKinds();

    AnalyzerOptions analyzerOptions = new AnalyzerOptions();
    analyzerOptions.setLanguageOptions(languageOptions);
    analyzerOptions.setCreateNewColumnForEachProjectedOutput(true);
    return analyzerOptions;
  }

  private Try<List<Table>> extractReferencedTables(String projectId, String query) {
    return Try.of(
            () ->
                Analyzer.extractTableNamesFromScript(query, this.getAnalyzerOptions()).stream()
                    .map(tablePath -> String.join(".", tablePath))
                    .distinct()
                    .filter(BigQueryTableParser::isValidTableId)
                    .map(tableId -> this.bqTableService.getBQTable(projectId, tableId))
                    .collect(Collectors.toList()))
        .flatMap(Try::sequence)
        .map(Seq::asJava);
  }

  // Extracts the reference tables from a SQL query and adds them to a catalog
  // Remember that, in order to analyze a query, all its referenced tables need
  // to exist in the catalog.
  private Try<Void> updateCatalogFromSQL(String projectId, String query, SimpleCatalog catalog) {
    Try<List<Table>> tryReferencedTables = this.extractReferencedTables(projectId, query);

    if (tryReferencedTables.isFailure()) {
      return Try.failure(tryReferencedTables.getCause());
    }

    for (Table table : tryReferencedTables.get()) {
      CatalogUtils.createTableInCatalog(
          catalog,
          table.getTableId().getProject(),
          table.getTableId().getDataset(),
          table.getTableId().getTable(),
          BigQuerySchemaConverter.extractTableColumns(table));
    }

    return Try.success(null);
  }

  public Try<JsonElement> parseQueryIntoJsonObject(String projectId, String query) {
    SimpleCatalog catalog = CatalogUtils.createEmptyCatalog();

    ParseResumeLocation parseResumeLocation = new ParseResumeLocation(query);
    CreateJsonQueryStructureVisitor visitor =
        new CreateJsonQueryStructureVisitor(projectId, catalog);

    Try<Void> tryUpdateCatalog = this.updateCatalogFromSQL(projectId, query, catalog);

    if (tryUpdateCatalog.isFailure()) {
      return Try.failure(tryUpdateCatalog.getCause());
    }

    AnalyzerOptions analyzerOpts = this.getAnalyzerOptions();
    while (hasNextStatement(parseResumeLocation)) {
      Try<ResolvedStatement> tryParsedStatement =
          Try.of(() -> Analyzer.analyzeNextStatement(parseResumeLocation, analyzerOpts, catalog));

      if (tryParsedStatement.isFailure()) {
        return Try.failure(tryParsedStatement.getCause());
      }

      tryParsedStatement.forEach(
          resolvedStatement -> {
            visitor.prepareVisit();
            resolvedStatement.accept(visitor);
            visitor.finishVisit();
          });
    }

    return Try.success(visitor.getResult());
  }

  public Try<List<QueryScan>> getScansInQuery(
      String projectId, String query, SimpleCatalog catalog, CatalogScope catalogScope) {

    // SimpleCatalog catalog = CatalogUtils.createEmptyCatalog();

    ParseResumeLocation parseResumeLocation = new ParseResumeLocation(query);
    ExtractScansVisitor visitor = new ExtractScansVisitor(projectId, catalog);

    if (catalogScope.equals(CatalogScope.QUERY)) {
      Try<Void> tryUpdateCatalog = this.updateCatalogFromSQL(projectId, query, catalog);
      if (tryUpdateCatalog.isFailure()) {
        return Try.failure(tryUpdateCatalog.getCause());
      }
    }

    AnalyzerOptions analyzerOpts = this.getAnalyzerOptions();
    while (hasNextStatement(parseResumeLocation)) {
      Try<ResolvedStatement> tryParsedStatement =
          Try.of(() -> Analyzer.analyzeNextStatement(parseResumeLocation, analyzerOpts, catalog));

      if (tryParsedStatement.isFailure()) {
        return Try.failure(tryParsedStatement.getCause());
      }

      tryParsedStatement.forEach(
          resolvedStatement -> {
            resolvedStatement.accept(visitor);
          });
    }

    return Try.success(visitor.getResult());
  }

  private String removeBeginEndFromQuery(String query) {
    // Not ideal, but having redundant BEGIN and END statements
    // is a common pattern for and ZetaSQL does not support it.
    return StringUtils.removeStart(StringUtils.removeEnd(query.trim(), "END;"), "BEGIN");
  }

  /**
   * gives information whether the catalog has been populated for a PROJECT or if the analyzer
   * should populate it based on tables in the QUERY
   */
  public enum CatalogScope {
    PROJECT,
    QUERY
  }
}
