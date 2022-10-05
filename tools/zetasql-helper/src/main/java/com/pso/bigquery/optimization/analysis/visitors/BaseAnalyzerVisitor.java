/*
 * Copyright 2022 Google LLC All Rights Reserved
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
package com.pso.bigquery.optimization.analysis.visitors;

import com.google.api.services.bigquery.model.TableReference;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.ZetaSQLFunctions;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateFunctionStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableAsSelectStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableStmtBase;
import com.google.zetasql.resolvedast.ResolvedNodes.Visitor;
import com.pso.bigquery.optimization.catalog.BigQueryTableParser;
import com.pso.bigquery.optimization.catalog.CatalogUtils;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Base class for Visitors created in the project. It handles keeping the catalog up to date when
 * the SQl we're parsing creates tables or functions. This is necessary for parsing anything that,
 * for example, relies on creating TEMP tables and later using them (very common).
 */
public class BaseAnalyzerVisitor extends Visitor {
  // TODO: Consider composition instead of inheritance to achieve this
  //      It would make it more sensible to create complex visitors
  //      Using this functionality.

  private final String projectId;
  private final SimpleCatalog catalog;

  public BaseAnalyzerVisitor(String projectId, SimpleCatalog catalog) {
    this.projectId = projectId;
    this.catalog = catalog;
  }

  public String getProjectId() {
    return projectId;
  }

  public SimpleCatalog getCatalog() {
    return catalog;
  }

  // CREATE [TEMP|TEMPORARY] TABLE

  private List<SimpleColumn> extractColumnsFromCreateTableStmt(
      String tableName, ResolvedCreateTableStmtBase resolvedCreateTableStmtBase) {
    return resolvedCreateTableStmtBase.getColumnDefinitionList().stream()
        .map(definition -> new SimpleColumn(tableName, definition.getName(), definition.getType()))
        .collect(Collectors.toList());
  }

  @Override
  public void visit(ResolvedCreateTableStmt createTableStmt) {
    List<String> tableNamePath = createTableStmt.getNamePath();
    String tableName = tableNamePath.get(tableNamePath.size() - 1);

    List<SimpleColumn> columns = this.extractColumnsFromCreateTableStmt(tableName, createTableStmt);

    visitResolvedCreateTable(tableNamePath, tableName, columns);
  }

  @Override
  public void visit(ResolvedCreateTableAsSelectStmt createTableAsSelectStmt) {
    List<String> tableNamePath = createTableAsSelectStmt.getNamePath();
    String tableName = tableNamePath.get(tableNamePath.size() - 1);

    List<SimpleColumn> columns =
        this.extractColumnsFromCreateTableStmt(tableName, createTableAsSelectStmt);

    visitResolvedCreateTable(tableNamePath, tableName, columns);
  }

  public void visitResolvedCreateTable(
      List<String> tableNamePath, String tableName, List<SimpleColumn> columns) {
    if (tableNamePath.size() == 1) {
      CatalogUtils.createTableInCatalog(this.catalog, tableName, columns);
    } else {
      String tableId = String.join(".", tableNamePath);
      TableReference tableRef = BigQueryTableParser.fromTableId(this.projectId, tableId).get();

      CatalogUtils.createTableInCatalog(
          this.catalog,
          tableRef.getProjectId(),
          tableRef.getDatasetId(),
          tableRef.getTableId(),
          columns);
    }
  }

  // CREATE [TEMP|TEMPORARY] FUNCTION
  public void visit(ResolvedCreateFunctionStmt createFunctionStmt) {
    CatalogUtils.createFunctionInCatalog(
        this.catalog,
        createFunctionStmt.getNamePath(),
        "UDF",
        ZetaSQLFunctions.FunctionEnums.Mode.SCALAR,
        createFunctionStmt.getSignature());
  }
}
