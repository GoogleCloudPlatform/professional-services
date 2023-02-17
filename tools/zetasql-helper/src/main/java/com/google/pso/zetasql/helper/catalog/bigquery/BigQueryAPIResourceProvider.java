package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.api.gax.paging.Page;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQuery.DatasetListOption;
import com.google.cloud.bigquery.BigQuery.TableListOption;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.Dataset;
import com.google.cloud.bigquery.DatasetId;
import com.google.cloud.bigquery.Routine;
import com.google.cloud.bigquery.RoutineArgument;
import com.google.cloud.bigquery.RoutineId;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableId;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.zetasql.Function;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionProtos.FunctionOptionsProto;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class BigQueryAPIResourceProvider implements BigQueryResourceProvider {

  private final BigQuery client;
  private final BigQueryService service;

  public BigQueryAPIResourceProvider() {
    this(
        BigQueryOptions.newBuilder().build().getService()
    );
  }

  public BigQueryAPIResourceProvider(BigQuery client) {
    this.client = client;
    this.service = new BigQueryService(client);
  }

  private SimpleTable buildSimpleTable(Table table) {
    TableId tableId = table.getTableId();
    String fullTableName = BigQueryReference.from(tableId).getFullName();
    List<SimpleColumn> columns = BigQuerySchemaConverter.extractTableColumns(table);
    return CatalogOperations.buildSimpleTable(fullTableName, columns);
  }

  @Override
  public List<SimpleTable> getTables(String projectId, List<String> tableReferences) {
    return tableReferences
        .stream()
        .map(tableReference -> this.service.fetchTable(projectId, tableReference))
        .filter(Optional::isPresent)
        .map(Optional::get)
        .map(this::buildSimpleTable)
        .collect(Collectors.toList());
  }

  @Override
  public List<SimpleTable> getAllTablesInDataset(String projectId, String datasetName) {
    List<SimpleTable> resultTables = new ArrayList<>();

    DatasetId datasetId = DatasetId.of(projectId, datasetName);
    Page<Table> tables = this.client.listTables(
        datasetId, TableListOption.pageSize(100)
    );

    for(Table table : tables.iterateAll()) {
      TableId tableId = table.getTableId();
      String fullyQualifiedTable = String.format(
          "%s.%s.%s",
          tableId.getProject(),
          tableId.getDataset(),
          tableId.getTable()
      );
      this.getTable(projectId, fullyQualifiedTable)
          .ifPresent(resultTables::add);
    }

    return resultTables;
  }

  @Override
  public List<SimpleTable> getAllTablesInProject(String projectId) {
    List<SimpleTable> resultTables = new ArrayList<>();

    Page<Dataset> datasets = this.client.listDatasets(
        projectId, DatasetListOption.pageSize(100)
    );

    for(Dataset dataset : datasets.iterateAll()) {
      List<SimpleTable> datasetTables = this.getAllTablesInDataset(
          projectId, dataset.getDatasetId().getDataset()
      );
      resultTables.addAll(datasetTables);
    }

    return resultTables;
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
  public List<Function> getFunctions(
      String projectId,
      List<String> functionReferences
  ) {
    return functionReferences
        .stream()
        .map(functionReference -> this.service.fetchRoutine(projectId, functionReference))
        .filter(Optional::isPresent)
        .map(Optional::get)
        .map(this::buildFunction)
        .collect(Collectors.toList());
  }
}
