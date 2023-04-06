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

import com.google.cloud.spanner.*;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.Type;
import com.google.zetasql.toolkit.catalog.CatalogOperations;
import com.google.zetasql.toolkit.catalog.spanner.exceptions.SpannerTablesNotFound;
import com.google.zetasql.toolkit.catalog.typeparser.ZetaSQLTypeParser;
import com.google.zetasql.toolkit.usage.UsageTracking;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * {@link SpannerResourceProvider} implementation that uses a Spanner {@link DatabaseClient} and
 * queries INFORMATION_SCHEMA to get table information.
 */
public class SpannerResourceProviderImpl implements SpannerResourceProvider {

  private final DatabaseClient dbClient;

  /**
   * Constructs a SpannerResourceProviderImpl.
   *
   * <p>Package-private, only used internally and for testing. To build a new instance, see {@link
   * #build(String, String, String, Spanner)} and {@link #buildDefault(String, String, String)}.
   *
   * @param project The Spanner project id
   * @param instance The Spanner instance id
   * @param database The Spanner database name
   * @param spannerClient The {@link Spanner} instance to use when accessing Spanner
   */
  SpannerResourceProviderImpl(
      String project, String instance, String database, Spanner spannerClient) {
    DatabaseId databaseId = DatabaseId.of(project, instance, database);
    this.dbClient = spannerClient.getDatabaseClient(databaseId);
  }

  /**
   * Constructs a SpannerResourceProviderImpl with a given Spanner client.
   *
   * <p>The underlying client used by the will be a copy of the provided client which includes usage
   * tracking headers.
   *
   * @param project The Spanner project id
   * @param instance The Spanner instance id
   * @param database The Spanner database name
   * @param spannerClient The {@link Spanner} instance to use when building the
   *     SpannerResourceProviderImpl
   * @return The new SpannerResourceProviderImpl instance
   */
  public static SpannerResourceProviderImpl build(
      String project, String instance, String database, Spanner spannerClient) {
    Spanner spannerClientWithUsageTracking =
        spannerClient
            .getOptions()
            .toBuilder()
            .setHeaderProvider(UsageTracking.HEADER_PROVIDER)
            .build()
            .getService();

    return new SpannerResourceProviderImpl(
        project, instance, database, spannerClientWithUsageTracking);
  }

  /**
   * Constructs a SpannerResourceProviderImpl given a Spanner project, instance and database. It
   * uses application-default credentials to access Spanner.
   *
   * @param project The Spanner project id
   * @param instance The Spanner instance name
   * @param database The Spanner database name
   * @return The new SpannerResourceProviderImpl instance
   */
  public static SpannerResourceProviderImpl buildDefault(
      String project, String instance, String database) {
    Spanner defaultSpanner = SpannerOptions.newBuilder().build().getService();
    return SpannerResourceProviderImpl.build(project, instance, database, defaultSpanner);
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

    try (ResultSet resultSet = this.dbClient.singleUse().executeQuery(query)) {
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
