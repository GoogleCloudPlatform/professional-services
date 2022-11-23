package com.google.pso.zetasql.helper.catalog;

import com.google.zetasql.Analyzer;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
import java.util.List;

public abstract class CatalogHelper {

  public SimpleCatalog createEmptyCatalog(String name) {
    SimpleCatalog catalog = new SimpleCatalog(name);
    catalog.addZetaSQLFunctions(new ZetaSQLBuiltinFunctionOptions());
    return catalog;
  }

  public SimpleTable buildSimpleTable(List<String> tablePath, List<SimpleColumn> columns) {
    return CatalogOperations.buildSimpleTable(
        String.join(".", tablePath),
        columns
    );
  }

  public abstract void registerTable(SimpleCatalog catalog, SimpleTable table, boolean isTemp);

  public abstract void addTables(SimpleCatalog catalog, List<List<String>> tablePaths);

  public void addTable(SimpleCatalog catalog, List<String> tablePath) {
    this.addTables(catalog, List.of(tablePath));
  }

  public void addAllTablesUsedInQuery(
      SimpleCatalog catalog, String query, AnalyzerOptions options
  ) {
    List<List<String>> tablePaths = Analyzer.extractTableNamesFromScript(query, options);
    this.addTables(catalog, tablePaths);
  }

}
