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
import com.google.cloud.spanner.DatabaseId;
import com.google.cloud.spanner.ResultSet;
import com.google.cloud.spanner.Spanner;
import com.google.cloud.spanner.SpannerOptions;
import com.google.cloud.spanner.Statement;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.Type;
import com.google.zetasql.toolkit.catalog.CatalogOperations;
import com.google.zetasql.toolkit.catalog.spanner.exceptions.SpannerTablesNotFound;
import com.google.zetasql.toolkit.catalog.typeparser.ZetaSQLTypeParser;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * {@link SpannerResourceProvider} implementation that uses a Spanner {@link DatabaseClient} and
 * queries INFORMATION_SCHEMA to get table information.
 */
public class SpannerResourceProviderImpl implements SpannerResourceProvider {

  private final DatabaseClient client;

  /**
   * Constructs a SpannerResourceProviderImpl given a Spanner project, instance and database. It
   * uses a {@link DatabaseClient} with application default credentials to access Spanner.
   *
   * @param project The Spanner project id
   * @param instance The Spanner instance name
   * @param database The Spanner database name
   */
  public SpannerResourceProviderImpl(String project, String instance, String database) {
    DatabaseId databaseId = DatabaseId.of(project, instance, database);
    Spanner spannerClient = SpannerOptions.newBuilder().build().getService();
    this.client = spannerClient.getDatabaseClient(databaseId);
  }

  /** Constructs a SpannerResourceProviderImpl that uses the provided {@link DatabaseClient} */
  public SpannerResourceProviderImpl(DatabaseClient client) {
    this.client = client;
  }

  @Override
  public List<SimpleTable> getTables(List<String> tableNames) {
    List<SimpleTable> tablesFetched = this.fetchTables(this.schemaForTablesQuery(tableNames));

    if (tableNames.size() > tablesFetched.size()) {
      // At least one table was not found
      Set<String> namesOfFetchedTables =
          tablesFetched.stream().map(SimpleTable::getName).collect(Collectors.toSet());

      List<String> notFoundTables =
          tableNames.stream()
              .filter(Predicate.not(namesOfFetchedTables::contains))
              .collect(Collectors.toList());

      throw new SpannerTablesNotFound(notFoundTables);
    }

    return tablesFetched;
  }

  @Override
  public List<SimpleTable> getAllTablesInDatabase() {
    return this.fetchTables(this.schemaForAllTablesInDatabaseQuery());
  }

  /**
   * Creates the Spanner query that queries INFORMATION_SCHEMA for the schema of all tables and
   * views in the Spanner database.
   */
  private Statement schemaForAllTablesInDatabaseQuery() {
    String query =
        "SELECT table_name, column_name, spanner_type " + "FROM information_schema.columns";

    return Statement.of(query);
  }

  /**
   * Creates the Spanner query that queries INFORMATION_SCHEMA for the schema of the provided tables
   * and views in the Spanner database.
   *
   * @param tableNames The names of the tables to query from
   */
  private Statement schemaForTablesQuery(List<String> tableNames) {
    String tableListSQL =
        tableNames.stream()
            .map(tableName -> String.format("'%s'", tableName))
            .collect(Collectors.joining(", "));

    String queryTemplate =
        "SELECT table_name, column_name, spanner_type "
            + "FROM information_schema.columns "
            + "WHERE table_name IN (%s);";

    return Statement.of(String.format(queryTemplate, tableListSQL));
  }

  /**
   * Fetches tables from the Spanner database and returns them as {@link SimpleTable }
   *
   * @param query The INFORMATION_SCHEMA query that returns table_name, column_name and spanner_type
   *     for the tables and views to retrieve.
   * @return The list of SimpleTables represented the retrieved tables.
   */
  private List<SimpleTable> fetchTables(Statement query) {
    Map<String, List<SimpleColumn>> tableColumns = new HashMap<>();

    try (ResultSet resultSet = this.client.singleUse().executeQuery(query)) {
      while (resultSet.next()) {
        String tableName = resultSet.getString("table_name");
        String columnName = resultSet.getString("column_name");
        String columnTypeStr = resultSet.getString("spanner_type");
        Type columnType = ZetaSQLTypeParser.parse(columnTypeStr);
        SimpleColumn column = new SimpleColumn(tableName, columnName, columnType);
        tableColumns.computeIfAbsent(tableName, key -> new ArrayList<>()).add(column);
      }
    }

    return tableColumns.entrySet().stream()
        .map(
            tableAndColumns ->
                CatalogOperations.buildSimpleTable(
                    tableAndColumns.getKey(), tableAndColumns.getValue()))
        .collect(Collectors.toList());
  }
}
