package com.google.pso.zetasql.helper.catalog.spanner;

import com.google.cloud.spanner.DatabaseClient;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.catalog.CatalogWrapper;
import com.google.pso.zetasql.helper.catalog.bigquery.ProcedureInfo;
import com.google.pso.zetasql.helper.catalog.bigquery.TVFInfo;
import com.google.pso.zetasql.helper.catalog.spanner.exceptions.InvalidSpannerTableName;
import com.google.zetasql.Function;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
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
  public void register(SimpleTable table, CreateMode createMode, CreateScope createScope) {
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

  @Override
  public void addTables(List<List<String>> tablePaths) {
    List<String> tableNames = tablePaths
        .stream()
        .map(tablePath -> {
          // Spanner tables paths should only have table name
          if(tablePath.size() > 1) {
            throw new InvalidSpannerTableName(String.join(".", tablePath));
          }

          return tablePath.get(0);
        })
        .collect(Collectors.toList());

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
