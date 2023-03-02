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

public interface CatalogWrapper {

  void register(SimpleTable table, CreateMode createMode, CreateScope createScope);

  void register(Function function, CreateMode createMode, CreateScope createScope);

  void register(TVFInfo tvfInfo, CreateMode createMode, CreateScope createScope);

  void register(ProcedureInfo procedureInfo, CreateMode createMode, CreateScope createScope);

  void addTables(List<String> tables);

  void addFunctions(List<String> functions);

  void addTVFs(List<String> functions);

  void addProcedures(List<String> procedures);

  default void addTable(String table) {
    this.addTables(List.of(table));
  }

  default void addFunction(String function) {
    this.addFunctions(List.of(function));
  }

  default void addTVF(String function) {
    this.addTVFs(List.of(function));
  }

  default void addProcedure(String procedure) {
    this.addProcedures(List.of(procedure));
  }

  default void addAllTablesUsedInQuery(String query, AnalyzerOptions options) {
    Set<String> tables = Analyzer.extractTableNamesFromScript(query, options)
        .stream()
        .map(tablePath -> String.join(".", tablePath))
        .collect(Collectors.toSet());
    this.addTables(List.copyOf(tables));
  }

  CatalogWrapper copy(boolean deepCopy);

  SimpleCatalog getZetaSQLCatalog();

}
