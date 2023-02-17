package com.google.pso.zetasql.helper.catalog.spanner;

import com.google.cloud.spanner.DatabaseClient;
import com.google.cloud.spanner.DatabaseId;
import com.google.cloud.spanner.ResultSet;
import com.google.cloud.spanner.Spanner;
import com.google.cloud.spanner.SpannerOptions;
import com.google.cloud.spanner.Statement;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.catalog.typeparser.ZetaSQLTypeParser;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class SpannerResourceProviderImpl implements SpannerResourceProvider {

  private final DatabaseClient client;

  public SpannerResourceProviderImpl(
      String project,
      String instance,
      String database
  ) {
    DatabaseId databaseId = DatabaseId.of(project, instance, database);
    Spanner spannerClient = SpannerOptions
        .newBuilder()
        .build()
        .getService();
    this.client = spannerClient.getDatabaseClient(databaseId);
  }

  public SpannerResourceProviderImpl(DatabaseClient client) {
    this.client = client;
  }

  @Override
  public List<SimpleTable> getTables(List<String> tableNames) {
    return this.fetchTables(
        this.schemaForTablesQuery(tableNames)
    );
  }

  @Override
  public List<SimpleTable> getAllTablesInDatabase() {
    return this.fetchTables(
        this.schemaForAllTablesInDatabaseQuery()
    );
  }


  private Statement schemaForAllTablesInDatabaseQuery() {
    String query = "SELECT table_name, column_name, spanner_type "
        + "FROM information_schema.columns";

    return Statement.of(query);
  }

  private Statement schemaForTablesQuery(List<String> tableNames) {
    String tableListSQL = tableNames
        .stream()
        .map(tableName -> String.format("'%s'", tableName))
        .collect(Collectors.joining(", "));

    String queryTemplate = "SELECT table_name, column_name, spanner_type "
        + "FROM information_schema.columns "
        + "WHERE table_name IN (%s);";

    return Statement.of(
        String.format(queryTemplate, tableListSQL)
    );
  }

  private List<SimpleTable> fetchTables(Statement query) {
    Map<String, List<SimpleColumn>> tableColumns = new HashMap<>();

    try (ResultSet resultSet = this.client.singleUse().executeQuery(query)) {
      while (resultSet.next()) {
        String tableName = resultSet.getString("table_name");
        String columnName = resultSet.getString("column_name");
        String columnTypeStr = resultSet.getString("spanner_type");
        Type columnType = ZetaSQLTypeParser.parse(columnTypeStr);
        SimpleColumn column = new SimpleColumn(tableName, columnName, columnType);
        tableColumns
            .computeIfAbsent(tableName, key -> new ArrayList<>())
            .add(column);
      }
    }

    return tableColumns
        .entrySet()
        .stream()
        .map(tableAndColumns -> CatalogOperations.buildSimpleTable(
            tableAndColumns.getKey(), tableAndColumns.getValue()
        ))
        .collect(Collectors.toList());
  }

}
