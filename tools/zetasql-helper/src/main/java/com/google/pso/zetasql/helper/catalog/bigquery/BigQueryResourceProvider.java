package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.zetasql.Function;
import com.google.zetasql.SimpleTable;
import java.util.List;
import java.util.Optional;

public interface BigQueryResourceProvider {

  default Optional<SimpleTable> getTable(String projectId, String tableReference) {
    List<SimpleTable> tableList = this.getTables(projectId, List.of(tableReference));
    return tableList.isEmpty() ? Optional.empty() : Optional.of(tableList.get(0));
  }

  List<SimpleTable> getTables(String projectId, List<String> tableReferences);

  List<SimpleTable> getAllTablesInDataset(String projectId, String datasetName);

  List<SimpleTable> getAllTablesInProject(String projectId);

  default Optional<Function> getFunction(String projectId, String functionReference) {
    List<Function> functionList = this.getFunctions(projectId, List.of(functionReference));
    return functionList.isEmpty() ? Optional.empty() : Optional.of(functionList.get(0));
  }

  List<Function> getFunctions(String projectId, List<String> functionReferences);

  List<Function> getAllFunctionsInDataset(String projectId, String datasetName);

  List<Function> getAllFunctionsInProject(String projectId);

}
