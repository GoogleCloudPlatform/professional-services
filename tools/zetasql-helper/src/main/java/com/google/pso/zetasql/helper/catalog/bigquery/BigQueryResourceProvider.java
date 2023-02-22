package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.zetasql.Function;
import com.google.zetasql.SimpleTable;
import java.util.List;

public interface BigQueryResourceProvider {

  List<SimpleTable> getTables(String projectId, List<String> tableReferences);

  List<SimpleTable> getAllTablesInDataset(String projectId, String datasetName);

  List<SimpleTable> getAllTablesInProject(String projectId);

  List<Function> getFunctions(String projectId, List<String> functionReferences);

  List<Function> getAllFunctionsInDataset(String projectId, String datasetName);

  List<Function> getAllFunctionsInProject(String projectId);

  List<TVFInfo> getTVFs(String projectId, List<String> functionReferences);

  List<TVFInfo> getAllTVFsInDataset(String projectId, String datasetName);

  List<TVFInfo> getAllTVFsInProject(String projectId);

  List<ProcedureInfo> getProcedures(String projectId, List<String> procedureReferences);

  List<ProcedureInfo> getAllProceduresInDataset(String projectId, String datasetName);

  List<ProcedureInfo> getAllProceduresInProject(String projectId);

}
