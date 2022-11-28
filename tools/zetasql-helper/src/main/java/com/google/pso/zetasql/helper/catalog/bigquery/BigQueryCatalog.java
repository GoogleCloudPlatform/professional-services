package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.api.gax.paging.Page;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQuery.DatasetListOption;
import com.google.cloud.bigquery.BigQuery.TableListOption;
import com.google.cloud.bigquery.Dataset;
import com.google.cloud.bigquery.DatasetId;
import com.google.cloud.bigquery.Routine;
import com.google.cloud.bigquery.RoutineArgument;
import com.google.cloud.bigquery.RoutineId;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableId;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.catalog.CatalogWrapper;
import com.google.zetasql.Function;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionProtos.FunctionOptionsProto;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.Type;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import com.google.zetasql.ZetaSQLType;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class BigQueryCatalog implements CatalogWrapper {

  private final String defaultProjectId;
  private final BigQueryService service;
  private final SimpleCatalog catalog;

  public BigQueryCatalog(String defaultProjectId) {
    this(
        defaultProjectId,
        BigQueryService.buildDefault()
    );
  }

  public BigQueryCatalog(String defaultProjectId, BigQuery bigQueryClient) {
    this(
        defaultProjectId,
        new BigQueryService(bigQueryClient)
    );
  }

  private BigQueryCatalog(String defaultProjectId, BigQueryService service) {
    this.defaultProjectId = defaultProjectId;
    this.service = service;
    this.catalog = new SimpleCatalog("catalog");
    this.catalog.addZetaSQLFunctions(new ZetaSQLBuiltinFunctionOptions());
    this.addBigQueryTypeAliases(this.catalog);
  }

  private BigQueryCatalog(
      String defaultProjectId,
      BigQueryService service,
      SimpleCatalog internalCatalog
  ) {
    this.defaultProjectId = defaultProjectId;
    this.service = service;
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

  private Optional<Table> fetchTable(String tableReference) {
    return this.service.fetchTable(this.defaultProjectId, tableReference);
  }

  private Optional<Routine> fetchRoutine(String routineReference) {
    return this.service.fetchRoutine(this.defaultProjectId, routineReference);
  }

  private SimpleTable buildSimpleTable(Table table) {
    TableId tableId = table.getTableId();
    String fullTableName = BigQueryReference.from(tableId).getFullName();
    List<SimpleColumn> columns = BigQuerySchemaConverter.extractTableColumns(table);
    return CatalogOperations.buildSimpleTable(fullTableName, columns);
  }

  @Override
  public void addTables(List<List<String>> tablePaths) {
    tablePaths
        .stream()
        .map(tablePath -> String.join(".", tablePath))
        .map(this::fetchTable)
        .filter(Optional::isPresent)
        .map(Optional::get)
        .map(this::buildSimpleTable)
        .forEach(simpleTable -> this.registerTable(simpleTable, false));
  }

  private Function buildFunction(Routine routine) {
    // TODO: Complete
    RoutineId routineId = routine.getRoutineId();
    List<String> functionNamePath = BigQueryReference.from(routineId).getNamePath();
    List<FunctionArgumentType> arguments = routine
        .getArguments()
        .stream()
        .map(RoutineArgument::getDataType)
        .map(BigQuerySchemaConverter::convertStandardSQLType)
        .map(FunctionArgumentType::new)
        .collect(Collectors.toList());
    FunctionArgumentType returnType = new FunctionArgumentType(
        BigQuerySchemaConverter.convertStandardSQLType(
          routine.getReturnType()
        )
    );
    FunctionSignature signature = new FunctionSignature(returnType, arguments, -1);
    return new Function(
        functionNamePath,
        "UDF", // TODO: should there be different groups?
        Mode.SCALAR, // TODO: do we need to allow for different modes here?
        List.of(signature),
        FunctionOptionsProto.newBuilder().build() // TODO: do we need to lead options here?
    );
  }

  @Override
  public void addFunctions(List<List<String>> functionPaths) {
    functionPaths
        .stream()
        .map(tablePath -> String.join(".", tablePath))
        .map(this::fetchRoutine)
        .filter(Optional::isPresent)
        .map(Optional::get)
        .map(this::buildFunction)
        .forEach(function -> this.registerFunction(function, false));
  }

  @Override
  public BigQueryCatalog copy(boolean deepCopy) {
    return new BigQueryCatalog(
        this.defaultProjectId,
        this.service,
        CatalogOperations.copyCatalog(this.getZetaSQLCatalog(), deepCopy)
    );
  }

  @Override
  public SimpleCatalog getZetaSQLCatalog() {
    return this.catalog;
  }

  public void addAllTablesFromDataset(String projectId, String datasetName) {
    DatasetId datasetId = DatasetId.of(projectId, datasetName);
    Page<Table> tables = this.service.getClient().listTables(
        datasetId, TableListOption.pageSize(100)
    );

    for(Table table : tables.iterateAll()) {
      this.addTable(
          List.of(projectId, datasetName, table.getTableId().getTable())
      );
    }

  }

  public void addAllTablesFromProject(String projectId) {
    Page<Dataset> datasets = this.service.getClient().listDatasets(
        projectId, DatasetListOption.pageSize(100)
    );

    for(Dataset dataset : datasets.iterateAll()) {
      this.addAllTablesFromDataset(projectId, dataset.getDatasetId().getDataset());
    }
  }

}
