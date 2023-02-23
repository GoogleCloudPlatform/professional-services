package com.google.pso.zetasql.helper.catalog.basic;

import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.catalog.CatalogWrapper;
import com.google.pso.zetasql.helper.catalog.bigquery.ProcedureInfo;
import com.google.pso.zetasql.helper.catalog.bigquery.TVFInfo;
import com.google.zetasql.Function;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import java.util.List;

public class BasicCatalogWrapper implements CatalogWrapper {

  private final SimpleCatalog catalog;

  public BasicCatalogWrapper() {
    this.catalog = new SimpleCatalog("catalog");
    this.catalog.addZetaSQLFunctions(new ZetaSQLBuiltinFunctionOptions());
  }

  public BasicCatalogWrapper(SimpleCatalog initialCatalog) {
    this.catalog = initialCatalog;
  }

  @Override
  public void register(SimpleTable table, CreateMode createMode, CreateScope createScope) {
    CatalogOperations.createTableInCatalog(
        this.catalog,
        List.of(List.of(table.getFullName())),
        table.getFullName(),
        table.getColumnList(),
        createMode
    );
  }

  @Override
  public void register(Function function, CreateMode createMode, CreateScope createScope) {
    CatalogOperations.createFunctionInCatalog(
        this.catalog,
        List.of(function.getNamePath()),
        function,
        createMode
    );
  }

  @Override
  public void register(TVFInfo tvfInfo, CreateMode createMode, CreateScope createScope) {
    CatalogOperations.createTVFInCatalog(
        this.catalog,
        List.of(tvfInfo.getNamePath()),
        tvfInfo,
        createMode
    );
  }

  @Override
  public void register(ProcedureInfo procedureInfo, CreateMode createMode, CreateScope createScope) {
    CatalogOperations.createProcedureInCatalog(
        this.catalog,
        List.of(procedureInfo.getNamePath()),
        procedureInfo,
        createMode
    );
  }

  @Override
  public void addTables(List<List<String>> tablePaths) {
    throw new UnsupportedOperationException("The BasicCatalogWrapper cannot add tables by name");
  }

  @Override
  public void addFunctions(List<List<String>> functionPaths) {
    throw new UnsupportedOperationException("The BasicCatalogWrapper cannot add functions by name");
  }

  @Override
  public void addTVFs(List<List<String>> functionPaths) {
    throw new UnsupportedOperationException("The BasicCatalogWrapper cannot add TVFs by name");
  }

  @Override
  public void addProcedures(List<List<String>> procedurePaths) {
    throw new UnsupportedOperationException(
        "The BasicCatalogWrapper cannot add procedures by name"
    );
  }

  @Override
  public SimpleCatalog getZetaSQLCatalog() {
    return this.catalog;
  }

  public BasicCatalogWrapper copy(boolean deepCopy) {
    return new BasicCatalogWrapper(
        CatalogOperations.copyCatalog(this.getZetaSQLCatalog(), deepCopy)
    );
  }

}
