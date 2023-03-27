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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import com.google.zetasql.*;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import com.google.zetasql.toolkit.catalog.CatalogTestUtils;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.InvalidBigQueryReference;
import com.google.zetasql.toolkit.catalog.exceptions.CatalogResourceAlreadyExists;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class BigQueryCatalogTest {

  final String testProjectId = "test-project-id";
  BigQueryCatalog bigQueryCatalog;
  @Mock BigQueryResourceProvider bigQueryResourceProviderMock;
  SimpleTable exampleTableInDefaultProject;

  SimpleTable exampleTableInNonDefaultProject;

  SimpleTable replacementTableInDefaultProject;

  Function exampleFunction =
      new Function(
          List.of(testProjectId, "dataset", "examplefunction"),
          "UDF",
          Mode.SCALAR,
          List.of(
              new FunctionSignature(
                  new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING)),
                  List.of(),
                  -1)));

  TVFInfo exampleTVF =
      new TVFInfo(
          ImmutableList.of(testProjectId, "dataset", "exampletvf"),
          new FunctionSignature(
              new FunctionArgumentType(SignatureArgumentKind.ARG_TYPE_RELATION), List.of(), -1),
          TVFRelation.createValueTableBased(TypeFactory.createSimpleType(TypeKind.TYPE_STRING)));

  ProcedureInfo exampleProcedure =
      new ProcedureInfo(
          ImmutableList.of(testProjectId, "dataset", "exampleprocedure"),
          new FunctionSignature(
              new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING)),
              List.of(),
              -1));

  @BeforeEach
  void init() {
    this.bigQueryCatalog =
        new BigQueryCatalog(this.testProjectId, this.bigQueryResourceProviderMock);
    this.setupExampleTables();
  }

  private void setupExampleTables() {
    String exampleTableName = "BigQueryTable";
    exampleTableInDefaultProject =
        new SimpleTable(
            exampleTableName,
            List.of(
                new SimpleColumn(
                    exampleTableName, "col1", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))));
    exampleTableInDefaultProject.setFullName(
        String.format("%s.dataset.%s", this.testProjectId, exampleTableName));

    exampleTableInNonDefaultProject =
        new SimpleTable(
            exampleTableInDefaultProject.getName(), exampleTableInDefaultProject.getColumnList());
    exampleTableInNonDefaultProject.setFullName(
        String.format("%s.dataset.%s", "another-project-id", exampleTableName));

    replacementTableInDefaultProject =
        new SimpleTable(
            exampleTableName,
            List.of(
                new SimpleColumn(
                    exampleTableName, "col1", TypeFactory.createSimpleType(TypeKind.TYPE_STRING)),
                new SimpleColumn(
                    exampleTableName, "col2", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))));
    replacementTableInDefaultProject.setFullName(
        String.format("%s.dataset.%s", this.testProjectId, exampleTableName));
  }

  private List<List<String>> buildPathsWhereResourceShouldBe(String resourceReference) {
    BigQueryReference ref = BigQueryReference.from(this.testProjectId, resourceReference);

    List<List<String>> fullyQualifiedPaths =
        List.of(
            List.of(ref.getProjectId() + "." + ref.getDatasetId() + "." + ref.getResourceName()),
            List.of(ref.getProjectId(), ref.getDatasetId() + "." + ref.getResourceName()),
            List.of(ref.getProjectId() + "." + ref.getDatasetId(), ref.getResourceName()),
            List.of(ref.getProjectId(), ref.getDatasetId(), ref.getResourceName()));

    List<List<String>> result = new ArrayList<>(fullyQualifiedPaths);

    if (ref.getProjectId().equals(this.testProjectId)) {
      List<List<String>> implicitProjectPaths =
          List.of(
              List.of(ref.getDatasetId() + "." + ref.getResourceName()),
              List.of(ref.getDatasetId(), ref.getResourceName()));
      result.addAll(implicitProjectPaths);
    }

    return result;
  }

  private Table assertTableExistsAtPaths(BigQueryCatalog catalog, List<List<String>> tablePaths) {
    Preconditions.checkNotNull(tablePaths, "Table paths cannot be null");
    Preconditions.checkElementIndex(0, tablePaths.size(), "Table paths cannot be empty");

    SimpleCatalog underlyingCatalog = catalog.getZetaSQLCatalog();

    Stream<Executable> assertions =
        tablePaths.stream()
            .map(
                tablePath ->
                    (() ->
                        assertDoesNotThrow(
                            () -> underlyingCatalog.findTable(tablePath),
                            String.format(
                                "Expected table to exist at path %s",
                                String.join(".", tablePath)))));

    assertAll(assertions);

    try {
      return underlyingCatalog.findTable(tablePaths.get(0));
    } catch (NotFoundException e) {
      throw new AssertionError(e);
    }
  }

  private void assertTableDoesNotExist(BigQueryCatalog catalog, List<List<String>> tablePaths) {
    Preconditions.checkNotNull(tablePaths, "Table paths cannot be null");
    Preconditions.checkElementIndex(0, tablePaths.size(), "Table paths cannot be empty");

    SimpleCatalog underlyingCatalog = catalog.getZetaSQLCatalog();

    Stream<Executable> assertions =
        tablePaths.stream()
            .map(
                tablePath ->
                    (() ->
                        assertThrows(
                            NotFoundException.class,
                            () -> underlyingCatalog.findTable(tablePath),
                            String.format(
                                "Expected table to not exist at path %s",
                                String.join(".", tablePath)))));

    assertAll(assertions);
  }

  @Test
  void testCatalogSupportsBigQueryTypeNames() {
    SimpleCatalog underlyingCatalog = this.bigQueryCatalog.getZetaSQLCatalog();

    Type integerType =
        assertDoesNotThrow(
            () -> underlyingCatalog.findType(List.of("INTEGER")),
            "BigQuery catalogs should support the INTEGER type name");
    Type decimalType =
        assertDoesNotThrow(
            () -> underlyingCatalog.findType(List.of("DECIMAL")),
            "BigQuery catalogs should support the DECIMAL type name");

    assertEquals(
        TypeKind.TYPE_INT64,
        integerType.getKind(),
        "BigQuery catalog's INTEGER type should be an alias for INT64");

    assertEquals(
        TypeKind.TYPE_NUMERIC,
        decimalType.getKind(),
        "BigQuery catalog's DECIMAL type should be an alias for NUMERIC");
  }

  @Test
  void testRegisterInvalidTableName() {
    String tableName = "TableName";
    String invalidFullName = "An.Invalid.BQ.Reference";
    SimpleTable table =
        new SimpleTable(
            tableName,
            List.of(
                new SimpleColumn(
                    tableName, "column", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))));
    table.setFullName(invalidFullName);

    when(this.bigQueryResourceProviderMock.getTables(anyString(), anyList()))
        .thenReturn(List.of(table));

    assertThrows(
        InvalidBigQueryReference.class,
        () ->
            this.bigQueryCatalog.register(
                table, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE),
        "Expected BigQueryCatalog to fail when registering a table with an invalid name");

    assertThrows(
        InvalidBigQueryReference.class,
        () -> this.bigQueryCatalog.addTable(invalidFullName),
        "Expected BigQueryCatalog to fail when adding a table with an invalid name");
  }

  @Test
  void testRegisterTableFromDefaultProject() {
    this.bigQueryCatalog.register(
        exampleTableInDefaultProject, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE);

    List<List<String>> pathsWhereTableShouldBe =
        this.buildPathsWhereResourceShouldBe(exampleTableInDefaultProject.getFullName());

    Table foundTable = assertTableExistsAtPaths(this.bigQueryCatalog, pathsWhereTableShouldBe);

    assertTrue(
        CatalogTestUtils.tableColumnsEqual(exampleTableInDefaultProject, foundTable),
        "Expected table created in Catalog to be equal to the original");
  }

  @Test
  void testRegisterTableFromNonDefaultProject() {
    this.bigQueryCatalog.register(
        exampleTableInNonDefaultProject,
        CreateMode.CREATE_DEFAULT,
        CreateScope.CREATE_DEFAULT_SCOPE);

    List<List<String>> pathsWhereTableShouldBe =
        this.buildPathsWhereResourceShouldBe(exampleTableInNonDefaultProject.getFullName());

    assertTableExistsAtPaths(this.bigQueryCatalog, pathsWhereTableShouldBe);

    BigQueryReference ref =
        BigQueryReference.from(this.testProjectId, exampleTableInNonDefaultProject.getFullName());
    List<String> pathWhereTableShouldNotBe = List.of(ref.getDatasetId(), ref.getResourceName());

    assertThrows(
        NotFoundException.class,
        () -> this.bigQueryCatalog.getZetaSQLCatalog().findTable(pathWhereTableShouldNotBe),
        "Expected table not in default project to not be available at DATASET.TABLE path");
  }

  @Test
  void testRemoveTable() {
    this.bigQueryCatalog.register(
        exampleTableInDefaultProject, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE);

    List<List<String>> pathsWhereTableShouldBe =
        this.buildPathsWhereResourceShouldBe(exampleTableInDefaultProject.getFullName());

    assertTableExistsAtPaths(this.bigQueryCatalog, pathsWhereTableShouldBe);

    this.bigQueryCatalog.removeTable(exampleTableInDefaultProject.getFullName());

    assertTableDoesNotExist(this.bigQueryCatalog, pathsWhereTableShouldBe);
  }

  @Test
  void testReplaceTable() {
    this.bigQueryCatalog.register(
        exampleTableInDefaultProject, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE);

    // Replace the table and validate it has been replaced
    this.bigQueryCatalog.register(
        replacementTableInDefaultProject,
        CreateMode.CREATE_OR_REPLACE,
        CreateScope.CREATE_DEFAULT_SCOPE);

    List<List<String>> pathsWhereTableShouldBe =
        this.buildPathsWhereResourceShouldBe(replacementTableInDefaultProject.getFullName());

    Table foundTable = assertTableExistsAtPaths(this.bigQueryCatalog, pathsWhereTableShouldBe);

    assertTrue(
        CatalogTestUtils.tableColumnsEqual(replacementTableInDefaultProject, foundTable),
        "Expected table created in Catalog to be equal to the original");
  }

  @Test
  void testTableAlreadyExists() {
    this.bigQueryCatalog.register(
        exampleTableInDefaultProject, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE);

    // Try to replace the table without using CreateMode.CREATE_OR_REPLACE
    Assertions.assertThrows(
        CatalogResourceAlreadyExists.class,
        () ->
            this.bigQueryCatalog.register(
                replacementTableInDefaultProject,
                CreateMode.CREATE_DEFAULT,
                CreateScope.CREATE_DEFAULT_SCOPE),
        "Expected fail creating table that already exists");
  }

  @Test
  void testAddTablesByName() {
    // When BigQueryResourceProvider.getTables() is called, return the test table
    when(bigQueryResourceProviderMock.getTables(anyString(), anyList()))
        .thenReturn(List.of(exampleTableInDefaultProject));

    // Add the tables by name
    bigQueryCatalog.addTables(List.of(exampleTableInDefaultProject.getFullName()));

    // Verify the BigQueryCatalog got the tables from the BigQueryResourceProvider
    verify(bigQueryResourceProviderMock, times(1)).getTables(anyString(), anyList());

    // Verify the test table was added to the catalog
    List<List<String>> pathsWhereTableShouldBe =
        this.buildPathsWhereResourceShouldBe(exampleTableInDefaultProject.getFullName());
    assertTableExistsAtPaths(bigQueryCatalog, pathsWhereTableShouldBe);
  }

  @Test
  void testAddAllTablesInDataset() {
    when(bigQueryResourceProviderMock.getAllTablesInDataset(anyString(), anyString()))
        .thenReturn(List.of(exampleTableInDefaultProject));

    bigQueryCatalog.addAllTablesInDataset(testProjectId, "dataset");

    verify(bigQueryResourceProviderMock, times(1)).getAllTablesInDataset(anyString(), anyString());

    List<List<String>> pathsWhereTableShouldBe =
        this.buildPathsWhereResourceShouldBe(exampleTableInDefaultProject.getFullName());
    assertTableExistsAtPaths(bigQueryCatalog, pathsWhereTableShouldBe);
  }

  @Test
  void testAddAllTablesInProject() {
    when(bigQueryResourceProviderMock.getAllTablesInProject(anyString()))
        .thenReturn(List.of(exampleTableInDefaultProject));

    bigQueryCatalog.addAllTablesInProject(testProjectId);

    verify(bigQueryResourceProviderMock, times(1)).getAllTablesInProject(anyString());

    List<List<String>> pathsWhereTableShouldBe =
        this.buildPathsWhereResourceShouldBe(exampleTableInDefaultProject.getFullName());
    Table foundTable = assertTableExistsAtPaths(bigQueryCatalog, pathsWhereTableShouldBe);
  }

  @Test
  void testCopy() {
    BigQueryCatalog copy = this.bigQueryCatalog.copy();

    assertAll(
        () -> assertNotSame(this.bigQueryCatalog, copy),
        () -> assertNotSame(this.bigQueryCatalog.getZetaSQLCatalog(), copy.getZetaSQLCatalog()));
  }

  @Test
  void testRegisterProcedure() {
    this.bigQueryCatalog.register(
        exampleProcedure, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE);

    SimpleCatalog underlyingCatalog = this.bigQueryCatalog.getZetaSQLCatalog();
    assertDoesNotThrow(
        () -> underlyingCatalog.findProcedure(exampleProcedure.getNamePath()),
        String.format(
            "Expected procedure to exist at path %s",
            String.join(".", exampleFunction.getNamePath())));
  }
}
