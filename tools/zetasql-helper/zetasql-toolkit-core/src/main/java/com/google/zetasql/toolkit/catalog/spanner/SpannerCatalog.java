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

package com.google.zetasql.toolkit.catalog.spanner;

import com.google.cloud.spanner.DatabaseClient;
import com.google.cloud.spanner.Spanner;
import com.google.zetasql.Analyzer;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import com.google.zetasql.toolkit.catalog.CatalogOperations;
import com.google.zetasql.toolkit.catalog.CatalogWrapper;
import com.google.zetasql.toolkit.catalog.bigquery.FunctionInfo;
import com.google.zetasql.toolkit.catalog.bigquery.ProcedureInfo;
import com.google.zetasql.toolkit.catalog.bigquery.TVFInfo;
import com.google.zetasql.toolkit.catalog.exceptions.CatalogResourceAlreadyExists;
import com.google.zetasql.toolkit.catalog.spanner.exceptions.InvalidSpannerTableName;
import com.google.zetasql.toolkit.options.SpannerLanguageOptions;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** {@link CatalogWrapper} implementation that follows Cloud Spanner semantics */
public class SpannerCatalog implements CatalogWrapper {

  private final String projectId;
  private final String instance;
  private final String database;
  private final SpannerResourceProvider spannerResourceProvider;
  private final SimpleCatalog catalog;

  /**
   * Constructs a SpannerCatalog that uses the provided {@link SpannerResourceProvider} for fetching
   * Spanner tables.
   *
   * @param projectId The Spanner project id
   * @param instance The Spanner instance name
   * @param database The Spanner database name
   * @param spannerResourceProvider The SpannerResourceProvider to use
   */
  SpannerCatalog(
      String projectId,
      String instance,
      String database,
      SpannerResourceProvider spannerResourceProvider) {
    this.projectId = projectId;
    this.instance = instance;
    this.database = database;
    this.spannerResourceProvider = spannerResourceProvider;
    this.catalog = new SimpleCatalog("catalog");
    this.catalog.addZetaSQLFunctionsAndTypes(
        new ZetaSQLBuiltinFunctionOptions(SpannerLanguageOptions.get()));
    SpannerBuiltIns.addToCatalog(this.catalog);
  }

  /**
   * Constructs a SpannerCatalog given a Spanner project, instance and database. It uses a {@link
   * DatabaseClient} with application default credentials to access Spanner.
   *
   * @param projectId The Spanner project id
   * @param instance The Spanner instance name
   * @param database The Spanner database name
   */
  public SpannerCatalog(String projectId, String instance, String database) {
    this(
        projectId,
        instance,
        database,
        SpannerResourceProviderImpl.buildDefault(projectId, instance, database));
  }

  /**
   * Constructs a SpannerCatalog that uses the provided {@link DatabaseClient} for accessing
   * Spanner.
   *
   * @param projectId The Spanner project id
   * @param instance The Spanner instance name
   * @param database The Spanner database name
   * @param spannerClient The Spanner client to use
   */
  public SpannerCatalog(String projectId, String instance, String database, Spanner spannerClient) {
    this(
        projectId,
        instance,
        database,
        SpannerResourceProviderImpl.build(projectId, instance, database, spannerClient));
  }

  /** Private constructor used for implementing {@link #copy()} */
  private SpannerCatalog(
      String projectId,
      String instance,
      String database,
      SpannerResourceProvider spannerResourceProvider,
      SimpleCatalog internalCatalog) {
    this.projectId = projectId;
    this.instance = instance;
    this.database = database;
    this.spannerResourceProvider = spannerResourceProvider;
    this.catalog = internalCatalog;
  }

  public String getProjectId() {
    return projectId;
  }

  public String getInstance() {
    return instance;
  }

  public String getDatabase() {
    return database;
  }

