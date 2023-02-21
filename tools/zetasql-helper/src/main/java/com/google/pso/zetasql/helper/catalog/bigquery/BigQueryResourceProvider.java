package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.zetasql.Function;
import com.google.zetasql.SimpleTable;
import java.util.List;
import java.util.Optional;

public interface BigQueryResourceProvider {

  default SimpleTable getTable(String projectId, String tableReference) {
    return this.getTables(projectId, List.of(tableReference)).get(0);
  }

  List<SimpleTable> getTables(String projectId, List<String> tableReferences);

  List<SimpleTable> getAllTablesInDataset(String projectId, String datasetName);

  List<SimpleTable> getAllTablesInProject(String projectId);

  default Function getFunction(String projectId, String functionReference) {
    return this.getFunctions(projectId, List.of(functionReference)).get(0);
  }

  List<Function> getFunctions(String projectId, List<String> functionReferences);

  List<Function> getAllFunctionsInDataset(String projectId, String datasetName);

  List<Function> getAllFunctionsInProject(String projectId);

}
