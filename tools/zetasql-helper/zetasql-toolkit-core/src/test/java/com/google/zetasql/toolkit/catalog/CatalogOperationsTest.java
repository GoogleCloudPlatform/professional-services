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

package com.google.zetasql.toolkit.catalog;

import static org.junit.jupiter.api.Assertions.*;

import com.google.common.collect.ImmutableList;
import com.google.zetasql.*;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.toolkit.catalog.bigquery.FunctionInfo;
import com.google.zetasql.toolkit.catalog.bigquery.ProcedureInfo;
import com.google.zetasql.toolkit.catalog.bigquery.TVFInfo;
import com.google.zetasql.toolkit.catalog.exceptions.CatalogResourceAlreadyExists;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CatalogOperationsTest {

  SimpleCatalog testCatalog;

  private SimpleCatalog createSampleCatalog(String name) {
    SimpleCatalog catalog = new SimpleCatalog(name);
    SimpleTable sampleTable =
        new SimpleTable(
            "sample",
            List.of(
                new SimpleColumn(
                    "sample", "column", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))));
    catalog.addSimpleTable(sampleTable);

    Function function =
        new Function(
            List.of("function"),
            "UDF",
            ZetaSQLFunctions.FunctionEnums.Mode.SCALAR,
            List.of(
                new FunctionSignature(
                    new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING)),
                    List.of(),
                    -1)));
    catalog.addFunction(function);

    TVFRelation tvfOutputSchema =
        TVFRelation.createColumnBased(
            List.of(
                TVFRelation.Column.create(
                    "output", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))));
    TableValuedFunction tvf =
        new TableValuedFunction.FixedOutputSchemaTVF(
            ImmutableList.of("tvf"),
            new FunctionSignature(
                new FunctionArgumentType(
                    ZetaSQLFunctions.SignatureArgumentKind.ARG_TYPE_RELATION,
                    FunctionArgumentType.FunctionArgumentTypeOptions.builder()
                        .setRelationInputSchema(tvfOutputSchema)
                        .build(),
                    1),
                List.of(),
                -1),
            tvfOutputSchema);
    catalog.addTableValuedFunction(tvf);

    Procedure procedure =
        new Procedure(
            List.of("procedure"),
            new FunctionSignature(
                new FunctionArgumentType(ZetaSQLFunctions.SignatureArgumentKind.ARG_TYPE_VOID),
                List.of(),
                -1));
    catalog.addProcedure(procedure);

    return catalog;
  }

  @BeforeEach
  void setUp() {
    this.testCatalog = this.createSampleCatalog("catalog");
    this.testCatalog.addSimpleCatalog(this.createSampleCatalog("nested"));
  }

  private Table assertTableExists(SimpleCatalog catalog, List<String> tablePath, String message) {
    return assertDoesNotThrow(() -> catalog.findTable(tablePath), message);
  }

  private void assertTableDoesNotExist(
      SimpleCatalog catalog, List<String> tablePath, String message) {
    assertThrows(NotFoundException.class, () -> catalog.findTable(tablePath), message);
  }

  @Test
  void testCreateTableInCatalog() {
    String tableName = "newTable";
    String fullTableName = "qualified.newTable";
    SimpleTable newTable =
        new SimpleTable(
            tableName,
            List.of(
                new SimpleColumn(
                    tableName, "column", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))));
    newTable.setFullName(fullTableName);

    List<String> newTablePath1 = List.of("newTable");
    List<String> newTablePath2 = List.of("qualified", "newTable");
    List<List<String>> newTablePaths = List.of(newTablePath1, newTablePath2);

    CatalogOperations.createTableInCatalog(
        this.testCatalog,
        newTablePaths,
        fullTableName,
        newTable.getColumnList(),
        CreateMode.CREATE_DEFAULT);

    assertAll(
        () -> assertTableExists(this.testCatalog, newTablePath1, "Expected created table to exist"),
        () ->
            assertTableExists(this.testCatalog, newTablePath2, "Expected created table to exist"));
  }

  @Test
  void testDeleteTableFromCatalog() {
    List<String> sampleTablePath = List.of("sample");
    List<String> nestedSampleTablePath = List.of("nested", "sample");

    List<List<String>> tablePathsToDelete = List.of(sampleTablePath, nestedSampleTablePath);
    CatalogOperations.deleteTableFromCatalog(this.testCatalog, tablePathsToDelete);

    assertAll(
        () ->
            assertTableDoesNotExist(
                this.testCatalog, sampleTablePath, "Expected table to have been deleted"),
        () ->
            assertTableDoesNotExist(
                this.testCatalog, nestedSampleTablePath, "Expected table to have been deleted"));
  }

  @Test
  void testTableAlreadyExists() {
    String tableName = "sample";
    SimpleTable newTable =
        new SimpleTable(
            tableName,
            List.of(
                new SimpleColumn(
                    tableName, "column", TypeFactory.createSimpleType(TypeKind.TYPE_INT64))));

    List<String> tablePath = List.of("sample");

    assertThrows(
        CatalogResourceAlreadyExists.class,
        () ->
            CatalogOperations.createTableInCatalog(
                this.testCatalog,
                List.of(tablePath),
                "sample",
                newTable.getColumnList(),
                CreateMode.CREATE_DEFAULT));
  }

  @Test
  void testReplaceTable() {
    String tableName = "sample";
    SimpleTable newTable =
        new SimpleTable(
            tableName,
            List.of(
                new SimpleColumn(
                    tableName, "column", TypeFactory.createSimpleType(TypeKind.TYPE_INT64))));

    List<String> tablePath = List.of("sample");

    CatalogOperations.createTableInCatalog(
        this.testCatalog,
        List.of(tablePath),
        "sample",
        newTable.getColumnList(),
        CreateMode.CREATE_OR_REPLACE);

    Table foundTable =
        assertTableExists(this.testCatalog, tablePath, "Expected replaced table to exist");

    assertEquals(
        foundTable.getColumn(0).getType(),
        TypeFactory.createSimpleType(TypeKind.TYPE_INT64),
        "Expected table to have been replaced");
  }

  @Test
  void testCreateTableIfNotExists_ExistingTable() throws NotFoundException {
    String tableName = "sample";
    SimpleTable newTable =
        new SimpleTable(
            tableName,
            List.of(
                new SimpleColumn(
                    tableName, "column", TypeFactory.createSimpleType(TypeKind.TYPE_INT64))));

    List<String> sampleTablePath = List.of("sample");

    Table originalTable = this.testCatalog.findTable(sampleTablePath);

    CatalogOperations.createTableInCatalog(
        this.testCatalog,
        List.of(sampleTablePath),
        "sample",
        newTable.getColumnList(),
        CreateMode.CREATE_IF_NOT_EXISTS);

    Table foundTable =
        assertTableExists(
            this.testCatalog,
            sampleTablePath,
            "Expected table to still exist after CREATE IF NOT EXISTS");

    assertSame(
        originalTable,
        foundTable,
        "Expected existing table to not have changed after CREATE IF NOT EXISTS");
  }

  @Test
  void testCreateTableIfNotExists_NewTable() {
    String tableName = "newTable";
    SimpleTable newTable =
        new SimpleTable(
            tableName,
            List.of(
                new SimpleColumn(
                    tableName, "column", TypeFactory.createSimpleType(TypeKind.TYPE_INT64))));

    List<String> newTablePath = List.of("newTable");

    CatalogOperations.createTableInCatalog(
        this.testCatalog,
        List.of(newTablePath),
        "newTable",
        newTable.getColumnList(),
        CreateMode.CREATE_IF_NOT_EXISTS);

    assertTableExists(this.testCatalog, newTablePath, "Expected table to have been created");
  }

  private Function assertFunctionExists(SimpleCatalog catalog, String fullName, String message) {
    // TODO: switch to using SimpleCatalog.findFunction once available
    Function function = catalog.getFunctionByFullName(fullName);
    assertNotNull(function, message);
    return function;
  }

  private void assertFunctionDoesNotExist(SimpleCatalog catalog, String fullName, String message) {
    Function function = catalog.getFunctionByFullName(fullName);
    assertNull(function, message);
  }

  @Test
  void testCreateFunctionInCatalog() {
    FunctionInfo newFunction =
        FunctionInfo.newBuilder()
            .setNamePath(List.of("newFunction"))
            .setGroup("UDF")
            .setMode(ZetaSQLFunctions.FunctionEnums.Mode.SCALAR)
            .setSignatures(
                List.of(
                    new FunctionSignature(
                        new FunctionArgumentType(
                            TypeFactory.createSimpleType(TypeKind.TYPE_STRING)),
                        List.of(),
                        -1)))
            .build();

    List<String> newFunctionPath1 = List.of("newFunction");
    List<String> newFunctionPath2 = List.of("qualified", "newFunction");
    List<List<String>> newFunctionPaths = List.of(newFunctionPath1, newFunctionPath2);

    CatalogOperations.createFunctionInCatalog(
        this.testCatalog, newFunctionPaths, newFunction, CreateMode.CREATE_DEFAULT);

    SimpleCatalog qualifiedNestedCatalog = this.testCatalog.getCatalog("qualified", null);

    assertNotNull(
        qualifiedNestedCatalog,
        "Expected the nested catalog to exist after creating a resource in it");

    assertAll(
        () ->
            assertFunctionExists(
                this.testCatalog, "UDF:newFunction", "Expected created function to exist"),
        () ->
            assertFunctionExists(
                qualifiedNestedCatalog, "UDF:newFunction", "Expected created function to exist"));
  }

  @Test
  void testDeleteFunctionFromCatalog() {
    List<String> sampleFunctionPath = List.of("function");
    List<String> nestedSampleFunctionPath = List.of("nested", "function");

    List<List<String>> functionPathsToDelete =
        List.of(sampleFunctionPath, nestedSampleFunctionPath);
    CatalogOperations.deleteFunctionFromCatalog(this.testCatalog, functionPathsToDelete);

    assertAll(
        () ->
            assertFunctionDoesNotExist(
                this.testCatalog.getCatalog("nested", null),
                "UDF:function",
                "Expected function to have been deleted"),
        () ->
            assertFunctionDoesNotExist(
                this.testCatalog, "UDF:function", "Expected function to have been deleted"));
  }

  private TableValuedFunction assertTVFExists(SimpleCatalog catalog, String name, String message) {
    // TODO: switch to using SimpleCatalog.findTableValuedFunction once available
    TableValuedFunction tvf = catalog.getTVFByName(name);
    assertNotNull(tvf, message);
    return tvf;
  }

  private void assertTVFDoesNotExist(SimpleCatalog catalog, String name, String message) {
    TableValuedFunction tvf = catalog.getTVFByName(name);
    assertNull(tvf, message);
  }

  @Test
  void testCreateTVFInCatalog() {
    TVFInfo newTVF =
        TVFInfo.newBuilder()
            .setNamePath(ImmutableList.of("newTVF"))
            .setSignature(
                new FunctionSignature(
                    new FunctionArgumentType(
                        ZetaSQLFunctions.SignatureArgumentKind.ARG_TYPE_RELATION),
                    List.of(),
                    -1))
            .setOutputSchema(
                TVFRelation.createValueTableBased(
                    TypeFactory.createSimpleType(TypeKind.TYPE_STRING)))
            .build();

    List<String> newFunctionPath1 = List.of("newTVF");
    List<String> newFunctionPath2 = List.of("qualified", "newTVF");
    List<List<String>> newFunctionPaths = List.of(newFunctionPath1, newFunctionPath2);

    CatalogOperations.createTVFInCatalog(
        this.testCatalog, newFunctionPaths, newTVF, CreateMode.CREATE_DEFAULT);

    SimpleCatalog qualifiedNestedCatalog = this.testCatalog.getCatalog("qualified", null);

    assertNotNull(
        qualifiedNestedCatalog,
        "Expected the nested catalog to exist after creating a resource in it");

    assertAll(
        () -> assertTVFExists(this.testCatalog, "newTVF", "Expected created function to exist"),
        () ->
            assertTVFExists(
                qualifiedNestedCatalog, "newTVF", "Expected created function to exist"));
  }

  @Test
  void testDeleteTVFFromCatalog() {
    List<String> sampleFunctionPath = List.of("tvf");
    List<String> nestedSampleFunctionPath = List.of("nested", "tvf");

    List<List<String>> functionPathsToDelete =
        List.of(sampleFunctionPath, nestedSampleFunctionPath);
    CatalogOperations.deleteTVFFromCatalog(this.testCatalog, functionPathsToDelete);

    assertAll(
        () ->
            assertTVFDoesNotExist(
                this.testCatalog.getCatalog("nested", null),
                "tvf",
                "Expected function to have been deleted"),
        () ->
            assertTVFDoesNotExist(
                this.testCatalog, "tvf", "Expected function to have been deleted"));
  }

  private Procedure assertProcedureExists(
      SimpleCatalog catalog, List<String> procedurePath, String message) {
    return assertDoesNotThrow(() -> catalog.findProcedure(procedurePath), message);
  }

  private void assertProcedureDoesNotExist(
      SimpleCatalog catalog, List<String> procedurePath, String message) {
    assertThrows(NotFoundException.class, () -> catalog.findProcedure(procedurePath), message);
  }

  @Test
  void testCreateProcedureInCatalog() {
    ProcedureInfo newProcedure =
        new ProcedureInfo(
            ImmutableList.of("newProcedure"),
            new FunctionSignature(
                new FunctionArgumentType(ZetaSQLFunctions.SignatureArgumentKind.ARG_TYPE_VOID),
                List.of(),
                -1));

    List<String> newProcedurePath1 = List.of("newProcedure");
    List<String> newProcedurePath2 = List.of("qualified", "newProcedure");
    List<List<String>> newProcedurePaths = List.of(newProcedurePath1, newProcedurePath2);

    CatalogOperations.createProcedureInCatalog(
        this.testCatalog, newProcedurePaths, newProcedure, CreateMode.CREATE_DEFAULT);

    assertAll(
        () ->
            assertProcedureExists(
                this.testCatalog, newProcedurePath1, "Expected created procedure to exist"),
        () ->
            assertProcedureExists(
                this.testCatalog, newProcedurePath2, "Expected created procedure to exist"));
  }

  @Test
  void testDeleteProcedureFromCatalog() {
    List<String> sampleProcedurePath = List.of("procedure");
    List<String> nestedSampleProcedurePath = List.of("nested", "procedure");

    List<List<String>> pathsToDelete = List.of(sampleProcedurePath, nestedSampleProcedurePath);
    CatalogOperations.deleteProcedureFromCatalog(this.testCatalog, pathsToDelete);

    assertAll(
        () ->
            assertProcedureDoesNotExist(
                this.testCatalog, sampleProcedurePath, "Expected procedure to have been deleted"),
        () ->
            assertProcedureDoesNotExist(
                this.testCatalog,
                nestedSampleProcedurePath,
                "Expected procedure to have been deleted"));
  }

  @Test
  void testCopyCatalog() {
    SimpleCatalog copiedCatalog = CatalogOperations.copyCatalog(this.testCatalog);

    List<String> sampleTablePath = List.of("sample");
    List<String> nestedTablePath = List.of("nested", "sample");

    Table copiedTable =
        assertTableExists(
            copiedCatalog, sampleTablePath, "Existing table was not found in copied catalog");
    assertTableExists(
        copiedCatalog, nestedTablePath, "Existing table was not found in copied catalog");

    assertAll(
        () ->
            assertEquals(
                "sample",
                copiedTable.getName(),
                "Table name in copied catalog didn't match original"),
        () ->
            assertEquals(
                "column",
                copiedTable.getColumn(0).getName(),
                "Column name in copied catalog didn't match original"));
  }
}
