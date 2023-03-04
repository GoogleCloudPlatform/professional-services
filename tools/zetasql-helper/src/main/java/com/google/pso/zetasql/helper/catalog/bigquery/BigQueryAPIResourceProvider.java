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
import com.google.pso.zetasql.helper.catalog.bigquery.BigQueryService.Result;
import com.google.pso.zetasql.helper.catalog.bigquery.exceptions.BigQueryAPIError;
import com.google.pso.zetasql.helper.catalog.bigquery.exceptions.InvalidBigQueryReference;
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
import java.util.stream.Collectors;

/**
 * {@link BigQueryResourceProvider} implementation that uses the BigQuery API
 * to get the BigQuery resources. Resources are cached internally, so
 * multiple request to the same resource only hit the API once.
 */
public class BigQueryAPIResourceProvider implements BigQueryResourceProvider {

  private final BigQueryService service;

  /** Constructs a BigQueryAPIResourceProvider that uses the default BigQuery client */
  public BigQueryAPIResourceProvider() {
    this(
        BigQueryOptions.newBuilder().build().getService()
    );
  }

  /**
   * Constructs a BigQueryAPIResourceProvider that uses the provided BigQuery client.
   *
   * @param client The BigQuery client this instance should use
   */
  public BigQueryAPIResourceProvider(BigQuery client) {
    this(new BigQueryService(client));
  }

  /**
   * Constructs a BigQueryAPIResourceProvider that uses the provided {@link BigQueryService}.
   * Package-private, used solely for dependency injection in testing.
   *
   * @param service The BigQueryService this instance should use
   */
  BigQueryAPIResourceProvider(BigQueryService service) {
    this.service = service;
  }

