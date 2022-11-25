package com.google.pso.zetasql.helper.catalog.spanner;

import com.google.cloud.spanner.DatabaseClient;
import com.google.cloud.spanner.DatabaseId;
import com.google.cloud.spanner.ResultSet;
import com.google.cloud.spanner.Spanner;
import com.google.cloud.spanner.SpannerOptions;
import com.google.cloud.spanner.Statement;
import com.google.pso.zetasql.helper.catalog.CatalogHelper;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.catalog.typeparser.ZetaSQLTypeParser;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class SpannerCatalogHelper extends CatalogHelper {

  private final String projectId;
  private final String instance;
  private final String database;
  private final DatabaseClient client;

  public SpannerCatalogHelper(String projectId, String instance, String database) {
    this(
        projectId,
        instance,
        database,
        buildDatabaseClient(projectId, instance, database)
    );
  }

  public SpannerCatalogHelper(String projectId, String instance, String database,
      DatabaseClient client) {
    this.projectId = projectId;
    this.instance = instance;
    this.database = database;
    this.client = client;
  }

  private static DatabaseClient buildDatabaseClient(String projectId, String instance, String database) {
    DatabaseId databaseId = DatabaseId.of(projectId, instance, database);
    Spanner spannerClient = SpannerOptions
        .newBuilder()
        .build()
        .getService();
    return spannerClient.getDatabaseClient(databaseId);
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

  @Override
  public void registerTable(SimpleCatalog catalog, SimpleTable table, boolean isTemp) {
    CatalogOperations.createTableInCatalog(
        catalog,
        List.of(List.of(table.getName())),
        table.getColumnList()
    );
  }

  private Statement buildQueryForEntireDatabase() {
    String query = "SELECT table_name, column_name, spanner_type "
        + "FROM information_schema.columns";

    return Statement.of(query);
  }

  private Statement buildQueryForSpecificTables(List<String> tableNames) {
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

  private List<SimpleTable> fetchColumnAndBuildTables(Statement query) {
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

  @Override
  public void addTables(SimpleCatalog catalog, List<List<String>> tablePaths) {
    List<String> tableNames = tablePaths
        .stream()
        .map(tablePath -> tablePath.get(tablePath.size() - 1))  // Spanner tables paths should only have table name
        .collect(Collectors.toList());

    Statement query = this.buildQueryForSpecificTables(tableNames);

    this.fetchColumnAndBuildTables(query)
        .forEach(table -> this.registerTable(catalog, table, false));
  }

  public void addAllTablesInDatabase(SimpleCatalog catalog) {
    Statement query = this.buildQueryForEntireDatabase();

    this.fetchColumnAndBuildTables(query)
        .forEach(table -> this.registerTable(catalog, table, false));
  }
}
