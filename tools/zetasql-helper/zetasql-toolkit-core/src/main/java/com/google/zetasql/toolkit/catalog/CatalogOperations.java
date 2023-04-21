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

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import com.google.zetasql.*;
import com.google.zetasql.SimpleCatalogProtos.SimpleCatalogProto;
import com.google.zetasql.TableValuedFunction.FixedOutputSchemaTVF;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.toolkit.catalog.bigquery.FunctionInfo;
import com.google.zetasql.toolkit.catalog.bigquery.ProcedureInfo;
import com.google.zetasql.toolkit.catalog.bigquery.TVFInfo;
import com.google.zetasql.toolkit.catalog.exceptions.CatalogResourceAlreadyExists;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Utility class that exposes static methods for performing various operations on ZetaSQL
 * SimpleCatalogs and related resources. Supports:
 *
 * <ul>
 *   <li>Building properly configured SimpleTable objects
 *   <li>Adding tables, functions, TVFs and procedures to SimpleCatalogs
 *   <li>Creating copies of SimpleCatalogs
 * </ul>
 */
public class CatalogOperations {
  // TODO: Probably come up with an abstraction to reduce code repetition in this class.
  //  This implementation has a lot of repeated code; namely in methods like
  //  validate[Resource]DoesNotExist(), delete[Resource]FromCatalog() and
  // create[Resource]InCatalog().
  //  Because of the slightly different ways the SimpleCatalog handles naming for different types of
  // resources,
  //  avoiding that repetition is not very straightforward.

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

  /** Returns true if a table with path tablePath exists in the SimpleCatalog */
  private static boolean tableExists(SimpleCatalog catalog, List<String> tablePath) {
    try {
      catalog.findTable(tablePath);
      return true;
    } catch (NotFoundException err) {
      return false;
    }
  }

  /** Returns true if a table named tableName exists in the SimpleCatalog */
  private static boolean tableExists(SimpleCatalog catalog, String tableName) {
    return tableExists(catalog, List.of(tableName));
  }

  private static String removeGroupFromFunctionName(String functionName) {
    return functionName.substring(functionName.indexOf(":") + 1);
  }

  /** Returns true if a function with the provided fullName exists in the SimpleCatalog */
  private static boolean functionExists(SimpleCatalog catalog, String fullName) {
    // TODO: switch to using Catalog.findFunction once available
    String fullNameWithoutGroup = removeGroupFromFunctionName(fullName);
    return catalog.getFunctionNameList().stream()
        .map(CatalogOperations::removeGroupFromFunctionName)
        .anyMatch(fullNameWithoutGroup::equalsIgnoreCase);
  }

  /** Returns true if the Function exists in the SimpleCatalog */
  private static boolean functionExists(SimpleCatalog catalog, Function function) {
    return functionExists(catalog, function.getFullName(false));
  }

  /** Returns true if the TVF named tvfName exists in the SimpleCatalog */
  private static boolean tvfExists(SimpleCatalog catalog, String tvfName) {
    return catalog.getTVFNameList().contains(tvfName.toLowerCase());
  }

  /** Returns true if the TVF exists in the SimpleCatalog */
  private static boolean tvfExists(SimpleCatalog catalog, TableValuedFunction tvf) {
    return tvfExists(catalog, tvf.getName());
  }

  /** Returns true if the named procedureName exists in the SimpleCatalog */
  private static boolean procedureExists(SimpleCatalog catalog, String procedureName) {
    return catalog.getProcedureList().stream()
        .map(Procedure::getName)
        .anyMatch(name -> name.equalsIgnoreCase(procedureName));
  }

  /** Returns true if the Procedure exists in the SimpleCatalog */
  private static boolean procedureExists(SimpleCatalog catalog, Procedure procedure) {
    return procedureExists(catalog, procedure.getName());
  }

  /**
   * Gets the SimpleCatalog in which a resource should be created, based on the root catalog and the
   * resource path.
   *
   * <p>The path for the resource determines whether it should be created in the root catalog itself
   * or in a nested catalog. For example; a resource with the path ["A.B"] should be created in the
   * root catalog, but a resource with the path ["A", "B"] should be created in an "A" catalog
   * nested in the root catalog.
   *
   * @param rootCatalog The root SimpleCatalog the analyzer will use
   * @param resourcePath The path for the resource
   * @return The SimpleCatalog object where the resource should be created
   */
  private static SimpleCatalog getSubCatalogForResource(
      SimpleCatalog rootCatalog, List<String> resourcePath) {
    if (resourcePath.size() > 1) {
      String nestedCatalogName = resourcePath.get(0);
      List<String> pathSuffix = resourcePath.subList(1, resourcePath.size());
      SimpleCatalog nestedCatalog = getOrCreateNestedCatalog(rootCatalog, nestedCatalogName);
      return getSubCatalogForResource(nestedCatalog, pathSuffix);
    } else {
      return rootCatalog;
    }
  }

