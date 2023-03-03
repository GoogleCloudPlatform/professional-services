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

package com.google.pso.zetasql.helper.catalog;

import com.google.common.collect.ImmutableList;
import com.google.pso.zetasql.helper.catalog.bigquery.ProcedureInfo;
import com.google.pso.zetasql.helper.catalog.bigquery.TVFInfo;
import com.google.pso.zetasql.helper.catalog.exceptions.CatalogResourceAlreadyExists;
import com.google.zetasql.Function;
import com.google.zetasql.NotFoundException;
import com.google.zetasql.Procedure;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.TableValuedFunction;
import com.google.zetasql.TableValuedFunction.FixedOutputSchemaTVF;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Utility class that exposes static methods for performing various operations on
 * ZetaSQL SimpleCatalogs and related resources. Supports:
 * <ul>
 *   <li> Building properly configured SimpleTable objects
 *   <li> Adding tables, functions, TVFs and procedures to SimpleCatalogs
 *   <li> Creating copies of SimpleCatalogs
 * </ul>
 */
public class CatalogOperations {
  // TODO: Determine how resources with the same name and different casing should be handled.
  //  Currently, how colliding resources behave depends on the CreateMode when adding them to
  //  the SimpleCatalog. If the CreateMode is CREATE_OR_REPLACE, the resource is be replaced;
  //  for other CreateModes, CatalogResourceAlreadyExists is thrown.

  private CatalogOperations() {}

  /**
   * Builds a properly configured SimpleTable object
   *
   * @param fullTableName The full name for the table, e.g. "project.dataset.table"
   * @param columns The list of columns for the table
   * @return The created SimpleTable object
   */
  public static SimpleTable buildSimpleTable(String fullTableName, List<SimpleColumn> columns) {
    List<String> tablePath = Arrays.asList(fullTableName.split("\\."));
    String tableName = tablePath.get(tablePath.size() - 1);
    SimpleTable table = new SimpleTable(tableName, columns);
    table.setFullName(fullTableName);
    return table;
  }

  /** Get a child catalog from an existing catalog, creating it if it does not exist */
  private static SimpleCatalog getOrCreateNestedCatalog(SimpleCatalog parent, String name) {
    Optional<SimpleCatalog> maybeExistingCatalog =
        parent.getCatalogList().stream()
            .filter(catalog -> catalog.getFullName().equalsIgnoreCase(name))
            .findFirst();

    return maybeExistingCatalog.orElseGet(() -> parent.addNewSimpleCatalog(name));
  }

  /** Returns true if a table named tableName exists in the SimpleCatalog */
  private static boolean tableExists(
      SimpleCatalog catalog,
      String tableName
  ) {
    try {
      catalog.findTable(List.of(tableName));
      return true;
    } catch(NotFoundException err) {
      return false;
    }
  }

  /** Returns true if the Function exists in the SimpleCatalog */
  private static boolean functionExists(SimpleCatalog catalog, Function function) {
    // TODO: switch to using Catalog.findFunction once available
    String fullName = function.getFullName();
    return catalog.getFunctionNameList().contains(fullName);
  }

  /** Returns true if the TVF exists in the SimpleCatalog */
  private static boolean tvfExists(SimpleCatalog catalog, TableValuedFunction tvf) {
    String name = tvf.getName();
    return catalog.getTVFNameList().contains(name);
  }

  /** Returns true if the Procedure exists in the SimpleCatalog */
  private static boolean procedureExists(SimpleCatalog catalog, Procedure procedure) {
    return catalog
        .getProcedureList()
        .stream()
        .map(Procedure::getName)
        .anyMatch(name -> name.equalsIgnoreCase(procedure.getName()));
  }

  /**
   * Gets the SimpleCatalog in which a resource should be created, based on the root catalog
   * and the resource path.
   *
   * <p> The path for the resource determines whether it should be created in the root catalog
   * itself or in a nested catalog. For example; a resource with the path ["A.B"] should be
   * created in the root catalog, but a resource with the path ["A", "B"] should be created
   * in an "A" catalog nested in the root catalog.
   *
   * @param rootCatalog The root SimpleCatalog the analyzer will use
   * @param resourcePath The path for the resource
   * @return The SimpleCatalog object where the resource should be created
   */
  private static SimpleCatalog getCatalogInWhichToCreateResource(
      SimpleCatalog rootCatalog,
      List<String> resourcePath
  ) {
    if (resourcePath.size() > 1) {
      String nestedCatalogName = resourcePath.get(0);
      List<String> pathSuffix = resourcePath.subList(1, resourcePath.size());
      SimpleCatalog nestedCatalog = getOrCreateNestedCatalog(rootCatalog, nestedCatalogName);
      return getCatalogInWhichToCreateResource(nestedCatalog, pathSuffix);
    } else {
      return rootCatalog;
    }
  }

