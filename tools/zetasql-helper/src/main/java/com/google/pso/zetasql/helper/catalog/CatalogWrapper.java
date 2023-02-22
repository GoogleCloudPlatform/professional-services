package com.google.pso.zetasql.helper.catalog;

import com.google.zetasql.Analyzer;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.Function;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import java.util.List;

public interface CatalogWrapper {

  void registerTable(SimpleTable table, boolean isTemp);

  void registerFunction(Function function, boolean isTemp);

  void addTables(List<List<String>> tablePaths);

  void addFunctions(List<List<String>> functionPaths);

  void addTVFs(List<List<String>> functionPaths);

  void addProcedures(List<List<String>> procedurePaths);

  default void addTable(List<String> tablePath) {
    this.addTables(List.of(tablePath));
  }

  default void addFunction(List<String> functionPath) {
    this.addFunctions(List.of(functionPath));
  }

  default void addTVF(List<String> functionPath) {
    this.addTVFs(List.of(functionPath));
  }

  default void addProcedure(List<String> procedurePath) {
    this.addProcedures(List.of(procedurePath));
  }

  default void addAllTablesUsedInQuery(String query, AnalyzerOptions options) {
    List<List<String>> tablePaths = Analyzer.extractTableNamesFromScript(query, options);
    this.addTables(tablePaths);
  }

  CatalogWrapper copy(boolean deepCopy);

  SimpleCatalog getZetaSQLCatalog();

}
