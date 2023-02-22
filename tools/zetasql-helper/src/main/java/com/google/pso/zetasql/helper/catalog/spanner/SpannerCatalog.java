package com.google.pso.zetasql.helper.catalog.spanner;

import com.google.cloud.spanner.DatabaseClient;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.catalog.CatalogWrapper;
import com.google.zetasql.Function;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
import java.util.List;
import java.util.stream.Collectors;

public class SpannerCatalog implements CatalogWrapper {

  private final String projectId;
  private final String instance;
  private final String database;
  private final SpannerResourceProvider spannerResourceProvider;
  private final SimpleCatalog catalog;

  public SpannerCatalog(String projectId, String instance, String database) {
    this(
        projectId,
        instance,
        database,
        new SpannerResourceProviderImpl(projectId, instance, database)
    );
  }

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

  @Override
  public void registerTable(SimpleTable table, boolean isTemp) {
    CatalogOperations.createTableInCatalog(
        this.catalog,
        List.of(List.of(table.getName())),
        table.getColumnList()
    );
  }

  @Override
  public void registerFunction(Function function, boolean isTemp) {
    CatalogOperations.createFunctionInCatalog(
        this.catalog,
        List.of(function.getNamePath()),
        function
    );
  }

  @Override
  public void addTables(List<List<String>> tablePaths) {
    List<String> tableNames = tablePaths
        .stream()
        .map(tablePath -> tablePath.get(tablePath.size() - 1))  // Spanner tables paths should only have table name
        .collect(Collectors.toList());

    this.spannerResourceProvider
        .getTables(tableNames)
        .forEach(table -> this.registerTable(table, false));
  }

  public void addAllTablesInDatabase() {
    this.spannerResourceProvider
        .getAllTablesInDatabase()
        .forEach(table -> this.registerTable(table, false));
  }

  @Override
  public void addFunctions(List<List<String>> functionPaths) {
    throw new UnsupportedOperationException("Unimplemented");
  }

  @Override
  public void addTVFs(List<List<String>> functionPaths) {
    throw new UnsupportedOperationException("Unimplemented");
  }

  @Override
  public void addProcedures(List<List<String>> procedurePaths) {
    throw new UnsupportedOperationException("Unimplemented");
  }

  @Override
  public CatalogWrapper copy(boolean deepCopy) {
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
