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
import com.google.zetasql.Procedure;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.TableValuedFunction;
import com.google.zetasql.TableValuedFunction.FixedOutputSchemaTVF;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.function.BiConsumer;

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

  private static void createResourceInCatalog(
      SimpleCatalog catalog,
      List<String> resourcePath,
      BiConsumer<SimpleCatalog, String> creator
  ) {
    if (resourcePath.size() > 1) {
      String nestedCatalogName = resourcePath.get(0);
      List<String> pathSuffix = resourcePath.subList(1, resourcePath.size());
      SimpleCatalog nestedCatalog = getOrCreateNestedCatalog(catalog, nestedCatalogName);
      createResourceInCatalog(nestedCatalog, pathSuffix, creator);
    } else {
      String resourceName = resourcePath.get(0);
      creator.accept(catalog, resourceName);
    }
  }

  private static void createResourceInCatalogWithMultiplePaths(
      SimpleCatalog catalog,
      List<List<String>> resourcePaths,
      BiConsumer<SimpleCatalog, String> creator
  ) {
    for (List<String> resourcePath : resourcePaths) {
      createResourceInCatalog(catalog, resourcePath, creator);
    }
  }

  public static void createTableInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> tablePaths,
      String fullTableName,
      List<SimpleColumn> columns
  ) {
    createResourceInCatalogWithMultiplePaths(
        rootCatalog,
        tablePaths,
        (finalCatalog, tableName) -> {
          SimpleTable table = new SimpleTable(tableName, columns);
          table.setFullName(fullTableName);
          finalCatalog.addSimpleTable(tableName, table);
        }
    );
  }

  public static void createFunctionInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> functionPaths,
      Function function
  ) {
    createResourceInCatalogWithMultiplePaths(
        rootCatalog,
        functionPaths,
        (finalCatalog, functionName) -> {
          Function finalFunction = new Function(
              List.of(functionName),
              function.getGroup(),
              function.getMode(),
              function.getSignatureList(),
              function.getOptions()
          );
          finalCatalog.addFunction(finalFunction);
        }
    );
  }

  public static void createTVFInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> functionPaths,
      TVFInfo tvfInfo
  ) {
    createResourceInCatalogWithMultiplePaths(
        rootCatalog,
        functionPaths,
        (finalCatalog, functionName) -> {
          TableValuedFunction tvf = new FixedOutputSchemaTVF(
              ImmutableList.of(functionName),
              tvfInfo.getSignature(),
              tvfInfo.getOutputSchema()
          );
          finalCatalog.addTableValuedFunction(tvf);
        }
    );
  }

  public static void createProcedureInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> procedurePaths,
      ProcedureInfo procedureInfo
  ) {
    createResourceInCatalogWithMultiplePaths(
        rootCatalog,
        procedurePaths,
        (finalCatalog, procedureName) -> {
          Procedure procedure = new Procedure(
              ImmutableList.of(procedureName),
              procedureInfo.getSignature()
          );
          finalCatalog.addProcedure(procedure);
        }
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
