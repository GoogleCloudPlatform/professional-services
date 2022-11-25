package com.google.pso.zetasql.helper.catalog;

import com.google.zetasql.Analyzer;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import java.util.List;

public interface CatalogWrapper {

  void registerTable(SimpleTable table, boolean isTemp);

  void addTables(List<List<String>> tablePaths);

  default void addTable(List<String> tablePath) {
    this.addTables(List.of(tablePath));
  }

  default void addAllTablesUsedInQuery(String query, AnalyzerOptions options) {
    List<List<String>> tablePaths = Analyzer.extractTableNamesFromScript(query, options);
    this.addTables(tablePaths);
  }

  CatalogWrapper copy(boolean deepCopy);

  SimpleCatalog getZetaSQLCatalog();

}