  /**
   * {@inheritDoc}
   *
   * @throws InvalidSpannerTableName if the table name is invalid for Spanner
   * @throws CatalogResourceAlreadyExists if the table already exists and CreateMode !=
   *     CREATE_OR_REPLACE
   */
  @Override
  public void register(SimpleTable table, CreateMode createMode, CreateScope createScope) {
    String tableName = table.getName();

    if (tableName.contains(".")) {
      throw new InvalidSpannerTableName(tableName);
    }

    CatalogOperations.createTableInCatalog(
        this.catalog,
        List.of(List.of(table.getName())),
        table.getName(),
        table.getColumnList(),
        createMode);
  }

  @Override
  public void register(FunctionInfo function, CreateMode createMode, CreateScope createScope) {
    throw new UnsupportedOperationException(
        "Cloud Spanner does not support user-defined functions");
  }

  @Override
  public void register(TVFInfo tvfInfo, CreateMode createMode, CreateScope createScope) {
    throw new UnsupportedOperationException(
        "Cloud Spanner does not support table valued functions");
  }

  @Override
  public void register(
      ProcedureInfo procedureInfo, CreateMode createMode, CreateScope createScope) {
    throw new UnsupportedOperationException("Cloud Spanner does not support procedures");
  }

  @Override
  public void removeTable(String table) {
    this.validateSpannerTableNames(List.of(table));
    CatalogOperations.deleteTableFromCatalog(this.catalog, List.of(List.of(table)));
  }

  @Override
  public void removeFunction(String function) {
    throw new UnsupportedOperationException(
        "Cloud Spanner does not support user-defined functions");
  }

  @Override
  public void removeTVF(String function) {
    throw new UnsupportedOperationException(
        "Cloud Spanner does not support table valued functions");
  }

  @Override
  public void removeProcedure(String procedure) {
    throw new UnsupportedOperationException("Cloud Spanner does not support procedures");
  }

  private void validateSpannerTableNames(List<String> tableNames) {
    tableNames.stream()
        .filter(tableName -> tableName.contains("."))
        .findAny()
        .ifPresent(
            invalidTableName -> {
              throw new InvalidSpannerTableName(invalidTableName);
            });
  }

  /**
   * {@inheritDoc}
   *
   * @throws InvalidSpannerTableName if any of the table names is invalid for Spanner
   */
  @Override
  public void addTables(List<String> tableNames) {
    this.validateSpannerTableNames(tableNames);

    this.spannerResourceProvider
        .getTables(tableNames)
        .forEach(
            table ->
                this.register(
                    table, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  public void addAllTablesInDatabase() {
    this.spannerResourceProvider
        .getAllTablesInDatabase()
        .forEach(
            table ->
                this.register(
                    table, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  /**
   * Adds all the tables used in the provided query to this catalog.
   *
   * <p>Uses Analyzer.extractTableNamesFromScript to extract the table names and later uses
   * this.addTables to add them.
   *
   * @param query The SQL query from which to get the tables that should be added to the catalog
   * @param options The ZetaSQL AnalyzerOptions to use when extracting the table names from the
   *     query
   */
  public void addAllTablesUsedInQuery(String query, AnalyzerOptions options) {
    Set<String> tables =
        Analyzer.extractTableNamesFromScript(query, options).stream()
            .map(tablePath -> String.join(".", tablePath))
            .collect(Collectors.toSet());
    this.addTables(List.copyOf(tables));
  }

  @Override
  public void addFunctions(List<String> functions) {
    throw new UnsupportedOperationException(
        "Cloud Spanner does not support user-defined functions");
  }

  @Override
  public void addTVFs(List<String> functions) {
    throw new UnsupportedOperationException(
        "Cloud Spanner does not support table valued functions");
  }

  @Override
  public void addProcedures(List<String> procedures) {
    throw new UnsupportedOperationException("Cloud Spanner does not support procedures");
  }

  @Override
  public SpannerCatalog copy() {
    return new SpannerCatalog(
        this.projectId,
        this.instance,
        this.database,
        this.spannerResourceProvider,
        CatalogOperations.copyCatalog(this.catalog));
  }

  @Override
  public SimpleCatalog getZetaSQLCatalog() {
    return this.catalog;
  }
}
