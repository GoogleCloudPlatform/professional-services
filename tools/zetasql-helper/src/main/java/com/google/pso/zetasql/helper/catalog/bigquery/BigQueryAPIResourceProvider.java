package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.Routine;
import com.google.cloud.bigquery.RoutineArgument;
import com.google.cloud.bigquery.RoutineId;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableId;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.utils.Try;
import com.google.zetasql.Function;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionProtos.FunctionOptionsProto;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import java.util.List;
import java.util.stream.Collectors;

public class BigQueryAPIResourceProvider implements BigQueryResourceProvider {

  private final BigQueryService service;

  public BigQueryAPIResourceProvider() {
    this(
        BigQueryOptions.newBuilder().build().getService()
    );
  }

  public BigQueryAPIResourceProvider(BigQuery client) {
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
    List<Try<Table>> tableTries = tableReferences
        .stream()
        .map(tableReference -> this.service.fetchTable(projectId, tableReference))
        .collect(Collectors.toList());

    tableTries
        .stream()
        .filter(Try::isFailure)
        .map(Try::getCause)
        .findFirst()
        .ifPresent(error -> { throw error; });

    return tableTries
        .stream()
        .filter(Try::isSuccess)
        .map(Try::get)
        .map(this::buildSimpleTable)
        .collect(Collectors.toList());
  }

  @Override
  public List<SimpleTable> getAllTablesInDataset(String projectId, String datasetName) {
    List<String> tableReferences = this.service
        .listTables(projectId, datasetName)
        .stream()
        .map(tableId -> String.format(
              "%s.%s.%s",
              tableId.getProject(),
              tableId.getDataset(),
              tableId.getTable()
          )
        )
        .collect(Collectors.toList());

    return this.getTables(projectId, tableReferences);
  }

  @Override
  public List<SimpleTable> getAllTablesInProject(String projectId) {
    return this.service
        .listDatasets(projectId)
        .stream()
        .flatMap(datasetId ->
            this.getAllTablesInDataset(projectId, datasetId.getDataset()).stream())
        .collect(Collectors.toList());
  }

  private enum BigQueryAPIRoutineType {
    UDF("SCALAR_FUNCTION"),
    TVF("TABLE_VALUED_FUNCTION"),
    PROCEDURE("PROCEDURE");

    public final String label;

    BigQueryAPIRoutineType(String label) {
      this.label = label;
    }

    public String getLabel() {
      return this.label;
    }

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

  private List<Routine> getRoutinesOfType(
      String projectId,
      List<String> routineReferences,
      BigQueryAPIRoutineType routineType
  ) {
    List<Try<Routine>> routineTries = routineReferences
        .stream()
        .map(tableReference -> this.service.fetchRoutine(projectId, tableReference))
        .collect(Collectors.toList());

    routineTries
        .stream()
        .filter(Try::isFailure)
        .map(Try::getCause)
        .findFirst()
        .ifPresent(error -> { throw error; });

    return routineTries
        .stream()
        .filter(Try::isSuccess)
        .map(Try::get)
        .filter(routine -> routine.getRoutineType().equals(routineType.getLabel()))
        .collect(Collectors.toList());
  }

  @Override
  public List<Function> getFunctions(String projectId, List<String> functionReferences) {
    return this.getRoutinesOfType(projectId, functionReferences, BigQueryAPIRoutineType.UDF)
        .stream()
        .map(this::buildFunction)
        .collect(Collectors.toList());
  }

  @Override
  public List<Function> getAllFunctionsInDataset(String projectId, String datasetName) {
    List<String> functionReferences = this.service
        .listRoutines(projectId, datasetName)
        .stream()
        .map(routineId -> String.format(
                "%s.%s.%s",
                routineId.getProject(),
                routineId.getDataset(),
                routineId.getRoutine()
            )
        )
        .collect(Collectors.toList());

      return this.getFunctions(projectId, functionReferences);
    }

  @Override
  public List<Function> getAllFunctionsInProject(String projectId) {
    return this.service
        .listDatasets(projectId)
        .stream()
        .flatMap(datasetId ->
            this.getAllFunctionsInDataset(projectId, datasetId.getDataset()).stream())
        .collect(Collectors.toList());
  }

}