  /**
   * Checks a table does not exist at any of the provided paths.
   *
   * @param rootCatalog The catalog to look for tables in
   * @param tablePaths The list of paths the table should not be in
   * @param fullTableName The full name of the table we're looking for, used for error reporting
   * @throws CatalogResourceAlreadyExists if a table exists at any of the provided paths
   */
  private static void validateTableDoesNotExist(
      SimpleCatalog rootCatalog, List<List<String>> tablePaths, String fullTableName) {
    for (List<String> tablePath : tablePaths) {
      if (tableExists(rootCatalog, tablePath)) {
        String errorMessage =
            String.format(
                "Table %s already exists at path %s", fullTableName, tablePath.toString());
        throw new CatalogResourceAlreadyExists(fullTableName, errorMessage);
      }
    }
  }

  /**
   * Deletes a table from the specified paths in a {@link SimpleCatalog}
   *
   * @param rootCatalog The catalog from which to delete tables
   * @param tablePaths The paths for the table that should be deleted
   */
  public static void deleteTableFromCatalog(
      SimpleCatalog rootCatalog, List<List<String>> tablePaths) {
    for (List<String> tablePath : tablePaths) {
      String tableName = tablePath.get(tablePath.size() - 1);
      SimpleCatalog catalog = getSubCatalogForResource(rootCatalog, tablePath);

      if (tableExists(catalog, tableName)) {
        catalog.removeSimpleTable(tableName);
      }
    }
  }

