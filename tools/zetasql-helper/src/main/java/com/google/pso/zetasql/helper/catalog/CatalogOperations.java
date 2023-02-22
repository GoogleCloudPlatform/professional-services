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
package com.google.pso.zetasql.helper.catalog;

import com.google.common.collect.ImmutableList;
import com.google.pso.zetasql.helper.catalog.bigquery.ProcedureInfo;
import com.google.pso.zetasql.helper.catalog.bigquery.TVFInfo;
import com.google.zetasql.Function;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionProtos.TableValuedFunctionOptionsProto;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.Procedure;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.TableValuedFunction;
import com.google.zetasql.TableValuedFunction.FixedOutputSchemaTVF;
import com.google.zetasql.Type;
import com.google.zetasql.ZetaSQLFunctions;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateFunctionStmt;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public class CatalogOperations {
  // TODO: All catalog operations respect ZetaSQL's case-insensitivity for now
  //  Determine if we should make user able to choose case insensitivity

  private CatalogOperations() {}

  public static SimpleTable buildSimpleTable(String fullTableName, List<SimpleColumn> columns) {
    List<String> tablePath = Arrays.asList(fullTableName.split("\\."));
    String tableName = tablePath.get(tablePath.size() - 1);
    SimpleTable table = new SimpleTable(tableName, columns);
    table.setFullName(fullTableName);
    return table;
  }

  // Get a child catalog from an existing catalog, creating it if it does not exist
  private static SimpleCatalog getOrCreateNestedCatalog(SimpleCatalog parent, String name) {
    Optional<SimpleCatalog> maybeExistingCatalog =
        parent.getCatalogList().stream()
            .filter(catalog -> catalog.getFullName().equalsIgnoreCase(name))
            .findFirst();

    return maybeExistingCatalog.orElseGet(() -> {
      SimpleCatalog newCatalog = new SimpleCatalog(name);
      parent.addSimpleCatalog(newCatalog);
      return newCatalog;
    });
  }

  private static void createTableInCatalogImpl(
      SimpleCatalog catalog,
      List<String> tablePath,
      String fullTableName,
      List<SimpleColumn> columns
  ) {
    if (tablePath.size() > 1) {
      String nestedCatalogName = tablePath.get(0);
      List<String> pathSuffix = tablePath.subList(1, tablePath.size());
      SimpleCatalog nestedCatalog = getOrCreateNestedCatalog(catalog, nestedCatalogName);
      createTableInCatalogImpl(nestedCatalog, pathSuffix, fullTableName, columns);
    } else {
      String tableName = tablePath.get(0);
      SimpleTable table = new SimpleTable(tableName, columns);
      table.setFullName(fullTableName);
      catalog.addSimpleTable(table);
    }
  }

  public static void createTableInCatalog(
      SimpleCatalog catalog,
      List<List<String>> tablePaths,
      List<SimpleColumn> columns
  ) {
    tablePaths.forEach(tablePath -> {
          String fullTableName = String.join(".", tablePath);
          createTableInCatalogImpl(catalog, tablePath, fullTableName, columns);
        }
    );
  }

  private static void createFunctionInCatalogImpl(
      SimpleCatalog catalog,
      List<String> functionPath,
      Function function
  ) {
    if (functionPath.size() > 1) {
      String nestedCatalogName = functionPath.get(0);
      List<String> pathSuffix = functionPath.subList(1, functionPath.size());
      SimpleCatalog nestedCatalog = getOrCreateNestedCatalog(catalog, nestedCatalogName);
      createFunctionInCatalogImpl(nestedCatalog, pathSuffix, function);
    } else {
      Function fixedPathFunction = new Function(
          functionPath,
          function.getGroup(),
          function.getMode(),
          function.getSignatureList(),
          function.getOptions()
      );
      catalog.addFunction(fixedPathFunction);
    }
  }

  public static void createFunctionInCatalog(
      SimpleCatalog catalog,
      List<List<String>> functionPaths,
      Function function
  ) {
    functionPaths.forEach(
        functionPath -> createFunctionInCatalogImpl(catalog, functionPath, function)
    );
  }

  private static void createTVFInCatalogImpl(
      SimpleCatalog catalog,
      List<String> functionPath,
      TVFInfo tvfInfo
  ) {
    if (functionPath.size() > 1) {
      String nestedCatalogName = functionPath.get(0);
      List<String> pathSuffix = functionPath.subList(1, functionPath.size());
      SimpleCatalog nestedCatalog = getOrCreateNestedCatalog(catalog, nestedCatalogName);
      createTVFInCatalogImpl(nestedCatalog, pathSuffix, tvfInfo);
    } else {
      TableValuedFunction tvf = new FixedOutputSchemaTVF(
          ImmutableList.copyOf(functionPath),
          tvfInfo.getSignature(),
          tvfInfo.getOutputSchema()
      );
      catalog.addTableValuedFunction(tvf);
    }
  }

  public static void createTVFInCatalog(
      SimpleCatalog catalog,
      List<List<String>> functionPaths,
      TVFInfo tvfInfo
  ) {
    functionPaths.forEach(
        functionPath -> createTVFInCatalogImpl(catalog, functionPath, tvfInfo)
    );
  }

  private static void createProcedureInCatalogImpl(
      SimpleCatalog catalog,
      List<String> procedurePath,
      ProcedureInfo procedureInfo
  ) {
    if (procedurePath.size() > 1) {
      String nestedCatalogName = procedurePath.get(0);
      List<String> pathSuffix = procedurePath.subList(1, procedurePath.size());
      SimpleCatalog nestedCatalog = getOrCreateNestedCatalog(catalog, nestedCatalogName);
      createProcedureInCatalogImpl(nestedCatalog, pathSuffix, procedureInfo);
    } else {
      Procedure procedure = new Procedure(
          ImmutableList.copyOf(procedurePath),
          procedureInfo.getSignature()
      );
      catalog.addProcedure(procedure);
    }
  }

  public static void createProcedureInCatalog(
      SimpleCatalog catalog,
      List<List<String>> procedurePaths,
      ProcedureInfo procedureInfo
  ) {
    procedurePaths.forEach(
        functionPath -> createProcedureInCatalogImpl(catalog, functionPath, procedureInfo)
    );
  }

  private static SimpleTable copyTable(SimpleTable table) {
      SimpleTable newTable = new SimpleTable(table.getName(), table.getColumnList());
      newTable.setFullName(table.getFullName());
      newTable.setIsValueTable(table.isValueTable());
      newTable.setAllowAnonymousColumnName(table.allowAnonymousColumnName());
      newTable.setAllowDuplicateColumnNames(table.allowDuplicateColumnNames());
      newTable.setUserIdColumn(table.userIdColumn());
      table.getPrimaryKey().ifPresent(newTable::setPrimaryKey);
      return newTable;
  }

  public static SimpleCatalog copyCatalog(SimpleCatalog sourceCatalog, boolean deepCopy) {
    // TODO: Constants are currently not copied over because SimpleCatalog.getConstant()
    //  is protected and SimpleCatalog.getConstantList() isn't implemented.
    //  To my knowledge, they should be available like any other getX() and getXList().
    //  Do we need to submit a change to ZetaSQL to make these methods available?

    SimpleCatalog newCatalog = new SimpleCatalog(
        sourceCatalog.getFullName(), sourceCatalog.getTypeFactory()
    );

    // Copy sub-catalogs recursively
    sourceCatalog.getCatalogList()
        .stream()
        .map(catalog -> copyCatalog(catalog, deepCopy))
        .forEach(newCatalog::addSimpleCatalog);

    // Copy tables
    // The table objects are copied themselves if we're doing a deep copy
    // because SimpleTables are mutable
    sourceCatalog.getTableList()
        .stream()
        .map(table -> deepCopy ? copyTable(table) : table)
        .forEach(newCatalog::addSimpleTable);

    // Copy Functions and Types
    // Functions and Types are immutable, so we don't need to copy them when doing a deep copy
    sourceCatalog.getFunctionList().forEach(newCatalog::addFunction);
    sourceCatalog.getProcedureList().forEach(newCatalog::addProcedure);
    sourceCatalog.getTVFList().forEach(newCatalog::addTableValuedFunction);
    sourceCatalog.getTypeList().forEach(type -> newCatalog.addType(type.typeName(), type));

    return newCatalog;
  }

}
