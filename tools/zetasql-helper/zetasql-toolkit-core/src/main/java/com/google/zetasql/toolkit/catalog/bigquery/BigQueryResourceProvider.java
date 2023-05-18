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

package com.google.zetasql.toolkit.catalog.bigquery;

import com.google.zetasql.SimpleTable;
import java.util.List;

/** Interface for an object that can find and provide BigQuery resources */
public interface BigQueryResourceProvider {

  /**
   * Gets a set of BigQuery tables or views and returns them as {@link SimpleTable}s
   *
   * @param projectId The default BigQuery project id. If a table or view reference does not specify
   *     the project, the default project is used.
   * @param tableReferences The list of table or view references. Each reference should be in the
   *     format "project.dataset.table" or "dataset.table".
   * @return The list of SimpleTables representing the requested BigQuery tables.
   */
  List<SimpleTable> getTables(String projectId, List<String> tableReferences);

  /**
   * Gets all BigQuery tables in a given dataset and returns them as {@link SimpleTable}s
   *
   * @param projectId The projectId the dataset belongs to
   * @param datasetName The name of the dataset from which to get the tables
   * @return The list of SimpleTables representing the tables in the dataset
   */
  List<SimpleTable> getAllTablesInDataset(String projectId, String datasetName);

  /**
   * Gets all BigQuery tables in a given project and returns them as {@link SimpleTable}s
   *
   * @param projectId The projectId from which to get the tables
   * @return The list of SimpleTables representing the tables in the project
   */
  List<SimpleTable> getAllTablesInProject(String projectId);

  /**
   * Gets a set of BigQuery functions and returns them as {@link Function}s
   *
   * @param projectId The default BigQuery project id. If a function reference does not specify the
   *     project, the default project is used.
   * @param functionReferences The list of function references. Each reference should be in the
   *     format "project.dataset.function" or "dataset.function".
   * @return The list of {@link FunctionInfo} representing the requested BigQuery functions.
   */
  List<FunctionInfo> getFunctions(String projectId, List<String> functionReferences);

  /**
   * Gets all BigQuery functions in a given dataset and returns them as {@link Function}s
   *
   * @param projectId The projectId the dataset belongs to
   * @param datasetName The name of the dataset from which to get the functions
   * @return The list of {@link FunctionInfo} representing the functions in the dataset
   */
  List<FunctionInfo> getAllFunctionsInDataset(String projectId, String datasetName);

  /**
   * Gets all BigQuery functions in a given project and returns them as {@link Function}s
   *
   * @param projectId The projectId from which to get the functions
   * @return The list of {@link FunctionInfo} representing the functions in the project
   */
  List<FunctionInfo> getAllFunctionsInProject(String projectId);

  /**
   * Gets a set of BigQuery TVFs and returns them as {@link TVFInfo}s
   *
   * @param projectId The default BigQuery project id. If a function reference does not specify the
   *     project, the default project is used.
   * @param functionReferences The list of function references. Each reference should be in the
   *     format "project.dataset.function" or "dataset.function".
   * @return The list of {@link TVFInfo} representing the requested BigQuery functions.
   */
  List<TVFInfo> getTVFs(String projectId, List<String> functionReferences);

  /**
   * Gets all BigQuery TVFs in a given dataset and returns them as {@link TVFInfo}s
   *
   * @param projectId The projectId the dataset belongs to
   * @param datasetName The name of the dataset from which to get the functions
   * @return The list of {@link TVFInfo} representing the TVFs in the dataset
   */
  List<TVFInfo> getAllTVFsInDataset(String projectId, String datasetName);

  /**
   * Gets all BigQuery TVFs in a given project and returns them as {@link TVFInfo}s
   *
   * @param projectId The projectId from which to get the TVFs
   * @return The list of {@link TVFInfo} representing the TVFs in the project
   */
  List<TVFInfo> getAllTVFsInProject(String projectId);

  /**
   * Gets a set of BigQuery procedures and returns them as {@link ProcedureInfo}s
   *
   * @param projectId The default BigQuery project id. If a procedure reference does not specify the
   *     project, the default project is used.
   * @param procedureReferences The list of procedure references. Each reference should be in the
   *     format "project.dataset.procedure" or "dataset.procedure".
   * @return The list of {@link ProcedureInfo} representing the requested BigQuery procedures.
   */
  List<ProcedureInfo> getProcedures(String projectId, List<String> procedureReferences);

  /**
   * Gets all BigQuery procedures in a given dataset and returns them as {@link ProcedureInfo}s
   *
   * @param projectId The projectId the dataset belongs to
   * @param datasetName The name of the dataset from which to get the procedures
   * @return The list of {@link ProcedureInfo} representing the procedures in the dataset
   */
  List<ProcedureInfo> getAllProceduresInDataset(String projectId, String datasetName);

  /**
   * Gets all BigQuery procedures in a given project and returns them as {@link ProcedureInfo}s
   *
   * @param projectId The projectId from which to get the procedures
   * @return The list of {@link ProcedureInfo} representing the procedures in the project
   */
  List<ProcedureInfo> getAllProceduresInProject(String projectId);
}