  /**
   * Converts a StandardSQLTypeName from the BigQuery API to a ZetaSQL {@link TypeKind}.
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
   * Extract the ZetaSQL {@link Type} from a BigQuery API table {@link Field}.
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
   * Extract the ZetaSQL {@link SimpleColumn}s from a BigQuery API {@link Table}.
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
   * Converts a {@link StandardSQLDataType} from the BigQuery API into a ZetaSQL {@link Type}.
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

  /**
   * Builds a {@link SimpleTable} given a BigQuery API {@link Table} object
   *
   * @param table The BigQuery Table for which to build a SimpleTable
   * @return The resulting SimpleTable object
   */
  private SimpleTable buildSimpleTable(Table table) {
    TableId tableId = table.getTableId();
    String fullTableName = BigQueryReference.from(tableId).getFullName();
    List<SimpleColumn> columns = this.extractColumnsFromBigQueryTable(table);
    return CatalogOperations.buildSimpleTable(fullTableName, columns);
  }

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
  @Override
  public List<SimpleTable> getTables(String projectId, List<String> tableReferences) {
    return tableReferences
        .stream()
        .map(reference -> this.service.fetchTable(projectId, reference))
        .map(Result::get)
        .map(this::buildSimpleTable)
        .collect(Collectors.toList());
  }

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
  @Override
  public List<SimpleTable> getAllTablesInDataset(String projectId, String datasetName) {
    List<String> tableReferences = this.service
        .listTables(projectId, datasetName)
        .get()
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

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
  @Override
  public List<SimpleTable> getAllTablesInProject(String projectId) {
    return this.service
        .listDatasets(projectId)
        .get()
        .stream()
        .flatMap(datasetId ->
            this.getAllTablesInDataset(projectId, datasetId.getDataset()).stream())
        .collect(Collectors.toList());
  }

  /**
   * Parses a BigQuery API {@link RoutineArgument} into a ZetaSQL {@link FunctionArgumentType}
   *
   * @param argument The BigQuery RoutineArgument to parse
   * @return The resulting ZetaSQL FunctionArgumentType
   */
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

  /**
   * Parses a list of BigQuery {@link RoutineArgument}s into its corresponding
   * list of {@link FunctionArgumentType} using {@link #parseRoutineArgument(RoutineArgument)}
   *
   * @param arguments The list of RoutineArguments to parse
   * @return The corresponding list of FunctionArgumentTypes
   */
  private List<FunctionArgumentType> parseRoutineArguments(List<RoutineArgument> arguments) {
    if(arguments == null) {
      return List.of();
    }

    return arguments
        .stream()
        .map(this::parseRoutineArgument)
        .collect(Collectors.toList());
  }

  /**
   * Parse a BigQuery API {@link StandardSQLTableType} into a ZetaSQL {@link TVFRelation} to
   * be used as the output schema of a TVF.
   *
   * @param sqlTableType The StandardSQLTableType to parse
   * @return The resulting TVFRelation object
   */
  private TVFRelation parseTVFOutputSchema(StandardSQLTableType sqlTableType) {
    List<TVFRelation.Column> columns = sqlTableType
        .getColumns()
        .stream()
        .map(field -> {
          Type type = this.convertBigQueryDataTypeToZetaSQLType(field.getDataType());
          return TVFRelation.Column.create(field.getName(), type);
        })
        .collect(Collectors.toList());

    return TVFRelation.createColumnBased(columns);
  }

  /**
   * Builds a {@link Function} given a BigQuery API {@link Routine} object.
   * The Routine must be a BigQuery user-defined function.
   *
   * @param routine The BigQuery Routine for which to build a Function
   * @return The resulting Function object
   * @throws MissingRoutineReturnType if the input Routine does not have its
   * return type set
   */
  private Function buildFunction(Routine routine) {
    assert routine.getRoutineType().equals(BigQueryAPIRoutineType.UDF.getLabel());

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

  /**
   * Builds a {@link TVFInfo} given a BigQuery API {@link Routine} object.
   * The Routine must be a BigQuery table-valued function.
   *
   * @param routine The BigQuery Routine for which to build a TVFInfo
   * @return The resulting TVFInfo object
   * @throws MissingRoutineReturnType if the input Routine does not have its
   * return type set
   */
  private TVFInfo buildTVF(Routine routine) {
    assert routine.getRoutineType().equals(BigQueryAPIRoutineType.TVF.getLabel());

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

  /**
   * Builds a {@link ProcedureInfo} given a BigQuery API {@link Routine} object.
   * The Routine must be a BigQuery procedure.
   *
   * @param routine The BigQuery Routine for which to build a ProcedureInfo
   * @return The resulting ProcedureInfo object
   */
  private ProcedureInfo buildProcedure(Routine routine) {
    assert routine.getRoutineType().equals(BigQueryAPIRoutineType.PROCEDURE.getLabel());

    RoutineId routineId = routine.getRoutineId();
    String fullName = BigQueryReference.from(routineId).getFullName();

    List<FunctionArgumentType> arguments = this.parseRoutineArguments(routine.getArguments());
    FunctionArgumentType returnType = new FunctionArgumentType(
        TypeFactory.createSimpleType(TypeKind.TYPE_STRING)
    );

    FunctionSignature signature = new FunctionSignature(returnType, arguments, -1);

    return new ProcedureInfo(ImmutableList.of(fullName), signature);
  }

  /**
   * Gets BigQuery {@link Routine}s of a particular type. Routines can be UDFs,
   * TVF or Procedures.
   *
   * @param projectId The default BigQuery project id
   * @param routineReferences The routine references. Each reference should
   * be in the format "project.dataset.table" or "dataset.table".
   * @param routineType The type of Routines that should be fetched
   * @return The list of fetched Routine objects
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
  private List<Routine> getRoutinesOfType(
      String projectId,
      List<String> routineReferences,
      BigQueryAPIRoutineType routineType
  ) {
    return routineReferences
        .stream()
        .map(reference -> this.service.fetchRoutine(projectId, reference))
        .map(Result::get)
        .filter(routine -> routine.getRoutineType().equals(routineType.getLabel()))
        .collect(Collectors.toList());
  }

  /**
   * Gets a set of BigQuery functions and returns them as {@link Function}s
   *
   * @param projectId The default BigQuery project id.
   * @param functionReferences The list of function references. Each reference should
   * be in the format "project.dataset.function" or "dataset.function".
   * @param ignoreFunctionsWithoutReturnType Whether to filter out functions with a
   * missing return type.
   * @return The list of {@link Function}s representing the requested BigQuery functions.
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
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

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   * @throws MissingRoutineReturnType if any of the requested functions is missing its return type
   */
  @Override
  public List<Function> getFunctions(String projectId, List<String> functionReferences) {
    return this.getFunctionsImpl(projectId, functionReferences, false);
  }

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
  @Override
  public List<Function> getAllFunctionsInDataset(String projectId, String datasetName) {
    List<String> functionReferences = this.service
        .listRoutines(projectId, datasetName)
        .get()
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

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
  @Override
  public List<Function> getAllFunctionsInProject(String projectId) {
    return this.service
        .listDatasets(projectId)
        .get()
        .stream()
        .flatMap(datasetId ->
            this.getAllFunctionsInDataset(projectId, datasetId.getDataset()).stream())
        .collect(Collectors.toList());
  }

  /**
   * Gets a set of BigQuery TVFs and returns them as {@link TVFInfo}s
   *
   * @param projectId The default BigQuery project id.
   * @param functionReferences The list of function references. Each reference should
   * be in the format "project.dataset.function" or "dataset.function".
   * @param ignoreFunctionsWithoutReturnType Whether to filter out functions with a
   * missing return type.
   * @return The list of {@link TVFInfo}s representing the requested BigQuery TVFs.
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
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

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   * @throws MissingRoutineReturnType if any of the requested functions is missing its return type
   */
  @Override
  public List<TVFInfo> getTVFs(String projectId, List<String> functionReferences) {
    return this.getTVFsImpl(projectId, functionReferences, false);
  }

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
  @Override
  public List<TVFInfo> getAllTVFsInDataset(String projectId, String datasetName) {
    List<String> functionReferences = this.service
        .listRoutines(projectId, datasetName)
        .get()
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

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
  @Override
  public List<TVFInfo> getAllTVFsInProject(String projectId) {
    return this.service
        .listDatasets(projectId)
        .get()
        .stream()
        .flatMap(datasetId ->
            this.getAllTVFsInDataset(projectId, datasetId.getDataset()).stream())
        .collect(Collectors.toList());
  }

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
  @Override
  public List<ProcedureInfo> getProcedures(String projectId, List<String> functionReferences) {
    return this.getRoutinesOfType(projectId, functionReferences, BigQueryAPIRoutineType.PROCEDURE)
        .stream()
        .map(this::buildProcedure)
        .collect(Collectors.toList());
  }

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
  @Override
  public List<ProcedureInfo> getAllProceduresInDataset(String projectId, String datasetName) {
    List<String> functionReferences = this.service
        .listRoutines(projectId, datasetName)
        .get()
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

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryAPIError if an API error occurs
   * @throws InvalidBigQueryReference if any provided table reference is invalid
   */
  @Override
  public List<ProcedureInfo> getAllProceduresInProject(String projectId) {
    return this.service
        .listDatasets(projectId)
        .get()
        .stream()
        .flatMap(datasetId ->
            this.getAllProceduresInDataset(projectId, datasetId.getDataset()).stream())
        .collect(Collectors.toList());
  }

}
