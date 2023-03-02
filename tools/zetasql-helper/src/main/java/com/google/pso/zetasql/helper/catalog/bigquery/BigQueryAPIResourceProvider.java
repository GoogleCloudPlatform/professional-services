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

package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.Routine;
import com.google.cloud.bigquery.RoutineArgument;
import com.google.cloud.bigquery.RoutineId;
import com.google.cloud.bigquery.StandardSQLDataType;
import com.google.cloud.bigquery.StandardSQLStructType;
import com.google.cloud.bigquery.StandardSQLTableType;
import com.google.cloud.bigquery.StandardSQLTypeName;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableId;
import com.google.common.collect.ImmutableList;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.catalog.bigquery.BigQueryService.FetchResult;
import com.google.pso.zetasql.helper.catalog.bigquery.exceptions.MissingRoutineReturnType;
import com.google.zetasql.Function;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionArgumentType.FunctionArgumentTypeOptions;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.StructType.StructField;
import com.google.zetasql.TVFRelation;
import com.google.zetasql.Type;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.ProcedureArgumentMode;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import com.google.zetasql.ZetaSQLType.TypeKind;
import java.util.List;
import java.util.Optional;
import java.util.function.BiFunction;
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

  /**
   * Converts a StandardSQLTypeName from the BigQuery API to a ZetaSQL TypeKind.
   *
   * @param bigqueryTypeName The StandardSQLTypeName to convert
   * @return The corresponding ZetaSQL TypeKind
   */
  private TypeKind convertBigqueryTypeNameToTypeKind(StandardSQLTypeName bigqueryTypeName) {
    switch (bigqueryTypeName) {
      case STRING:
        return TypeKind.TYPE_STRING;
      case BYTES:
        return TypeKind.TYPE_BYTES;
      case INT64:
        return TypeKind.TYPE_INT64;
      case FLOAT64:
        return TypeKind.TYPE_FLOAT;
      case NUMERIC:
        return TypeKind.TYPE_NUMERIC;
      case BIGNUMERIC:
        return TypeKind.TYPE_BIGNUMERIC;
      case INTERVAL:
        return TypeKind.TYPE_INTERVAL;
      case BOOL:
        return TypeKind.TYPE_BOOL;
      case TIMESTAMP:
        return TypeKind.TYPE_TIMESTAMP;
      case DATE:
        return TypeKind.TYPE_DATE;
      case TIME:
        return TypeKind.TYPE_TIME;
      case DATETIME:
        return TypeKind.TYPE_DATETIME;
      case GEOGRAPHY:
        return TypeKind.TYPE_GEOGRAPHY;
      default:
        return TypeKind.TYPE_UNKNOWN;
    }
  }

  /**
   * Extract the ZetaSQL Type from a BigQuery API table field.
   *
   * @param field The field from which to extract the ZetaSQL type
   * @return The extracted ZetaSQL type
   */
  private Type extractTypeFromBigQueryTableField(Field field) {
    Type fieldType;
    StandardSQLTypeName type = field.getType().getStandardType();
    Field.Mode mode = Optional.ofNullable(field.getMode()).orElse(Field.Mode.NULLABLE);

    if (type.equals(StandardSQLTypeName.STRUCT)) {
      List<StructField> fields =
          field.getSubFields().stream()
              .map(
                  subField -> {
                    Type recordFieldType = this.extractTypeFromBigQueryTableField(subField);
                    return new StructField(subField.getName(), recordFieldType);
                  })
              .collect(Collectors.toList());

      fieldType = TypeFactory.createStructType(fields);
    } else {
      fieldType = TypeFactory.createSimpleType(this.convertBigqueryTypeNameToTypeKind(type));
    }

    if (mode.equals(Field.Mode.REPEATED)) {
      return TypeFactory.createArrayType(fieldType);
    }

    return fieldType;
  }

  /**
   * Extract the ZetaSQL columns from a BigQuery API table.
   *
   * @param table The table from which to extract the ZetaSQL columns
   * @return The extracted ZetaSQL columns
   */
  private List<SimpleColumn> extractColumnsFromBigQueryTable(Table table) {
    TableId tableId = table.getTableId();

    return table.getDefinition()
        .getSchema()
        .getFields()
        .stream()
        .map(field -> new SimpleColumn(
            tableId.getTable(),
            field.getName(),
            this.extractTypeFromBigQueryTableField(field)
        ))
        .collect(Collectors.toList());
  }

  /**
   * Converts a StandardSQLDataType from the BigQuery API into a ZetaSQL Type.
   *
   * @param bigqueryDataType The StandardSQLDataType to convert
   * @return The corresponding ZetaSQL type
   */
  private Type convertBigQueryDataTypeToZetaSQLType(StandardSQLDataType bigqueryDataType) {
    if(bigqueryDataType == null) {
      return TypeFactory.createSimpleType(TypeKind.TYPE_UNKNOWN);
    }

    String typeKind = bigqueryDataType.getTypeKind();

    if(typeKind.equals("ARRAY")) {
      StandardSQLDataType arrayElementType = bigqueryDataType.getArrayElementType();
      Type zetaSQLArrayType = this.convertBigQueryDataTypeToZetaSQLType(arrayElementType);
      return TypeFactory.createArrayType(zetaSQLArrayType);
    }

    if(typeKind.equals("STRUCT")) {
      StandardSQLStructType structType = bigqueryDataType.getStructType();
      List<StructField> structFields = structType
          .getFields()
          .stream()
          .map(field ->
              new StructField(
                  field.getName(),
                  this.convertBigQueryDataTypeToZetaSQLType(field.getDataType())
              )
          )
          .collect(Collectors.toList());
      return TypeFactory.createStructType(structFields);
    }

    StandardSQLTypeName typeName = StandardSQLTypeName.valueOf(typeKind);
    TypeKind zetaSQLTypeKind = this.convertBigqueryTypeNameToTypeKind(typeName);
    return TypeFactory.createSimpleType(zetaSQLTypeKind);
  }

  private SimpleTable buildSimpleTable(Table table) {
    TableId tableId = table.getTableId();
    String fullTableName = BigQueryReference.from(tableId).getFullName();
    List<SimpleColumn> columns = this.extractColumnsFromBigQueryTable(table);
    return CatalogOperations.buildSimpleTable(fullTableName, columns);
  }

  private <T> List<T> fetchResourcesFromBigQueryService(
      String projectId,
      List<String> resourceReferences,
      BiFunction<String, String, FetchResult<T>> fetcher
  ) {
    List<FetchResult<T>> tableTries = resourceReferences
        .stream()
        .map(resourceReference -> fetcher.apply(projectId, resourceReference))
        .collect(Collectors.toList());

    tableTries
        .stream()
        .map(FetchResult::getError)
        .filter(Optional::isPresent)
        .map(Optional::get)
        .findFirst()
        .ifPresent(error -> { throw error; });

    return tableTries
        .stream()
        .map(FetchResult::get)
        .filter(Optional::isPresent)
        .map(Optional::get)
        .collect(Collectors.toList());
  }

  @Override
  public List<SimpleTable> getTables(String projectId, List<String> tableReferences) {
    return this
        .fetchResourcesFromBigQueryService(projectId, tableReferences, this.service::fetchTable)
        .stream()
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

  private FunctionArgumentType parseRoutineArgument(RoutineArgument argument) {
    Type zetaSqlDataType = this.convertBigQueryDataTypeToZetaSQLType(argument.getDataType());

    ProcedureArgumentMode procedureArgumentMode = argument.getMode() == null
        ? ProcedureArgumentMode.NOT_SET
        : ProcedureArgumentMode.valueOf(argument.getMode());

    FunctionArgumentTypeOptions options = FunctionArgumentTypeOptions
        .builder()
        .setArgumentName(argument.getName())
        .setProcedureArgumentMode(procedureArgumentMode)
        .build();

    return new FunctionArgumentType(zetaSqlDataType, options, 1);
  }

  private List<FunctionArgumentType> parseRoutineArguments(List<RoutineArgument> arguments) {
    if(arguments == null) {
      return List.of();
    }

    return arguments
        .stream()
        .map(this::parseRoutineArgument)
        .collect(Collectors.toList());
  }

  private TVFRelation parseTVFOutputSchema(StandardSQLTableType returnTableType) {
    List<TVFRelation.Column> columns = returnTableType
        .getColumns()
        .stream()
        .map(field -> {
          Type type = this.convertBigQueryDataTypeToZetaSQLType(field.getDataType());
          return TVFRelation.Column.create(field.getName(), type);
        })
        .collect(Collectors.toList());

    return TVFRelation.createColumnBased(columns);
  }

  private Function buildFunction(Routine routine) {
    RoutineId routineId = routine.getRoutineId();
    BigQueryReference bigQueryReference = BigQueryReference.from(routineId);

    if(routine.getReturnType() == null) {
      throw new MissingRoutineReturnType(bigQueryReference.getFullName());
    }

    List<FunctionArgumentType> arguments = this.parseRoutineArguments(routine.getArguments());
    FunctionArgumentType returnType = new FunctionArgumentType(
        this.convertBigQueryDataTypeToZetaSQLType(
            routine.getReturnType()
        )
    );

    FunctionSignature signature = new FunctionSignature(returnType, arguments, -1);

    return new Function(
        bigQueryReference.getNamePath(),
        "UDF",
        Mode.SCALAR,
        List.of(signature)
    );
  }

  private TVFInfo buildTVF(Routine routine) {
    RoutineId routineId = routine.getRoutineId();
    BigQueryReference bigQueryReference = BigQueryReference.from(routineId);

    if(routine.getReturnTableType() == null) {
      throw new MissingRoutineReturnType(bigQueryReference.getFullName());
    }

    TVFRelation outputSchema = this.parseTVFOutputSchema(routine.getReturnTableType());

    List<FunctionArgumentType> arguments = this.parseRoutineArguments(routine.getArguments());
    FunctionArgumentType returnType = new FunctionArgumentType(
        SignatureArgumentKind.ARG_TYPE_RELATION,
        FunctionArgumentTypeOptions.builder()
            .setRelationInputSchema(outputSchema)
            .build(),
        1
    );

    FunctionSignature signature = new FunctionSignature(returnType, arguments, -1);

    return new TVFInfo(
        bigQueryReference.getNamePath(),
        signature,
        outputSchema
    );
  }

  private ProcedureInfo buildProcedure(Routine routine) {
    RoutineId routineId = routine.getRoutineId();
    String fullName = BigQueryReference.from(routineId).getFullName();

    List<FunctionArgumentType> arguments = this.parseRoutineArguments(routine.getArguments());
    FunctionArgumentType returnType = new FunctionArgumentType(
        TypeFactory.createSimpleType(TypeKind.TYPE_STRING)
    );

    FunctionSignature signature = new FunctionSignature(returnType, arguments, -1);

    return new ProcedureInfo(ImmutableList.of(fullName), signature);
  }

  private List<Routine> getRoutinesOfType(
      String projectId,
      List<String> routineReferences,
      BigQueryAPIRoutineType routineType
  ) {
    return this
        .fetchResourcesFromBigQueryService(
            projectId, routineReferences, this.service::fetchRoutine
        )
        .stream()
        .filter(routine -> routine.getRoutineType().equals(routineType.getLabel()))
        .collect(Collectors.toList());

  }

  private List<Function> getFunctionsImpl(
      String projectId,
      List<String> functionReferences,
      boolean ignoreFunctionsWithoutReturnType
  ) {
    return this.getRoutinesOfType(projectId, functionReferences, BigQueryAPIRoutineType.UDF)
        .stream()
        .filter(routine -> !ignoreFunctionsWithoutReturnType || routine.getReturnType() != null)
        .map(this::buildFunction)
        .collect(Collectors.toList());
  }

  @Override
  public List<Function> getFunctions(String projectId, List<String> functionReferences) {
    return this.getFunctionsImpl(projectId, functionReferences, false);
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

      return this.getFunctionsImpl(projectId, functionReferences, true);
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

  private List<TVFInfo> getTVFsImpl(
      String projectId,
      List<String> functionReferences,
      boolean ignoreFunctionsWithoutReturnType
  ) {
    return this.getRoutinesOfType(projectId, functionReferences, BigQueryAPIRoutineType.TVF)
        .stream()
        .filter(routine -> !ignoreFunctionsWithoutReturnType || routine.getReturnTableType() != null)
        .map(this::buildTVF)
        .collect(Collectors.toList());
  }

  @Override
  public List<TVFInfo> getTVFs(String projectId, List<String> functionReferences) {
    return this.getTVFsImpl(projectId, functionReferences, false);
  }

  @Override
  public List<TVFInfo> getAllTVFsInDataset(String projectId, String datasetName) {
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

    return this.getTVFsImpl(projectId, functionReferences, true);
  }

  @Override
  public List<TVFInfo> getAllTVFsInProject(String projectId) {
    return this.service
        .listDatasets(projectId)
        .stream()
        .flatMap(datasetId ->
            this.getAllTVFsInDataset(projectId, datasetId.getDataset()).stream())
        .collect(Collectors.toList());
  }

  @Override
  public List<ProcedureInfo> getProcedures(String projectId, List<String> functionReferences) {
    return this.getRoutinesOfType(projectId, functionReferences, BigQueryAPIRoutineType.PROCEDURE)
        .stream()
        .map(this::buildProcedure)
        .collect(Collectors.toList());
  }

  @Override
  public List<ProcedureInfo> getAllProceduresInDataset(String projectId, String datasetName) {
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

    return this.getProcedures(projectId, functionReferences);
  }

  @Override
  public List<ProcedureInfo> getAllProceduresInProject(String projectId) {
    return this.service
        .listDatasets(projectId)
        .stream()
        .flatMap(datasetId ->
            this.getAllProceduresInDataset(projectId, datasetId.getDataset()).stream())
        .collect(Collectors.toList());
  }

}
