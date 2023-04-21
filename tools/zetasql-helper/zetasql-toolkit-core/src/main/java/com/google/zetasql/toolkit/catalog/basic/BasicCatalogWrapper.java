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

package com.google.zetasql.toolkit.catalog.basic;

import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import com.google.zetasql.toolkit.catalog.CatalogOperations;
import com.google.zetasql.toolkit.catalog.CatalogWrapper;
import com.google.zetasql.toolkit.catalog.bigquery.FunctionInfo;
import com.google.zetasql.toolkit.catalog.bigquery.ProcedureInfo;
import com.google.zetasql.toolkit.catalog.bigquery.TVFInfo;
import com.google.zetasql.toolkit.catalog.exceptions.CatalogException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Basic implementation of CatalogWrapper which does not implement the semantics of any particular
 * SQL engine. It does not support adding resources by name.
 */
public class BasicCatalogWrapper implements CatalogWrapper {

  private final SimpleCatalog catalog;

  public BasicCatalogWrapper() {
    this.catalog = new SimpleCatalog("catalog");
    this.catalog.addZetaSQLFunctionsAndTypes(new ZetaSQLBuiltinFunctionOptions());
  }

  public BasicCatalogWrapper(SimpleCatalog initialCatalog) {
    this.catalog = initialCatalog;
  }

  /**
   * {@inheritDoc}
   *
   * <p>Registers the table using its full name
   */
  @Override
  public void register(SimpleTable table, CreateMode createMode, CreateScope createScope) {
    CatalogOperations.createTableInCatalog(
        this.catalog,
        List.of(List.of(table.getFullName())),
        table.getFullName(),
        table.getColumnList(),
        createMode);
  }

  @Override
  public void register(FunctionInfo function, CreateMode createMode, CreateScope createScope) {
    CatalogOperations.createFunctionInCatalog(
        this.catalog, List.of(function.getNamePath()), function, createMode);
  }

  @Override
  public void register(TVFInfo tvfInfo, CreateMode createMode, CreateScope createScope) {
    CatalogOperations.createTVFInCatalog(
        this.catalog, List.of(tvfInfo.getNamePath()), tvfInfo, createMode);
  }

  /**
   * {@inheritDoc}
   *
   * @throws CatalogException if the name path for the procedure has more than one item
   */
  @Override
  public void register(
      ProcedureInfo procedureInfo, CreateMode createMode, CreateScope createScope) {
    if (procedureInfo.getNamePath().size() > 1) {
      throw new CatalogException("Procedure name paths should have a single item");
    }

    List<String> namePath =
        procedureInfo.getNamePath().stream()
            .flatMap(pathElement -> Arrays.stream(pathElement.split("\\.")))
            .collect(Collectors.toList());
    String fullName = String.join(".", namePath);

    List<List<String>> procedurePaths = new ArrayList<>();
    procedurePaths.add(namePath);
    if (namePath.size() > 1) {
      procedurePaths.add(List.of(fullName));
    }

    CatalogOperations.createProcedureInCatalog(
        this.catalog, procedurePaths, procedureInfo, createMode);
  }

  @Override
  public void removeTable(String fullTableName) {
    CatalogOperations.deleteTableFromCatalog(this.catalog, List.of(List.of(fullTableName)));
  }

  @Override
  public void removeFunction(String function) {
    CatalogOperations.deleteFunctionFromCatalog(this.catalog, List.of(List.of(function)));
  }

  @Override
  public void removeTVF(String function) {
    CatalogOperations.deleteTVFFromCatalog(this.catalog, List.of(List.of(function)));
  }

  @Override
  public void removeProcedure(String procedure) {
    CatalogOperations.deleteProcedureFromCatalog(this.catalog, List.of(List.of(procedure)));
  }

  @Override
  public void addTables(List<String> tables) {
    throw new UnsupportedOperationException("The BasicCatalogWrapper cannot add tables by name");
  }

  @Override
  public void addFunctions(List<String> functions) {
    throw new UnsupportedOperationException("The BasicCatalogWrapper cannot add functions by name");
  }

  @Override
  public void addTVFs(List<String> functions) {
    throw new UnsupportedOperationException("The BasicCatalogWrapper cannot add TVFs by name");
  }

  @Override
  public void addProcedures(List<String> procedures) {
    throw new UnsupportedOperationException(
        "The BasicCatalogWrapper cannot add procedures by name");
  }

  @Override
  public SimpleCatalog getZetaSQLCatalog() {
    return this.catalog;
  }

  @Override
  public BasicCatalogWrapper copy() {
    return new BasicCatalogWrapper(CatalogOperations.copyCatalog(this.getZetaSQLCatalog()));
  }
}
