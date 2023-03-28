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

package com.google.zetasql.toolkit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;

import com.google.common.collect.ImmutableList;
import com.google.zetasql.*;
import com.google.zetasql.TVFRelation.Column;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.resolvedast.ResolvedColumn;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import com.google.zetasql.resolvedast.ResolvedDropStmtEnums;
import com.google.zetasql.resolvedast.ResolvedNodes.*;
import com.google.zetasql.toolkit.catalog.CatalogTestUtils;
import com.google.zetasql.toolkit.catalog.CatalogWrapper;
import com.google.zetasql.toolkit.catalog.bigquery.TVFInfo;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class CatalogUpdaterVisitorTest {

  CatalogUpdaterVisitor visitor;

  @Mock CatalogWrapper catalog;

  SimpleTable exampleTable =
      new SimpleTable(
          "table",
          List.of(
              new SimpleColumn(
                  "table", "column", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))));

  @BeforeEach
  void init() {
    this.visitor = new CatalogUpdaterVisitor(catalog);
  }

  private void assertTableEqualsExample(SimpleTable table) {
    assertEquals(exampleTable.getName(), table.getName());
    assertEquals(exampleTable.getColumnCount(), table.getColumnCount());
    assertAll(
        () -> assertEquals(exampleTable.getColumn(0).getName(), table.getColumn(0).getName()),
        () -> assertEquals(exampleTable.getColumn(0).getType(), table.getColumn(0).getType()));
  }

  @Test
  void testCreateTableStmt() {
    ResolvedCreateTableStmt resolvedCreateTableStmt =
        ResolvedCreateTableStmt.builder()
            .setNamePath(List.of("table"))
            .setCreateScope(CreateScope.CREATE_DEFAULT_SCOPE)
            .setCreateMode(CreateMode.CREATE_DEFAULT)
            .setColumnDefinitionList(
                List.of(
                    ResolvedColumnDefinition.builder()
                        .setName("column")
                        .setType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING))
                        .setIsHidden(false)
                        .build()))
            .setIsValueTable(false)
            .build();

    resolvedCreateTableStmt.accept(visitor);

    ArgumentCaptor<SimpleTable> createdTableCaptor = ArgumentCaptor.forClass(SimpleTable.class);
    verify(catalog).register(createdTableCaptor.capture(), any(), any());

    SimpleTable createdTable = createdTableCaptor.getValue();

    assertTableEqualsExample(createdTable);
  }

  @Test
  void testCreateTableAsSelectStmt() {
    ResolvedColumn resolvedColumn =
        new ResolvedColumn(
            1, "table", "column", TypeFactory.createSimpleType(TypeKind.TYPE_STRING));
    ResolvedOutputColumn resolvedOutputColumn =
        ResolvedOutputColumn.builder().setName("column").setColumn(resolvedColumn).build();

    ResolvedCreateTableAsSelectStmt resolvedCreateTableAsSelectStmt =
        ResolvedCreateTableAsSelectStmt.builder()
            .setNamePath(List.of("table"))
            .setCreateScope(CreateScope.CREATE_DEFAULT_SCOPE)
            .setCreateMode(CreateMode.CREATE_DEFAULT)
            .setColumnDefinitionList(
                List.of(
                    ResolvedColumnDefinition.builder()
                        .setName("column")
                        .setType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING))
                        .setIsHidden(false)
                        .build()))
            .setOutputColumnList(List.of(resolvedOutputColumn))
            .setQuery(
                ResolvedSingleRowScan.builder().setColumnList(List.of(resolvedColumn)).build())
            .setIsValueTable(false)
            .build();

    resolvedCreateTableAsSelectStmt.accept(visitor);

    ArgumentCaptor<SimpleTable> createdTableCaptor = ArgumentCaptor.forClass(SimpleTable.class);
    verify(catalog).register(createdTableCaptor.capture(), any(), any());

    SimpleTable createdTable = createdTableCaptor.getValue();

    assertTableEqualsExample(createdTable);
  }

  @Test
  void testCreateExternalTableStmt() {
    ResolvedCreateExternalTableStmt resolvedCreateExternalTableStmt =
        ResolvedCreateExternalTableStmt.builder()
            .setNamePath(List.of("table"))
            .setCreateScope(CreateScope.CREATE_DEFAULT_SCOPE)
            .setCreateMode(CreateMode.CREATE_DEFAULT)
            .setColumnDefinitionList(
                List.of(
                    ResolvedColumnDefinition.builder()
                        .setName("column")
                        .setType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING))
                        .setIsHidden(false)
                        .build()))
            .setIsValueTable(false)
            .build();

    resolvedCreateExternalTableStmt.accept(visitor);

    ArgumentCaptor<SimpleTable> createdTableCaptor = ArgumentCaptor.forClass(SimpleTable.class);
    verify(catalog).register(createdTableCaptor.capture(), any(), any());

    SimpleTable createdTable = createdTableCaptor.getValue();

    assertTableEqualsExample(createdTable);
  }

  @Test
  void testCreateViewStmt() {
    ResolvedColumn resolvedColumn =
        new ResolvedColumn(
            1, "table", "column", TypeFactory.createSimpleType(TypeKind.TYPE_STRING));
    ResolvedOutputColumn resolvedOutputColumn =
        ResolvedOutputColumn.builder().setName("column").setColumn(resolvedColumn).build();

    ResolvedCreateViewStmt resolvedCreateViewStmt =
        ResolvedCreateViewStmt.builder()
            .setNamePath(List.of("table"))
            .setCreateScope(CreateScope.CREATE_DEFAULT_SCOPE)
            .setCreateMode(CreateMode.CREATE_DEFAULT)
            .setOutputColumnList(List.of(resolvedOutputColumn))
            .setQuery(
                ResolvedSingleRowScan.builder().setColumnList(List.of(resolvedColumn)).build())
            .setIsValueTable(false)
            .setHasExplicitColumns(true)
            .setRecursive(false)
            .build();

    resolvedCreateViewStmt.accept(visitor);

    ArgumentCaptor<SimpleTable> createdTableCaptor = ArgumentCaptor.forClass(SimpleTable.class);
    verify(catalog).register(createdTableCaptor.capture(), any(), any());

    SimpleTable createdTable = createdTableCaptor.getValue();

    assertTableEqualsExample(createdTable);
  }

  @Test
  void testCreateMaterializedViewStmt() {
    ResolvedColumn resolvedColumn =
        new ResolvedColumn(
            1, "table", "column", TypeFactory.createSimpleType(TypeKind.TYPE_STRING));
    ResolvedOutputColumn resolvedOutputColumn =
        ResolvedOutputColumn.builder().setName("column").setColumn(resolvedColumn).build();

    ResolvedCreateMaterializedViewStmt resolvedCreateMaterializedViewStmt =
        ResolvedCreateMaterializedViewStmt.builder()
            .setNamePath(List.of("table"))
            .setCreateScope(CreateScope.CREATE_DEFAULT_SCOPE)
            .setCreateMode(CreateMode.CREATE_DEFAULT)
            .setOutputColumnList(List.of(resolvedOutputColumn))
            .setQuery(
                ResolvedSingleRowScan.builder().setColumnList(List.of(resolvedColumn)).build())
            .setIsValueTable(false)
            .setHasExplicitColumns(true)
            .setRecursive(false)
            .build();

    resolvedCreateMaterializedViewStmt.accept(visitor);

    ArgumentCaptor<SimpleTable> createdTableCaptor = ArgumentCaptor.forClass(SimpleTable.class);
    verify(catalog).register(createdTableCaptor.capture(), any(), any());

    SimpleTable createdTable = createdTableCaptor.getValue();

    assertTableEqualsExample(createdTable);
  }

  @Test
  void testCreateFunction() {
    FunctionSignature signature =
        new FunctionSignature(
            new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING)),
            List.of(new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_INT64))),
            -1);

    Function expectedFunction =
        new Function(List.of("function"), "UDF", Mode.SCALAR, List.of(signature));

    ResolvedCreateFunctionStmt resolvedCreateFunctionStmt =
        ResolvedCreateFunctionStmt.builder()
            .setNamePath(List.of("function"))
            .setCreateScope(CreateScope.CREATE_DEFAULT_SCOPE)
            .setCreateMode(CreateMode.CREATE_DEFAULT)
            .setSignature(signature)
            .setHasExplicitReturnType(true)
            .setIsAggregate(false)
            .setIsRemote(false)
            .build();

    resolvedCreateFunctionStmt.accept(visitor);

    ArgumentCaptor<Function> createdFunctionCaptor = ArgumentCaptor.forClass(Function.class);
    verify(catalog).register(createdFunctionCaptor.capture(), any(), any());

    Function createdFunction = createdFunctionCaptor.getValue();

    assertAll(
        () -> assertIterableEquals(expectedFunction.getNamePath(), createdFunction.getNamePath()),
        () -> assertEquals(expectedFunction.getGroup(), createdFunction.getGroup()),
        () -> assertEquals(expectedFunction.getMode(), createdFunction.getMode()),
        () -> assertEquals(1, createdFunction.getSignatureList().size()),
        () ->
            assertTrue(
                CatalogTestUtils.functionSignatureEquals(
                    expectedFunction.getSignatureList().get(0),
                    createdFunction.getSignatureList().get(0))));
  }

  @Test
  void testCreateTVF() {
    FunctionSignature signature =
        new FunctionSignature(
            new FunctionArgumentType(SignatureArgumentKind.ARG_TYPE_RELATION),
            List.of(new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_INT64))),
            -1);

    TVFRelation tvfOutputSchema =
        TVFRelation.createColumnBased(
            List.of(Column.create("output", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))));

    TVFInfo expectedFunction = new TVFInfo(ImmutableList.of("tvf"), signature, tvfOutputSchema);

    ResolvedCreateTableFunctionStmt resolvedCreateTableFunctionStmt =
        ResolvedCreateTableFunctionStmt.builder()
            .setNamePath(List.of("tvf"))
            .setCreateScope(CreateScope.CREATE_DEFAULT_SCOPE)
            .setCreateMode(CreateMode.CREATE_DEFAULT)
            .setOutputColumnList(
                List.of(
                    ResolvedOutputColumn.builder()
                        .setName("output")
                        .setColumn(
                            new ResolvedColumn(
                                1,
                                "table",
                                "output",
                                TypeFactory.createSimpleType(TypeKind.TYPE_STRING)))
                        .build()))
            .setSignature(signature)
            .setIsValueTable(false)
            .setHasExplicitReturnSchema(true)
            .build();

    resolvedCreateTableFunctionStmt.accept(visitor);

    ArgumentCaptor<TVFInfo> createdFunctionCaptor = ArgumentCaptor.forClass(TVFInfo.class);
    verify(catalog).register(createdFunctionCaptor.capture(), any(), any());

    TVFInfo createdFunction = createdFunctionCaptor.getValue();

    assertAll(
        () -> assertIterableEquals(expectedFunction.getNamePath(), createdFunction.getNamePath()),
        () ->
            assertTrue(
                CatalogTestUtils.functionSignatureEquals(
                    expectedFunction.getSignature(), createdFunction.getSignature())),
        () -> assertEquals(expectedFunction.getOutputSchema(), createdFunction.getOutputSchema()));
  }

  @Test
  void testDropStmt() {
    ResolvedDropStmt dropStmt =
        ResolvedDropStmt.builder()
            .setDropMode(ResolvedDropStmtEnums.DropMode.DROP_MODE_UNSPECIFIED)
            .setNamePath(List.of("dataset", "table"))
            .setObjectType("TABLE")
            .setIsIfExists(false)
            .build();

    dropStmt.accept(visitor);

    ArgumentCaptor<String> droppedTableCaptor = ArgumentCaptor.forClass(String.class);
    verify(catalog).removeTable(droppedTableCaptor.capture());

    assertEquals("dataset.table", droppedTableCaptor.getValue());
  }
}
