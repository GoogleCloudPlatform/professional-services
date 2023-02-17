package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.cloud.bigquery.BigQuery;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.catalog.CatalogWrapper;
import com.google.zetasql.Function;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.Type;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
import com.google.zetasql.ZetaSQLType;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class BigQueryCatalog implements CatalogWrapper {

  private final String defaultProjectId;
  private final BigQueryResourceProvider bigQueryResourceProvider;
  private final SimpleCatalog catalog;

  public BigQueryCatalog(String defaultProjectId) {
    this(
        defaultProjectId,
        new BigQueryAPIResourceProvider()
    );
  }

  public BigQueryCatalog(String defaultProjectId, BigQuery bigQueryClient) {
    this(
        defaultProjectId,
        new BigQueryAPIResourceProvider(bigQueryClient)
    );
  }

  private BigQueryCatalog(
      String defaultProjectId,
      BigQueryResourceProvider bigQueryResourceProvider
  ) {
    this.defaultProjectId = defaultProjectId;
    this.bigQueryResourceProvider = bigQueryResourceProvider;
    this.catalog = new SimpleCatalog("catalog");
    this.catalog.addZetaSQLFunctions(new ZetaSQLBuiltinFunctionOptions());
    this.addBigQueryTypeAliases(this.catalog);
  }

  private BigQueryCatalog(
      String defaultProjectId,
      BigQueryResourceProvider bigQueryResourceProvider,
      SimpleCatalog internalCatalog
  ) {
    this.defaultProjectId = defaultProjectId;
    this.bigQueryResourceProvider = bigQueryResourceProvider;
    this.catalog = internalCatalog;
  }

  private void addBigQueryTypeAliases(SimpleCatalog catalog) {
    Map<String, Type> bigQueryTypeAliases = Map.of(
        "INT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "SMALLINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "INTEGER", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "BIGINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "TINYINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "BYTEINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "DECIMAL", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_NUMERIC),
        "BIGDECIMAL", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_BIGNUMERIC)
    );

    bigQueryTypeAliases.forEach(catalog::addType);
  }

  private void registerTempTable(SimpleTable table) {
    CatalogOperations.createTableInCatalog(
        this.catalog,
        List.of(List.of(table.getName())),
        table.getColumnList()
    );
  }

  private List<List<String>> buildCatalogPathsForResource(String referenceStr) {
    BigQueryReference reference = BigQueryReference.from(
        this.defaultProjectId, referenceStr
    );
    String projectId = reference.getProjectId();
    String datasetName = reference.getDatasetId();
    String resourceName = reference.getResourceName();

    List<List<String>> resourcePaths = List.of(
        List.of(projectId, datasetName, resourceName),  // format: project.dataset.table format
        List.of(projectId + "." + datasetName + "." + resourceName),  // format: `project.dataset.table`
        List.of(projectId + "." + datasetName, resourceName),  // format: `project.dataset`.table
        List.of(projectId, datasetName + "." + resourceName)  // format: project.`dataset.table`
    );

    List<List<String>> resourcePathsWithImplicitProject = List.of();

    if(projectId.equals(this.defaultProjectId)) {
      resourcePathsWithImplicitProject = List.of(
          List.of(datasetName, resourceName),  // format: dataset.table (project implied)
          List.of(datasetName + "." + resourceName)  // format: `dataset.table` (project implied)
      );
    }

    return Stream.concat(resourcePaths.stream(), resourcePathsWithImplicitProject.stream())
        .collect(Collectors.toList());
  }

  private void registerQualifiedTable(SimpleTable table) {
    List<List<String>> tablePaths = this.buildCatalogPathsForResource(table.getFullName());
    CatalogOperations.createTableInCatalog(this.catalog, tablePaths, table.getColumnList());
  }

  @Override
  public void registerTable(SimpleTable table, boolean isTemp) {
    if(isTemp) {
      this.registerTempTable(table);
    } else {
      this.registerQualifiedTable(table);
    }
  }

  public void registerTempFunction(Function function) {
    CatalogOperations.createFunctionInCatalog(
        this.catalog,
        List.of(function.getNamePath()),
        function
    );
  }

  private void registerQualifiedFunction(Function function) {
    List<List<String>> functionPaths = this.buildCatalogPathsForResource(
        String.join(".", function.getNamePath())
    );
    CatalogOperations.createFunctionInCatalog(this.catalog, functionPaths, function);
  }

  @Override
  public void registerFunction(Function function, boolean isTemp) {
    if(isTemp) {
      this.registerTempFunction(function);
    } else {
      this.registerQualifiedFunction(function);
    }
  }

  @Override
  public void addTables(List<List<String>> tablePaths) {
    List<String> tableReferences = tablePaths
        .stream()
        .map(tablePath -> String.join(".", tablePath))
        .collect(Collectors.toList());

    this.bigQueryResourceProvider
        .getTables(this.defaultProjectId, tableReferences)
        .forEach(simpleTable -> this.registerTable(simpleTable, false));
  }

  public void addAllTablesInDataset(String projectId, String datasetName) {
    this.bigQueryResourceProvider
        .getAllTablesInDataset(projectId, datasetName)
        .forEach(simpleTable -> this.registerTable(simpleTable, false));
  }

  public void addAllTablesInProject(String projectId) {
    this.bigQueryResourceProvider
        .getAllTablesInProject(projectId)
        .forEach(simpleTable -> this.registerTable(simpleTable, false));
  }

  @Override
  public void addFunctions(List<List<String>> functionPaths) {
    List<String> functionReferences = functionPaths
        .stream()
        .map(functionPath -> String.join(".", functionPath))
        .collect(Collectors.toList());

    this.bigQueryResourceProvider
        .getFunctions(this.defaultProjectId, functionReferences)
        .forEach(function -> this.registerFunction(function, false));
  }

  @Override
  public BigQueryCatalog copy(boolean deepCopy) {
    return new BigQueryCatalog(
        this.defaultProjectId,
        this.bigQueryResourceProvider,
        CatalogOperations.copyCatalog(this.getZetaSQLCatalog(), deepCopy)
    );
  }

  @Override
  public SimpleCatalog getZetaSQLCatalog() {
    return this.catalog;
  }

}
