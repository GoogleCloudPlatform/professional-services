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

public interface CatalogWrapper {

  void register(SimpleTable table, CreateMode createMode, CreateScope createScope);

  void register(Function function, CreateMode createMode, CreateScope createScope);

  void register(TVFInfo tvfInfo, CreateMode createMode, CreateScope createScope);

  void register(ProcedureInfo procedureInfo, CreateMode createMode, CreateScope createScope);

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
