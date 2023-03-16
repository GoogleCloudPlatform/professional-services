package com.google.zetasql.toolkit.catalog.bigquery;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.google.cloud.bigquery.DatasetId;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.Field.Mode;
import com.google.cloud.bigquery.FieldList;
import com.google.cloud.bigquery.Routine;
import com.google.cloud.bigquery.RoutineArgument;
import com.google.cloud.bigquery.RoutineId;
import com.google.cloud.bigquery.StandardSQLDataType;
import com.google.cloud.bigquery.StandardSQLField;
import com.google.cloud.bigquery.StandardSQLTableType;
import com.google.cloud.bigquery.StandardSQLTypeName;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableId;
import com.google.zetasql.Function;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionArgumentType.FunctionArgumentTypeOptions;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.StructType.StructField;
import com.google.zetasql.TVFRelation;
import com.google.zetasql.TVFRelation.Column;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.ProcedureArgumentMode;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.toolkit.catalog.CatalogTestUtils;
import com.google.zetasql.toolkit.catalog.bigquery.BigQueryService.Result;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class BigQueryAPIResourceProviderTest {

  BigQueryAPIResourceProvider bigqueryResourceProvider;

  @Mock
  BigQueryService bigQueryServiceMock;

  @BeforeEach
  void init() {
    this.bigqueryResourceProvider = new BigQueryAPIResourceProvider(this.bigQueryServiceMock);
  }

  Table createMockTable() {
    Table mockTable = mock(Table.class, Answers.RETURNS_DEEP_STUBS);
    TableId tableId = TableId.of("project", "dataset", "table");
    FieldList fields = FieldList.of(
        Field.of("col1", StandardSQLTypeName.INT64),
        Field.newBuilder("col2", StandardSQLTypeName.STRING).setMode(Mode.REPEATED).build(),
        Field.of("col3", StandardSQLTypeName.STRUCT,
            Field.of("field1", StandardSQLTypeName.INT64)
        )
    );

    when(mockTable.getTableId()).thenReturn(tableId);
    when(mockTable.getDefinition().getSchema().getFields()).thenReturn(fields);

    return mockTable;
  }

  List<SimpleColumn> expectedColumnsForMockTable() {
    return List.of(
        new SimpleColumn("table", "col1", TypeFactory.createSimpleType(TypeKind.TYPE_INT64)),
        new SimpleColumn("table", "col2",
            TypeFactory.createArrayType(
                TypeFactory.createSimpleType(TypeKind.TYPE_STRING)
            )
        ),
        new SimpleColumn("table", "col3",
            TypeFactory.createStructType(List.of(
                new StructField("field1", TypeFactory.createSimpleType(TypeKind.TYPE_INT64))
            ))
        )
    );
  }

  @Test
  void testGetTables() {
    Table mockTable = createMockTable();
    when(bigQueryServiceMock.fetchTable(anyString(), anyString()))
        .thenReturn(Result.success(mockTable));

    List<SimpleColumn> expectedSchemaForMockTable = expectedColumnsForMockTable();

    List<SimpleTable> tables =
        bigqueryResourceProvider.getTables("project", List.of("reference"));

    assertEquals(1, tables.size());
    assertTrue(
        CatalogTestUtils.tableColumnsEqual(
            expectedSchemaForMockTable, tables.get(0).getColumnList()
        )
    );
  }

  @Test
  void testGetAllTablesInDataset() {
    TableId tableId = TableId.of("project", "dataset", "table");
    Table mockTable = createMockTable();
    when(bigQueryServiceMock.listTables(anyString(), anyString()))
        .thenReturn(Result.success(List.of(tableId)));
    when(bigQueryServiceMock.fetchTable(anyString(), anyString()))
        .thenReturn(Result.success(mockTable));

    List<SimpleColumn> expectedSchemaForMockTable = expectedColumnsForMockTable();

    List<SimpleTable> tables =
        bigqueryResourceProvider.getAllTablesInDataset("project", "dataset");

    assertEquals(1, tables.size());
    assertTrue(
        CatalogTestUtils.tableColumnsEqual(
            expectedSchemaForMockTable, tables.get(0).getColumnList()
        )
    );
  }

  @Test
  void testGetAllTablesInProject() {
    DatasetId datasetId = DatasetId.of("project", "dataset");
    TableId tableId = TableId.of("project", "dataset", "table");
    Table mockTable = createMockTable();
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
            expectedSchemaForMockTable, tables.get(0).getColumnList()
        )
    );
  }

  Routine createMockUDF() {
    Routine routine = mock(Routine.class);
    RoutineId routineId = RoutineId.of("project", "dataset", "f");

    when(routine.getRoutineId()).thenReturn(routineId);
    when(routine.getRoutineType()).thenReturn(BigQueryAPIRoutineType.UDF.getLabel());
    when(routine.getArguments()).thenReturn(List.of(
        RoutineArgument.newBuilder().setName("x").setDataType(
            StandardSQLDataType.newBuilder(StandardSQLTypeName.INT64).build()
        ).build()
    ));
    when(routine.getReturnType()).thenReturn(
        StandardSQLDataType.newBuilder(StandardSQLTypeName.STRING).build()
    );

    return routine;
  }

  FunctionSignature expectedSignatureForMockUDF() {
    FunctionArgumentType returnType = new FunctionArgumentType(
        TypeFactory.createSimpleType(TypeKind.TYPE_STRING));

    FunctionArgumentType argument = new FunctionArgumentType(
        TypeFactory.createSimpleType(TypeKind.TYPE_INT64),
        FunctionArgumentTypeOptions.builder()
            .setArgumentName("x")
            .setProcedureArgumentMode(ProcedureArgumentMode.NOT_SET)
            .build(),
        1
    );

    return new FunctionSignature(returnType, List.of(argument), -1);
  }

  @Test
  void testGetFunctions() {
    Routine mockUDF = createMockUDF();
    when(bigQueryServiceMock.fetchRoutine(anyString(), anyString()))
        .thenReturn(Result.success(mockUDF));

    FunctionSignature expectedSignatureForMockUDF = expectedSignatureForMockUDF();

    List<Function> functions =
        bigqueryResourceProvider.getFunctions("project", List.of("reference"));

    assertEquals(1, functions.size());
    assertTrue(
        CatalogTestUtils.functionSignatureEquals(
            expectedSignatureForMockUDF, functions.get(0).getSignatureList().get(0)
        )
    );
  }

  Routine createMockTVF() {
    Routine routine = mock(Routine.class);
    RoutineId routineId = RoutineId.of("project", "dataset", "tvf");

    when(routine.getRoutineId()).thenReturn(routineId);
    when(routine.getRoutineType()).thenReturn(BigQueryAPIRoutineType.TVF.getLabel());
    when(routine.getArguments()).thenReturn(List.of(
        RoutineArgument.newBuilder().setName("x").setDataType(
            StandardSQLDataType.newBuilder(StandardSQLTypeName.INT64).build()
        ).build()
    ));
    when(routine.getReturnTableType()).thenReturn(
        StandardSQLTableType.newBuilder()
            .setColumns(List.of(
                StandardSQLField.newBuilder()
                    .setName("out")
                    .setDataType(
                        StandardSQLDataType.newBuilder(StandardSQLTypeName.STRING).build()
                    )
                    .build()
            ))
            .build()
    );

    return routine;
  }

  TVFRelation expectedOutputSchemaForMockTVF() {
    return TVFRelation.createColumnBased(List.of(
        Column.create("out", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))
    ));
  }

  FunctionSignature expectedSignatureForMockTVF() {
    FunctionArgumentType returnType = new FunctionArgumentType(
        SignatureArgumentKind.ARG_TYPE_RELATION,
        FunctionArgumentTypeOptions.builder()
            .setRelationInputSchema(expectedOutputSchemaForMockTVF())
            .build(),
        1
    );

    FunctionArgumentType argument = new FunctionArgumentType(
        TypeFactory.createSimpleType(TypeKind.TYPE_INT64),
        FunctionArgumentTypeOptions.builder()
            .setArgumentName("x")
            .setProcedureArgumentMode(ProcedureArgumentMode.NOT_SET)
            .build(),
        1
    );

    return new FunctionSignature(returnType, List.of(argument), -1);
  }

  @Test
  void testGetTVFs() {
    Routine mockTVF = createMockTVF();
    when(bigQueryServiceMock.fetchRoutine(anyString(), anyString()))
        .thenReturn(Result.success(mockTVF));

    FunctionSignature expectedSignatureForMockTVF = expectedSignatureForMockTVF();
    TVFRelation expectedOutputSchemaForMockTVF = expectedOutputSchemaForMockTVF();

    List<TVFInfo> functions =
        bigqueryResourceProvider.getTVFs("project", List.of("reference"));

    assertEquals(1, functions.size());
    assertTrue(
        CatalogTestUtils.functionSignatureEquals(
            expectedSignatureForMockTVF, functions.get(0).getSignature()
        )
    );
    assertEquals(expectedOutputSchemaForMockTVF, functions.get(0).getOutputSchema());
  }

  Routine createMockProcedure() {
    Routine routine = mock(Routine.class);
    RoutineId routineId = RoutineId.of("project", "dataset", "proc");

    when(routine.getRoutineId()).thenReturn(routineId);
    when(routine.getRoutineType()).thenReturn(BigQueryAPIRoutineType.PROCEDURE.getLabel());
    when(routine.getArguments()).thenReturn(List.of(
        RoutineArgument.newBuilder()
            .setName("x")
            .setDataType(StandardSQLDataType.newBuilder(StandardSQLTypeName.INT64).build())
            .build()
    ));

    return routine;
  }

  FunctionSignature expectedSignatureForMockProcedure() {
    FunctionArgumentType returnType = new FunctionArgumentType(
        TypeFactory.createSimpleType(TypeKind.TYPE_STRING));

    FunctionArgumentType argument = new FunctionArgumentType(
        TypeFactory.createSimpleType(TypeKind.TYPE_INT64),
        FunctionArgumentTypeOptions.builder()
            .setArgumentName("x")
            .setProcedureArgumentMode(ProcedureArgumentMode.NOT_SET)
            .build(),
        1
    );

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
            expectedSignatureForMockProcedure, procedures.get(0).getSignature()
        )
    );
  }

}
