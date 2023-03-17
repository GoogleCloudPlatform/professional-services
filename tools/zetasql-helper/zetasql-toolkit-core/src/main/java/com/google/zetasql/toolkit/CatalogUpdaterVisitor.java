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

import com.google.zetasql.Function;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.TVFRelation;
import com.google.zetasql.TVFRelation.Column;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateExternalTableStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateFunctionStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateMaterializedViewStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateProcedureStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableAsSelectStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableFunctionStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableStmtBase;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateViewBase;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateViewStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedOutputColumn;
import com.google.zetasql.resolvedast.ResolvedNodes.Visitor;
import com.google.zetasql.toolkit.catalog.CatalogOperations;
import com.google.zetasql.toolkit.catalog.CatalogWrapper;
import com.google.zetasql.toolkit.catalog.bigquery.ProcedureInfo;
import com.google.zetasql.toolkit.catalog.bigquery.TVFInfo;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ResolvedNodes.Visitor that creates catalog resources based on the ResolvedCreate* statements it
 * visits. Supports:
 *
 * <ul>
 *   <li>ResolvedCrateTableStmt
 *   <li>ResolvedCreateTableAsSelectStmt
 *   <li>ResolvedCreateExternalTableStmt
 *   <li>ResolvedCreateViewStmt
 *   <li>ResolvedCreateMaterializedViewStmt
 *   <li>ResolvedCreateFunctionStmt
 *   <li>ResolvedCreateTableFunctionStmt
 *   <li>ResolvedCreateProcedureStmt
 * </ul>
 */
class CatalogUpdaterVisitor extends Visitor {

  private final CatalogWrapper catalog;

  /**
   * Constructor for a CatalogUpdateVisitor.
   *
   * @param catalog The CatalogWrapper being used to maintain the catalog
   */
  public CatalogUpdaterVisitor(CatalogWrapper catalog) {
    this.catalog = catalog;
  }

  /**
   * Creates the ZetaSQL columns associated to a ResolvedCreateTableStmtBase
   *
   * @param createTableStmtBase The analyzed statement from which to get the columns
   */
  private List<SimpleColumn> getColumnsFromCreateTableStmt(
      ResolvedCreateTableStmtBase createTableStmtBase) {

    List<String> tableNamePath = createTableStmtBase.getNamePath();
    String tableName = tableNamePath.get(tableNamePath.size() - 1);

    return createTableStmtBase.getColumnDefinitionList().stream()
        .map(definition -> new SimpleColumn(tableName, definition.getName(), definition.getType()))
        .collect(Collectors.toList());
  }

  /**
   * Creates the table associated with a ResolvedCreateTableStmtBase node in the catalog.
   *
   * @param createTableStmtBase The analyzed statement to create the table from
   */
  private void visitCreateTableBase(ResolvedCreateTableStmtBase createTableStmtBase) {
    List<SimpleColumn> columns = this.getColumnsFromCreateTableStmt(createTableStmtBase);
    SimpleTable table =
        CatalogOperations.buildSimpleTable(
            String.join(".", createTableStmtBase.getNamePath()), columns);

    CreateMode createMode = createTableStmtBase.getCreateMode();
    CreateScope createScope = createTableStmtBase.getCreateScope();

    this.catalog.register(table, createMode, createScope);
  }

  /**
   * Visits a ResolvedCreateTableStmt and creates the table in the catalog.
   *
   * @param createTableStmt The analyzed statement to create the table from
   */
  @Override
  public void visit(ResolvedCreateTableStmt createTableStmt) {
    this.visitCreateTableBase(createTableStmt);
  }

  /**
   * Visits a ResolvedCreateTableAsSelectStmt and creates the table in the catalog.
   *
   * @param createTableAsSelectStmt The analyzed statement to create the table from
   */
  @Override
  public void visit(ResolvedCreateTableAsSelectStmt createTableAsSelectStmt) {
    this.visitCreateTableBase(createTableAsSelectStmt);
  }

  /**
   * Visits a ResolvedCreateExternalTableStmt and creates the table in the catalog.
   *
   * @param createExternalTableStmt The analyzed statement to create the table from
   */
  @Override
  public void visit(ResolvedCreateExternalTableStmt createExternalTableStmt) {
    this.visitCreateTableBase(createExternalTableStmt);
  }