  /**
   * Creates a table in a SimpleCatalog using the provided paths and complying with the
   * provided CreateMode.
   *
   * @param rootCatalog The root SimpleCatalog in which to create the table.
   * @param tablePaths The table paths to create the table at. If multiple paths are provided,
   * multiple copies of the table will be registered in the catalog.
   * @param fullTableName The full name of the table to create.
   * @param columns The list of columns for the table
   * @param createMode The CreateMode to use
   * @throws CatalogResourceAlreadyExists if the table already exists at any of the provided
   * paths and CreateMode != CREATE_OR_REPLACE.
   */
  public static void createTableInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> tablePaths,
      String fullTableName,
      List<SimpleColumn> columns,
      CreateMode createMode
  ) {
    for (List<String> tablePath : tablePaths) {
      String tableName = tablePath.get(tablePath.size() - 1);
      SimpleCatalog catalogForCreation = getCatalogInWhichToCreateResource(rootCatalog, tablePath);

      boolean exists = tableExists(catalogForCreation, tableName);
      boolean replace = createMode.equals(CreateMode.CREATE_OR_REPLACE);

      if(exists && replace) {
        catalogForCreation.removeSimpleTable(tableName);
      }

      if(exists && !replace) {
        throw new CatalogResourceAlreadyExists(fullTableName);
      }

      SimpleTable table = new SimpleTable(fullTableName, columns);
      table.setFullName(fullTableName);
      catalogForCreation.addSimpleTable(tableName, table);
    }
  }

  /**
   * Creates a function in a SimpleCatalog using the provided paths and complying with the
   * provided CreateMode.
   *
   * @param rootCatalog The root SimpleCatalog in which to create the function.
   * @param functionPaths The function paths to create the function at. If multiple paths are
   * provided, multiple copies of the function will be registered in the catalog.
   * @param function The Function object representing the function that should be created
   * @param createMode The CreateMode to use
   * @throws CatalogResourceAlreadyExists if the function already exists at any of the provided
   * paths and CreateMode != CREATE_OR_REPLACE.
   */
  public static void createFunctionInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> functionPaths,
      Function function,
      CreateMode createMode
  ) {
    for (List<String> functionPath : functionPaths) {
      String functionName = functionPath.get(functionPath.size() - 1);
      SimpleCatalog catalogForCreation = getCatalogInWhichToCreateResource(
          rootCatalog, functionPath
      );

      Function finalFunction = new Function(
          List.of(functionName),
          function.getGroup(),
          function.getMode(),
          function.getSignatureList(),
          function.getOptions()
      );

      boolean exists = functionExists(catalogForCreation, finalFunction);
      boolean replace = createMode.equals(CreateMode.CREATE_OR_REPLACE);

      if(exists && replace) {
        catalogForCreation.removeFunction(finalFunction.getFullName());
      }

      if(exists && !replace) {
        throw new CatalogResourceAlreadyExists(finalFunction.getFullName());
      }

      catalogForCreation.addFunction(finalFunction);
    }
  }

  /**
   * Creates a TVF in a SimpleCatalog using the provided paths and complying with the
   * provided CreateMode.
   *
   * @param rootCatalog The root SimpleCatalog in which to create the function.
   * @param functionPaths The function paths to create the TVF at. If multiple paths are
   * provided, multiple copies of the function will be registered in the catalog.
   * @param tvfInfo The TVFInfo object representing the TVF that should be created
   * @param createMode The CreateMode to use
   * @throws CatalogResourceAlreadyExists if the function already exists at any of the provided
   * paths and CreateMode != CREATE_OR_REPLACE.
   */
  public static void createTVFInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> functionPaths,
      TVFInfo tvfInfo,
      CreateMode createMode
  ) {
    for (List<String> functionPath : functionPaths) {
      String functionName = functionPath.get(functionPath.size() - 1);
      SimpleCatalog catalogForCreation = getCatalogInWhichToCreateResource(
          rootCatalog, functionPath
      );

      TableValuedFunction tvf = new FixedOutputSchemaTVF(
          ImmutableList.of(functionName),
          tvfInfo.getSignature(),
          tvfInfo.getOutputSchema()
      );

      boolean exists = tvfExists(catalogForCreation, tvf);
      boolean replace = createMode.equals(CreateMode.CREATE_OR_REPLACE);

      if(exists && replace) {
        catalogForCreation.removeTableValuedFunction(tvf.getName());
      }

      if(exists && !replace) {
        throw new CatalogResourceAlreadyExists(catalogForCreation.getFullName());
      }

      catalogForCreation.addTableValuedFunction(tvf);
    }
  }

  /**
   * Creates a procedure in a SimpleCatalog using the provided paths and complying with the
   * provided CreateMode.
   *
   * @param rootCatalog The root SimpleCatalog in which to create the procedure.
   * @param procedurePaths The procedure paths to create the procedure at. If multiple paths are
   * provided, multiple copies of the procedure will be registered in the catalog.
   * @param procedureInfo The ProcedureInfo object representing the procedure that should be created
   * @param createMode The CreateMode to use
   * @throws CatalogResourceAlreadyExists if the procedure already exists at any of the provided
   * paths and CreateMode != CREATE_OR_REPLACE.
   */
  public static void createProcedureInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> procedurePaths,
      ProcedureInfo procedureInfo,
      CreateMode createMode
  ) {
    for (List<String> procedurePath : procedurePaths) {
      String procedureName = procedurePath.get(procedurePath.size() - 1);
      SimpleCatalog catalogForCreation = getCatalogInWhichToCreateResource(
          rootCatalog, procedurePath
      );

      Procedure procedure = new Procedure(
          ImmutableList.of(procedureName),
          procedureInfo.getSignature()
      );

      boolean exists = procedureExists(catalogForCreation, procedure);
      boolean replace = createMode.equals(CreateMode.CREATE_OR_REPLACE);

      if(exists && replace) {
        catalogForCreation.removeProcedure(procedure.getName());
      }

      if(exists && !replace) {
        throw new CatalogResourceAlreadyExists(procedure.getName());
      }

      catalogForCreation.addProcedure(procedure);
    }
  }

  /** Creates a copy of a SimpleTable */
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

  /**
   * Creates a copy of a SimpleCatalog.
   *
   * @param sourceCatalog The SimpleCatalog that should be copied.
   * @param deepCopy Whether to perform a deep copy. If true, mutable catalog resources are
   * copied themselves as well.
   * @return The copy of the provided SimpleCatalog.
   */
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
