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

package com.google.zetasql.toolkit.catalog.bigquery;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

import com.google.cloud.bigquery.*;
import com.google.cloud.bigquery.Field.Mode;
import com.google.cloud.bigquery.Table;
import com.google.zetasql.*;
import com.google.zetasql.FunctionArgumentType.FunctionArgumentTypeOptions;
import com.google.zetasql.StructType.StructField;
import com.google.zetasql.TVFRelation.Column;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.NamedArgumentKind;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.ProcedureArgumentMode;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.toolkit.catalog.CatalogTestUtils;
import com.google.zetasql.toolkit.catalog.bigquery.BigQueryService.Result;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class BigQueryAPIResourceProviderTest {

  BigQueryAPIResourceProvider bigqueryResourceProvider;

  @Mock BigQueryService bigQueryServiceMock;

  @BeforeEach
  void init() {
    this.bigqueryResourceProvider = new BigQueryAPIResourceProvider(this.bigQueryServiceMock);
  }

  Table createMockTable(boolean timePartitioned) {
    Table mockTable = mock(Table.class);
    StandardTableDefinition mockTableDefinition =
        mock(StandardTableDefinition.class, Answers.RETURNS_DEEP_STUBS);

    TableId tableId = TableId.of("project", "dataset", "table");
    FieldList fields =
        FieldList.of(
            Field.of("col1", StandardSQLTypeName.INT64),
            Field.newBuilder("col2", StandardSQLTypeName.STRING).setMode(Mode.REPEATED).build(),
            Field.of(
                "col3", StandardSQLTypeName.STRUCT, Field.of("field1", StandardSQLTypeName.INT64)));

    when(mockTable.getTableId()).thenReturn(tableId);
    when(mockTable.getDefinition()).thenReturn(mockTableDefinition);
    when(mockTableDefinition.getSchema().getFields()).thenReturn(fields);

    if (timePartitioned) {
      TimePartitioning timePartitioning =
          TimePartitioning.newBuilder(TimePartitioning.Type.DAY)
              .setField(null) // A null field means the table in ingestion-time partitioned
              .build();
      when(mockTableDefinition.getTimePartitioning()).thenReturn(timePartitioning);
    } else {
      when(mockTableDefinition.getTimePartitioning()).thenReturn(null);
    }

    return mockTable;
  }

  List<SimpleColumn> expectedColumnsForMockTable() {
    return List.of(
        new SimpleColumn("table", "col1", TypeFactory.createSimpleType(TypeKind.TYPE_INT64)),
        new SimpleColumn(
            "table",
            "col2",
            TypeFactory.createArrayType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING))),
        new SimpleColumn(
            "table",
            "col3",
            TypeFactory.createStructType(
                List.of(
                    new StructField(
                        "field1", TypeFactory.createSimpleType(TypeKind.TYPE_INT64))))));
  }

  @Test
  void testGetTables() {
    Table mockTable = createMockTable(false);
    when(bigQueryServiceMock.fetchTable(anyString(), anyString()))
        .thenReturn(Result.success(mockTable));

    List<SimpleColumn> expectedSchemaForMockTable = expectedColumnsForMockTable();

    List<SimpleTable> tables = bigqueryResourceProvider.getTables("project", List.of("reference"));

    assertEquals(1, tables.size());
    assertTrue(
        CatalogTestUtils.tableColumnsEqual(
            expectedSchemaForMockTable, tables.get(0).getColumnList()));
  }

  @Test
  void testGetTimePartitionedTable() {
    Table mockTable = createMockTable(true);
    when(bigQueryServiceMock.fetchTable(anyString(), anyString()))
        .thenReturn(Result.success(mockTable));

    List<SimpleTable> tables = bigqueryResourceProvider.getTables("project", List.of("reference"));

    assertEquals(1, tables.size());

    SimpleTable foundTable = tables.get(0);

    Optional<SimpleColumn> partitionTimeColumn =
        Optional.ofNullable(foundTable.findColumnByName("_PARTITIONTIME"));
    Optional<SimpleColumn> partitionDateColumn =
        Optional.ofNullable(foundTable.findColumnByName("_PARTITIONDATE"));

    assertTrue(
        partitionTimeColumn.isPresent(),
        "Expected ingestion time partitioned table to have _PARTITIONTIME column");
    assertEquals(
        TypeFactory.createSimpleType(TypeKind.TYPE_TIMESTAMP),
        partitionTimeColumn.get().getType(),
        "Expected type of _PARTITIONTIME to be TIMESTAMP");

    assertTrue(
        partitionDateColumn.isPresent(),
        "Expected ingestion time partitioned table to have _PARTITIONDATE column");
    assertEquals(
        TypeFactory.createSimpleType(TypeKind.TYPE_DATE),
        partitionDateColumn.get().getType(),
        "Expected type of _PARTITIONDATE to be TIMESTAMP");
  }

  @Test
  void testGetAllTablesInDataset() {
    TableId tableId = TableId.of("project", "dataset", "table");
    Table mockTable = createMockTable(false);
    when(bigQueryServiceMock.listTables(anyString(), anyString()))
        .thenReturn(Result.success(List.of(tableId)));
    when(bigQueryServiceMock.fetchTable(anyString(), anyString()))
        .thenReturn(Result.success(mockTable));

    List<SimpleColumn> expectedSchemaForMockTable = expectedColumnsForMockTable();

    List<SimpleTable> tables = bigqueryResourceProvider.getAllTablesInDataset("project", "dataset");

    assertEquals(1, tables.size());
    assertTrue(
        CatalogTestUtils.tableColumnsEqual(
            expectedSchemaForMockTable, tables.get(0).getColumnList()));
  }

  @Test
  void testGetAllTablesInProject() {
    DatasetId datasetId = DatasetId.of("project", "dataset");
    TableId tableId = TableId.of("project", "dataset", "table");
    Table mockTable = createMockTable(false);
    when(bigQueryServiceMock.listDatasets(anyString()))
        .thenReturn(Result.success(List.of(datasetId)));
    when(bigQueryServiceMock.listTables(anyString(), anyString()))
        .thenReturn(Result.success(List.of(tableId)));
    when(bigQueryServiceMock.fetchTable(anyString(), anyString()))
        .thenReturn(Result.success(mockTable));

    List<SimpleColumn> expectedSchemaForMockTable = expectedColumnsForMockTable();

    List<SimpleTable> tables = bigqueryResourceProvider.getAllTablesInProject("project");

    assertEquals(1, tables.size());
    assertTrue(
        CatalogTestUtils.tableColumnsEqual(
            expectedSchemaForMockTable, tables.get(0).getColumnList()));
  }

  Routine createMockUDF() {
    Routine routine = mock(Routine.class);
    RoutineId routineId = RoutineId.of("project", "dataset", "f");

    when(routine.getRoutineId()).thenReturn(routineId);
    when(routine.getRoutineType()).thenReturn(BigQueryAPIRoutineType.UDF.getLabel());
    when(routine.getArguments())
        .thenReturn(
            List.of(
                RoutineArgument.newBuilder()
                    .setName("x")
                    .setDataType(StandardSQLDataType.newBuilder(StandardSQLTypeName.INT64).build())
                    .build()));
    when(routine.getReturnType())
        .thenReturn(StandardSQLDataType.newBuilder(StandardSQLTypeName.STRING).build());

    return routine;
  }

  FunctionSignature expectedSignatureForMockUDF() {
    FunctionArgumentType returnType =
        new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING));

    FunctionArgumentType argument =
        new FunctionArgumentType(
            TypeFactory.createSimpleType(TypeKind.TYPE_INT64),
            FunctionArgumentTypeOptions.builder()
                .setArgumentName("x", NamedArgumentKind.POSITIONAL_ONLY)
                .setProcedureArgumentMode(ProcedureArgumentMode.NOT_SET)
                .build(),
            1);

    return new FunctionSignature(returnType, List.of(argument), -1);
  }

  @Test
  void testGetFunctions() {
    Routine mockUDF = createMockUDF();
    when(bigQueryServiceMock.fetchRoutine(anyString(), anyString()))
        .thenReturn(Result.success(mockUDF));

    FunctionSignature expectedSignatureForMockUDF = expectedSignatureForMockUDF();

    List<FunctionInfo> functions =
        bigqueryResourceProvider.getFunctions("project", List.of("reference"));

    assertEquals(1, functions.size());
    assertTrue(
        CatalogTestUtils.functionSignatureEquals(
            expectedSignatureForMockUDF, functions.get(0).getSignatures().get(0)));
  }

  Routine createMockTVF() {
    Routine routine = mock(Routine.class);
    RoutineId routineId = RoutineId.of("project", "dataset", "tvf");

    when(routine.getRoutineId()).thenReturn(routineId);
    when(routine.getRoutineType()).thenReturn(BigQueryAPIRoutineType.TVF.getLabel());
    when(routine.getArguments())
        .thenReturn(
            List.of(
                RoutineArgument.newBuilder()
                    .setName("x")
                    .setDataType(StandardSQLDataType.newBuilder(StandardSQLTypeName.INT64).build())
                    .build()));
    when(routine.getReturnTableType())
        .thenReturn(
            StandardSQLTableType.newBuilder()
                .setColumns(
                    List.of(
                        StandardSQLField.newBuilder()
                            .setName("out")
                            .setDataType(
                                StandardSQLDataType.newBuilder(StandardSQLTypeName.STRING).build())
                            .build()))
                .build());

    return routine;
  }

  TVFRelation expectedOutputSchemaForMockTVF() {
    return TVFRelation.createColumnBased(
        List.of(Column.create("out", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))));
  }

  FunctionSignature expectedSignatureForMockTVF() {
    FunctionArgumentType returnType =
        new FunctionArgumentType(
            SignatureArgumentKind.ARG_TYPE_RELATION,
            FunctionArgumentTypeOptions.builder()
                .setRelationInputSchema(expectedOutputSchemaForMockTVF())
                .build(),
            1);

    FunctionArgumentType argument =
        new FunctionArgumentType(
            TypeFactory.createSimpleType(TypeKind.TYPE_INT64),
            FunctionArgumentTypeOptions.builder()
                .setArgumentName("x", NamedArgumentKind.POSITIONAL_ONLY)
                .setProcedureArgumentMode(ProcedureArgumentMode.NOT_SET)
                .build(),
            1);

    return new FunctionSignature(returnType, List.of(argument), -1);
  }

  @Test
  void testGetTVFs() {
    Routine mockTVF = createMockTVF();
    when(bigQueryServiceMock.fetchRoutine(anyString(), anyString()))
        .thenReturn(Result.success(mockTVF));

    FunctionSignature expectedSignatureForMockTVF = expectedSignatureForMockTVF();
    TVFRelation expectedOutputSchemaForMockTVF = expectedOutputSchemaForMockTVF();

    List<TVFInfo> functions = bigqueryResourceProvider.getTVFs("project", List.of("reference"));

    assertEquals(1, functions.size());
    assertTrue(
        CatalogTestUtils.functionSignatureEquals(
            expectedSignatureForMockTVF, functions.get(0).getSignature()));

    TVFRelation outputSchema = assertDoesNotThrow(() -> functions.get(0).getOutputSchema().get());
    assertEquals(expectedOutputSchemaForMockTVF, outputSchema);
  }

  Routine createMockProcedure() {
    Routine routine = mock(Routine.class);
    RoutineId routineId = RoutineId.of("project", "dataset", "proc");

    when(routine.getRoutineId()).thenReturn(routineId);
    when(routine.getRoutineType()).thenReturn(BigQueryAPIRoutineType.PROCEDURE.getLabel());
    when(routine.getArguments())
        .thenReturn(
            List.of(
                RoutineArgument.newBuilder()
                    .setName("x")
                    .setDataType(StandardSQLDataType.newBuilder(StandardSQLTypeName.INT64).build())
                    .build()));

    return routine;
  }

  FunctionSignature expectedSignatureForMockProcedure() {
    FunctionArgumentType returnType =
        new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING));

    FunctionArgumentType argument =
        new FunctionArgumentType(
            TypeFactory.createSimpleType(TypeKind.TYPE_INT64),
            FunctionArgumentTypeOptions.builder()
                .setArgumentName("x", NamedArgumentKind.POSITIONAL_ONLY)
                .setProcedureArgumentMode(ProcedureArgumentMode.NOT_SET)
                .build(),
            1);

    return new FunctionSignature(returnType, List.of(argument), -1);
  }

  @Test
  void testGetProcedures() {
    Routine mockProcedure = createMockProcedure();
    when(bigQueryServiceMock.fetchRoutine(anyString(), anyString()))
        .thenReturn(Result.success(mockProcedure));

    FunctionSignature expectedSignatureForMockProcedure = expectedSignatureForMockProcedure();

    List<ProcedureInfo> procedures =
        bigqueryResourceProvider.getProcedures("project", List.of("reference"));

    assertEquals(1, procedures.size());
    assertTrue(
        CatalogTestUtils.functionSignatureEquals(
            expectedSignatureForMockProcedure, procedures.get(0).getSignature()));
  }
}