  /**
   * Creates a table in a SimpleCatalog using the provided paths and complying with the provided
   * CreateMode.
   *
   * @param rootCatalog The root SimpleCatalog in which to create the table.
   * @param tablePaths The table paths to create the table at. If multiple paths are provided,
   *     multiple copies of the table will be registered in the catalog.
   * @param fullTableName The full name of the table to create.
   * @param columns The list of columns for the table
   * @param createMode The CreateMode to use
   * @throws CatalogResourceAlreadyExists if the table already exists at any of the provided paths
   *     and CreateMode != CREATE_OR_REPLACE.
   */
  public static void createTableInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> tablePaths,
      String fullTableName,
      List<SimpleColumn> columns,
      CreateMode createMode) {

    if (createMode.equals(CreateMode.CREATE_OR_REPLACE)) {
      deleteTableFromCatalog(rootCatalog, tablePaths);
    }

    if (createMode.equals(CreateMode.CREATE_DEFAULT)) {
      validateTableDoesNotExist(rootCatalog, tablePaths, fullTableName);
    }

    SimpleTable table = new SimpleTable(fullTableName, columns);
    table.setFullName(fullTableName);

    for (List<String> tablePath : tablePaths) {
      String tableName = tablePath.get(tablePath.size() - 1);
      SimpleCatalog catalogForCreation = getSubCatalogForResource(rootCatalog, tablePath);

      if (!tableExists(catalogForCreation, tableName)) {
        catalogForCreation.addSimpleTable(tableName, table);
      }
    }
  }

  /**
   * Checks a function does not exist at any of the provided paths.
   *
   * @param rootCatalog The catalog to look for functions in
   * @param functionPaths The list of paths the function should not be in
   * @param functionFullName The full name of the function we're looking for, only used for error
   *     reporting
   * @throws CatalogResourceAlreadyExists if a function exists at any of the provided paths
   */
  private static void validateFunctionDoesNotExist(
      SimpleCatalog rootCatalog, List<List<String>> functionPaths, String functionFullName) {
    for (List<String> functionPath : functionPaths) {
      String functionNameInCatalog = functionPath.get(functionPath.size() - 1);

      SimpleCatalog catalog = getSubCatalogForResource(rootCatalog, functionPath);

      if (functionExists(catalog, functionNameInCatalog)) {
        throw new CatalogResourceAlreadyExists(functionFullName);
      }
    }
  }

  /**
   * Deletes a function from the specified paths in a {@link SimpleCatalog}
   *
   * @param rootCatalog The catalog from which to delete functions
   * @param functionPaths The paths for the function that should be deleted
   */
  public static void deleteFunctionFromCatalog(
      SimpleCatalog rootCatalog, List<List<String>> functionPaths) {
    for (List<String> functionPath : functionPaths) {
      String functionNameInCatalog = functionPath.get(functionPath.size() - 1);
      SimpleCatalog catalog = getSubCatalogForResource(rootCatalog, functionPath);

      if (functionExists(catalog, functionNameInCatalog)) {
        Optional<String> fullNameToDelete =
            catalog.getFunctionNameList().stream()
                .filter(
                    fullName ->
                        removeGroupFromFunctionName(fullName)
                            .equalsIgnoreCase(functionNameInCatalog))
                .findFirst();
        fullNameToDelete.ifPresent(catalog::removeFunction);
      }
    }
  }

  /**
   * Creates a function in a SimpleCatalog using the provided paths and complying with the provided
   * CreateMode.
   *
   * @param rootCatalog The root SimpleCatalog in which to create the function.
   * @param functionPaths The function paths to create the function at. If multiple paths are
   *     provided, multiple copies of the function will be registered in the catalog.
   * @param functionInfo The FunctionInfo object representing the function that should be created
   * @param createMode The CreateMode to use
   * @throws CatalogResourceAlreadyExists if the function already exists at any of the provided
   *     paths and CreateMode != CREATE_OR_REPLACE.
   */
  public static void createFunctionInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> functionPaths,
      FunctionInfo functionInfo,
      CreateMode createMode) {

    if (createMode.equals(CreateMode.CREATE_OR_REPLACE)) {
      deleteFunctionFromCatalog(rootCatalog, functionPaths);
    }

    if (createMode.equals(CreateMode.CREATE_DEFAULT)) {
      validateFunctionDoesNotExist(
          rootCatalog, functionPaths, String.join(".", functionInfo.getNamePath()));
    }

    for (List<String> functionPath : functionPaths) {
      String functionName = functionPath.get(functionPath.size() - 1);
      SimpleCatalog catalogForCreation = getSubCatalogForResource(rootCatalog, functionPath);

      Function finalFunction =
          new Function(
              List.of(functionName),
              functionInfo.getGroup(),
              functionInfo.getMode(),
              functionInfo.getSignatures());

      if (!functionExists(catalogForCreation, finalFunction)) {
        catalogForCreation.addFunction(finalFunction);
      }
    }
  }

  /**
   * Checks a TVF does not exist at any of the provided paths.
   *
   * @param rootCatalog The catalog to look for functions in
   * @param functionPaths The list of paths the function should not be in
   * @param functionFullName The full name of the function we're looking for, only used for error
   *     reporting
   * @throws CatalogResourceAlreadyExists if a function exists at any of the provided paths
   */
  private static void validateTVFDoesNotExist(
      SimpleCatalog rootCatalog, List<List<String>> functionPaths, String functionFullName) {
    for (List<String> functionPath : functionPaths) {
      String functionName = functionPath.get(functionPath.size() - 1);
      SimpleCatalog catalog = getSubCatalogForResource(rootCatalog, functionPath);

      if (tvfExists(catalog, functionName)) {
        throw new CatalogResourceAlreadyExists(functionFullName);
      }
    }
  }

  /**
   * Deletes a TVF from the specified paths in a {@link SimpleCatalog}
   *
   * @param rootCatalog The catalog from which to delete TVFs
   * @param functionPaths The paths for the TVF that should be deleted
   */
  public static void deleteTVFFromCatalog(
      SimpleCatalog rootCatalog, List<List<String>> functionPaths) {
    for (List<String> functionPath : functionPaths) {
      String functionName = functionPath.get(functionPath.size() - 1);
      SimpleCatalog catalog = getSubCatalogForResource(rootCatalog, functionPath);

      if (tvfExists(catalog, functionName)) {
        catalog.removeTableValuedFunction(functionName);
      }
    }
  }

  /**
   * Creates a TVF in a SimpleCatalog using the provided paths and complying with the provided
   * CreateMode.
   *
   * @param rootCatalog The root SimpleCatalog in which to create the function.
   * @param functionPaths The function paths to create the TVF at. If multiple paths are provided,
   *     multiple copies of the function will be registered in the catalog.
   * @param tvfInfo The TVFInfo object representing the TVF that should be created
   * @param createMode The CreateMode to use
   * @throws CatalogResourceAlreadyExists if the function already exists at any of the provided
   *     paths and CreateMode != CREATE_OR_REPLACE.
   */
  public static void createTVFInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> functionPaths,
      TVFInfo tvfInfo,
      CreateMode createMode) {
    Preconditions.checkArgument(
        tvfInfo.getOutputSchema().isPresent(), "Cannot create a a TVF without an output schema");

    if (createMode.equals(CreateMode.CREATE_OR_REPLACE)) {
      deleteTVFFromCatalog(rootCatalog, functionPaths);
    }

    if (createMode.equals(CreateMode.CREATE_DEFAULT)) {
      String tvfFullName = String.join(".", tvfInfo.getNamePath());
      validateTVFDoesNotExist(rootCatalog, functionPaths, tvfFullName);
    }

    for (List<String> functionPath : functionPaths) {
      String functionName = functionPath.get(functionPath.size() - 1);
      SimpleCatalog catalogForCreation = getSubCatalogForResource(rootCatalog, functionPath);

      TableValuedFunction tvf =
          new FixedOutputSchemaTVF(
              ImmutableList.of(functionName),
              tvfInfo.getSignature(),
              tvfInfo.getOutputSchema().get());

      if (!tvfExists(catalogForCreation, tvf)) {
        catalogForCreation.addTableValuedFunction(tvf);
      }
    }
  }

  /**
   * Checks a Procedure does not exist at any of the provided paths.
   *
   * @param rootCatalog The catalog to look for procedures in
   * @param procedurePaths The list of paths the procedure should not be in
   * @param procedureFullName The full name of the procedure we're looking for, only used for error
   *     reporting
   * @throws CatalogResourceAlreadyExists if a procedure exists at any of the provided paths
   */
  private static void validateProcedureDoesNotExist(
      SimpleCatalog rootCatalog, List<List<String>> procedurePaths, String procedureFullName) {
    for (List<String> procedurePath : procedurePaths) {
      String procedureName = procedurePath.get(procedurePath.size() - 1);
      SimpleCatalog catalog = getSubCatalogForResource(rootCatalog, procedurePath);

      if (procedureExists(catalog, procedureName)) {
        throw new CatalogResourceAlreadyExists(procedureFullName);
      }
    }
  }

  /**
   * Deletes a Procedure from the specified paths in a {@link SimpleCatalog}
   *
   * @param rootCatalog The catalog from which to delete TVFs
   * @param procedurePaths The paths for the Procedure that should be deleted
   */
  public static void deleteProcedureFromCatalog(
      SimpleCatalog rootCatalog, List<List<String>> procedurePaths) {
    for (List<String> procedurePath : procedurePaths) {
      String procedureName = procedurePath.get(procedurePath.size() - 1);
      SimpleCatalog catalog = getSubCatalogForResource(rootCatalog, procedurePath);

      if (procedureExists(catalog, procedureName)) {
        catalog.removeProcedure(procedureName);
      }
    }
  }

  /**
   * Creates a procedure in a SimpleCatalog using the provided paths and complying with the provided
   * CreateMode.
   *
   * @param rootCatalog The root SimpleCatalog in which to create the procedure.
   * @param procedurePaths The procedure paths to create the procedure at. If multiple paths are
   *     provided, multiple copies of the procedure will be registered in the catalog.
   * @param procedureInfo The ProcedureInfo object representing the procedure that should be created
   * @param createMode The CreateMode to use
   * @throws CatalogResourceAlreadyExists if the procedure already exists at any of the provided
   *     paths and CreateMode != CREATE_OR_REPLACE.
   */
  public static void createProcedureInCatalog(
      SimpleCatalog rootCatalog,
      List<List<String>> procedurePaths,
      ProcedureInfo procedureInfo,
      CreateMode createMode) {

    if (createMode.equals(CreateMode.CREATE_OR_REPLACE)) {
      deleteProcedureFromCatalog(rootCatalog, procedurePaths);
    }

    if (createMode.equals(CreateMode.CREATE_DEFAULT)) {
      String procedureFullName = String.join(".", procedureInfo.getNamePath());
      validateProcedureDoesNotExist(rootCatalog, procedurePaths, procedureFullName);
    }

    for (List<String> procedurePath : procedurePaths) {
      String procedureName = procedurePath.get(procedurePath.size() - 1);
      SimpleCatalog catalogForCreation = getSubCatalogForResource(rootCatalog, procedurePath);

      Procedure procedure =
          new Procedure(ImmutableList.of(procedureName), procedureInfo.getSignature());

      if (!procedureExists(catalogForCreation, procedure)) {
        catalogForCreation.addProcedure(procedure);
      }
    }
  }

  /**
   * Creates a copy of a SimpleCatalog.
   *
   * @param sourceCatalog The SimpleCatalog that should be copied.
   * @return The copy of the provided SimpleCatalog.
   */
  public static SimpleCatalog copyCatalog(SimpleCatalog sourceCatalog) {
    // Simply serializes and deserializes the source catalog to create a copy.
    // This is the most reliable way of creating a copy of a SimpleCatalog,
    // as the SimpleCatalog's public interface does not expose enough of the internal
    // structures to create an accurate copy.
    SimpleCatalogProto serialized = sourceCatalog.serialize(new FileDescriptorSetsBuilder());
    return SimpleCatalog.deserialize(serialized, ImmutableList.of());
  }
}
