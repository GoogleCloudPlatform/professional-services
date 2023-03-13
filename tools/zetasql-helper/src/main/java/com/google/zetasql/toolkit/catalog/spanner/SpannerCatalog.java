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
import com.google.zetasql.toolkit.catalog.CatalogOperations;
import com.google.zetasql.toolkit.catalog.CatalogWrapper;
import com.google.zetasql.toolkit.catalog.bigquery.ProcedureInfo;
import com.google.zetasql.toolkit.catalog.bigquery.TVFInfo;
import com.google.zetasql.toolkit.catalog.exceptions.CatalogResourceAlreadyExists;
import com.google.zetasql.toolkit.catalog.spanner.exceptions.InvalidSpannerTableName;
import com.google.zetasql.Function;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import java.util.List;

/**
 * {@link CatalogWrapper} implementation that follows Cloud Spanner semantics
 */
public class SpannerCatalog implements CatalogWrapper {

  private final String projectId;
  private final String instance;
  private final String database;
  private final SpannerResourceProvider spannerResourceProvider;
  private final SimpleCatalog catalog;

  /**
   * Constructs a SpannerCatalog given a Spanner project,
   * instance and database. It uses a {@link DatabaseClient} with
   * application default credentials to access Spanner.
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
        new SpannerResourceProviderImpl(projectId, instance, database)
    );
  }

  /**
   * Constructs a SpannerCatalog that uses the provided {@link DatabaseClient}
   * for accessing Spanner.
   *
   * @param projectId The Spanner project id
   * @param instance The Spanner instance name
   * @param database The Spanner database name
   * @param databaseClient The Spanner DatabaseClient to use
   */
  public SpannerCatalog(
      String projectId,
      String instance,
      String database,
      DatabaseClient databaseClient
  ) {
    this(
        projectId,
        instance,
        database,
        new SpannerResourceProviderImpl(databaseClient)
    );
  }

  /**
   * Constructs a SpannerCatalog that uses the provided
   * {@link SpannerResourceProvider} for fetching Spanner tables.
   *
   * @param projectId The Spanner project id
   * @param instance The Spanner instance name
   * @param database The Spanner database name
   * @param spannerResourceProvider The SpannerResourceProvider to use
   */
  public SpannerCatalog(
      String projectId,
      String instance,
      String database,
      SpannerResourceProvider spannerResourceProvider
  ) {
    this.projectId = projectId;
    this.instance = instance;
    this.database = database;
    this.spannerResourceProvider = spannerResourceProvider;
    this.catalog = new SimpleCatalog("catalog");
    this.catalog.addZetaSQLFunctions(new ZetaSQLBuiltinFunctionOptions());
    // TODO: Define and add Spanner-specific functions to the catalog
  }

  /** Private constructor used for implementing {@link #copy(boolean)} */
  private SpannerCatalog(
      String projectId,
      String instance,
      String database,
      SpannerResourceProvider spannerResourceProvider,
      SimpleCatalog internalCatalog
  ) {
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
   * @throws CatalogResourceAlreadyExists if the table already exists and
   * CreateMode != CREATE_OR_REPLACE
   */
  @Override
  public void register(SimpleTable table, CreateMode createMode, CreateScope createScope) {
    String tableName = table.getName();

    if(tableName.contains(".")) {
      throw new InvalidSpannerTableName(tableName);
    }

    CatalogOperations.createTableInCatalog(
        this.catalog,
        List.of(List.of(table.getName())),
        table.getName(),
        table.getColumnList(),
        createMode
    );
  }

  @Override
  public void register(Function function, CreateMode createMode, CreateScope createScope) {
    throw new UnsupportedOperationException(
        "Cloud Spanner does not support user-defined functions"
    );
  }

  @Override
  public void register(TVFInfo tvfInfo, CreateMode createMode, CreateScope createScope) {
    throw new UnsupportedOperationException(
        "Cloud Spanner does not support table valued functions"
    );
  }

  @Override
  public void register(
      ProcedureInfo procedureInfo,
      CreateMode createMode,
      CreateScope createScope
  ) {
    throw new UnsupportedOperationException("Cloud Spanner does not support procedures");
  }

  /**
   * {@inheritDoc}
   *
   * @throws InvalidSpannerTableName if any of the table names is invalid for Spanner
   */
  @Override
  public void addTables(List<String> tableNames) {
    tableNames
        .stream()
        .filter(tableName -> tableName.contains("."))
        .findAny()
        .ifPresent(invalidTableName -> {
          throw new InvalidSpannerTableName(invalidTableName);
        });

    this.spannerResourceProvider
        .getTables(tableNames)
        .forEach(table -> this.register(
            table, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
        ));
  }

  public void addAllTablesInDatabase() {
    this.spannerResourceProvider
        .getAllTablesInDatabase()
        .forEach(table -> this.register(
            table, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
        ));
  }

  @Override
  public void addFunctions(List<String> functions) {
    throw new UnsupportedOperationException("Cloud Spanner does not support UDFs");
  }

  @Override
  public void addTVFs(List<String> functions) {
    throw new UnsupportedOperationException("Cloud Spanner does not support TVFs");
  }

  @Override
  public void addProcedures(List<String> procedures) {
    throw new UnsupportedOperationException("Cloud Spanner does not support procedures");
  }

  @Override
  public SpannerCatalog copy(boolean deepCopy) {
    return new SpannerCatalog(
        this.projectId,
        this.instance,
        this.database,
        this.spannerResourceProvider,
        CatalogOperations.copyCatalog(this.catalog, deepCopy)
    );
  }

  @Override
  public SimpleCatalog getZetaSQLCatalog() {
    return this.catalog;
  }

}