  /**
   * Creates the ZetaSQL columns associated to a ResolvedCreateViewBase statement
   *
   * @param createViewBase The analyzed statement from which to get the columns
   */
  private List<SimpleColumn> getColumnsFromCreateViewBase(ResolvedCreateViewBase createViewBase) {

    List<String> tableNamePath = createViewBase.getNamePath();
    String tableName = tableNamePath.get(tableNamePath.size() - 1);

    return createViewBase.getOutputColumnList().stream()
        .map(ResolvedOutputColumn::getColumn)
        .map(definition -> new SimpleColumn(tableName, definition.getName(), definition.getType()))
        .collect(Collectors.toList());
  }

  /**
   * Creates the table associated with a ResolvedCreateViewBase node in the catalog.
   *
   * @param createViewBase The analyzed statement to create the table from
   */
  private void visitCreateViewBase(ResolvedCreateViewBase createViewBase) {
    List<SimpleColumn> columns = this.getColumnsFromCreateViewBase(createViewBase);
    SimpleTable table =
        CatalogOperations.buildSimpleTable(String.join(".", createViewBase.getNamePath()), columns);

    CreateMode createMode = createViewBase.getCreateMode();
    CreateScope createScope = createViewBase.getCreateScope();

    this.catalog.register(table, createMode, createScope);
  }

  /**
   * Visits a ResolvedCreateViewStmt and creates the table in the catalog.
   *
   * @param createViewStmt The analyzed statement to create the table from
   */
  @Override
  public void visit(ResolvedCreateViewStmt createViewStmt) {
    this.visitCreateViewBase(createViewStmt);
  }

  /**
   * Visits a ResolvedCreateMaterializedViewStmt and creates the table in the catalog.
   *
   * @param createMaterializedViewStmt The analyzed statement to create the table from
   */
  @Override
  public void visit(ResolvedCreateMaterializedViewStmt createMaterializedViewStmt) {
    this.visitCreateViewBase(createMaterializedViewStmt);
  }

  /**
   * Visits a ResolvedCreateFunctionStmt and creates the function in the catalog.
   *
   * @param createFunctionStmt The analyzed statement to create the function from
   */
  @Override
  public void visit(ResolvedCreateFunctionStmt createFunctionStmt) {
    Function function =
        new Function(
            createFunctionStmt.getNamePath(),
            "UDF",
            Mode.SCALAR,
            List.of(createFunctionStmt.getSignature()));

    CreateMode createMode = createFunctionStmt.getCreateMode();
    CreateScope createScope = createFunctionStmt.getCreateScope();

    catalog.register(function, createMode, createScope);
  }

  /**
   * Visits a ResolvedCreateTableFunctionStmt and creates the TVF in the catalog.
   *
   * @param createTableFunctionStmt The analyzed statement to create the TVF from
   */
  @Override
  public void visit(ResolvedCreateTableFunctionStmt createTableFunctionStmt) {
    List<Column> outputSchemaColumns =
        createTableFunctionStmt.getOutputColumnList().stream()
            .map(
                resolvedOutputColumn ->
                    Column.create(
                        resolvedOutputColumn.getName(), resolvedOutputColumn.getColumn().getType()))
            .collect(Collectors.toList());

    TVFInfo tvfInfo =
        new TVFInfo(
            createTableFunctionStmt.getNamePath(),
            createTableFunctionStmt.getSignature(),
            TVFRelation.createColumnBased(outputSchemaColumns));

    CreateMode createMode = createTableFunctionStmt.getCreateMode();

    catalog.register(tvfInfo, createMode, CreateScope.CREATE_DEFAULT_SCOPE);
  }

  /**
   * Visits a ResolvedCreateProcedureStmt and creates the procedure in the catalog.
   *
   * <p>The return type for procedures is set to TYPE_STRING rather than ARG_TYPE_VOID because the
   * ZetaSQL analyzer cannot analyze signatures that return void.
   *
   * @param createProcedureStmt The analyzed statement to create the procedure from
   */
  @Override
  public void visit(ResolvedCreateProcedureStmt createProcedureStmt) {
    FunctionArgumentType returnType =
        new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING));

    FunctionSignature signature =
        new FunctionSignature(
            returnType, createProcedureStmt.getSignature().getFunctionArgumentList(), -1);

    ProcedureInfo procedureInfo = new ProcedureInfo(createProcedureStmt.getNamePath(), signature);

    CreateMode createMode = createProcedureStmt.getCreateMode();
    CreateScope createScope = createProcedureStmt.getCreateScope();

    catalog.register(procedureInfo, createMode, createScope);
  }
}
