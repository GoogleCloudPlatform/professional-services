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

import com.google.pso.zetasql.helper.catalog.bigquery.ProcedureInfo;
import com.google.pso.zetasql.helper.catalog.bigquery.TVFInfo;
import com.google.zetasql.Analyzer;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.Function;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Interface for an object that wraps a ZetaSQL SimpleCatalog and allows adding resources
 * to it by value (providing the actual resource object) or by name. Should be implemented
 * when creating a Catalog implementation that follows the semantics of a specific SQL engine,
 * for example, BigQuery.
 */
public interface CatalogWrapper {
  // TODO: Should the CatalogWrapper support Constants and Types?

  /**
   * Registers a SimpleTable in this catalog.
   *
   * @param table The SimpleTable to register
   * @param createMode The CreateMode for creating the table
   * @param createScope The CreateScope for creating the table
   */
  void register(SimpleTable table, CreateMode createMode, CreateScope createScope);

  /**
   * Registers a Function in this catalog.
   *
   * @param function The Function to register in this catalog
   * @param createMode The CreateMode for creating the function
   * @param createScope The CreateScope for creating the function
   */
  void register(Function function, CreateMode createMode, CreateScope createScope);

  /**
   * Registers a TVF in this catalog.
   *
   * @param tvfInfo The TVFInfo object representing the TVF to register
   * @param createMode The CreateMode for creating the TVF
   * @param createScope The CreateScope for creating the TVF
   */
  void register(TVFInfo tvfInfo, CreateMode createMode, CreateScope createScope);

  /**
   * Registers a procedure in this catalog.
   *
   * @param procedureInfo The ProcedureInfo object representing the procedure to register
   * @param createMode The CreateMode for creating the procedure
   * @param createScope The CreateScope for creating the procedure
   */
  void register(ProcedureInfo procedureInfo, CreateMode createMode, CreateScope createScope);

  /**
   * Adds a set of tables to this catalog by name.
   *
   * @param tables The list of table names to add
   */
  void addTables(List<String> tables);

  /**
   * Adds a set of functions to this catalog by name.
   *
   * @param functions The list of function names to add
   */
  void addFunctions(List<String> functions);

  /**
   * Adds a set of TVFs to this catalog by name.
   *
   * @param functions The list of function names to add
   */
  void addTVFs(List<String> functions);

  /**
   * Adds a set of procedures to this catalog by name.
   *
   * @param procedures The list of procedure names to add
   */
  void addProcedures(List<String> procedures);

  /**
   * Adds a table to this catalog by name.
   *
   * @param table The name of the table to add
   */
  default void addTable(String table) {
    this.addTables(List.of(table));
  }

  /**
   * Adds a function to this catalog by name.
   *
   * @param function The name of the function to add
   */
  default void addFunction(String function) {
    this.addFunctions(List.of(function));
  }

  /**
   * Adds a TVF to this catalog by name.
   *
   * @param function The name of the TVF to add
   */
  default void addTVF(String function) {
    this.addTVFs(List.of(function));
  }

  /**
   * Adds a procedure to this catalog by name.
   *
   * @param procedure The name of the procedure to add
   */
  default void addProcedure(String procedure) {
    this.addProcedures(List.of(procedure));
  }

  /**
   * Adds all the tables used in the provided query to this catalog.
   *
   * <p> Uses Analyzer.extractTableNamesFromScript to extract the table names and later
   * uses this.addTables to add them.
   *
   * @param query The SQL query from which to get the tables that should be added to the catalog
   * @param options The ZetaSQL AnalyzerOptions to use when extracting the table names from
   * the query
   */
  default void addAllTablesUsedInQuery(String query, AnalyzerOptions options) {
    Set<String> tables = Analyzer.extractTableNamesFromScript(query, options)
        .stream()
        .map(tablePath -> String.join(".", tablePath))
        .collect(Collectors.toSet());
    this.addTables(List.copyOf(tables));
  }

  /**
   * Creates a copy of this CatalogWrapper.
   *
   * <p> Each implementation is responsible for determining how itself should be copied.
   *
   * @param deepCopy Whether to perform a deep copy
   * @return The copy for this CatalogWrapper
   */
  CatalogWrapper copy(boolean deepCopy);

  /**
   * Gets the underlying ZetaSQL SimpleCatalog.
   *
   * @return The underlying ZetaSQL SimpleCatalog that can be used for analyzing queries
   */
  SimpleCatalog getZetaSQLCatalog();

}
