/*
 * Copyright 2023 Google LLC All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
