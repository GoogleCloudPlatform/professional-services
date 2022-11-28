package com.google.pso.zetasql.helper.catalog.basic;

import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.catalog.CatalogWrapper;
import com.google.zetasql.Function;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
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
  public void registerTable(SimpleTable table, boolean isTemp) {
    CatalogOperations.createTableInCatalog(
        this.catalog,
        List.of(List.of(table.getFullName())),
        table.getColumnList()
    );
  }

  @Override
  public void registerFunction(Function function, boolean isTemp) {
    CatalogOperations.createFunctionInCatalog(
        this.catalog,
        List.of(function.getNamePath()),
        function
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
  public SimpleCatalog getZetaSQLCatalog() {
    return this.catalog;
  }

  public BasicCatalogWrapper copy(boolean deepCopy) {
    return new BasicCatalogWrapper(
        CatalogOperations.copyCatalog(this.getZetaSQLCatalog(), deepCopy)
    );
  }

}
