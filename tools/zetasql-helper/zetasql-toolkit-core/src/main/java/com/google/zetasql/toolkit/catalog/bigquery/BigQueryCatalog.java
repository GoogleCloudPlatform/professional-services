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

import com.google.cloud.bigquery.BigQuery;
import com.google.zetasql.*;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import com.google.zetasql.toolkit.catalog.CatalogOperations;
import com.google.zetasql.toolkit.catalog.CatalogWrapper;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.BigQueryCreateError;
import com.google.zetasql.toolkit.catalog.exceptions.CatalogResourceAlreadyExists;
import com.google.zetasql.toolkit.options.BigQueryLanguageOptions;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * {@link CatalogWrapper} implementation that follows BigQuery semantics. Facilitates building a
 * ZetaSQL {@link SimpleCatalog} with BigQuery resources and following BigQuery semantics for types
 * and name resolution.
 */
public class BigQueryCatalog implements CatalogWrapper {

  private final String defaultProjectId;
  private final BigQueryResourceProvider bigQueryResourceProvider;
  private final SimpleCatalog catalog;

  /**
   * Constructs a BigQueryCatalog that fetches resources from the BigQuery API using application
   * default credentials.
   *
   * <p>A BigQueryCatalog constructed this way will use the default {@link
   * BigQueryAPIResourceProvider} for accessing the API.
   *
   * @param defaultProjectId The BigQuery default project id, queries are assumed to be running on
   *     this project
   */
  public BigQueryCatalog(String defaultProjectId) {
    this(defaultProjectId, BigQueryAPIResourceProvider.buildDefault());
  }

  /**
   * Constructs a BigQueryCatalog that fetches resources from the BigQuery API using the provided
   * BigQuery Client.
   *
   * <p>A BigQueryCatalog constructed this way will use the {@link BigQueryAPIResourceProvider} for
   * accessing the API using the provided BigQuery client.
   *
   * @param defaultProjectId The BigQuery default project id, queries are assumed to be running on
   *     this project
   * @param bigQueryClient The BigQuery client to use for accessing the API
   */
  public BigQueryCatalog(String defaultProjectId, BigQuery bigQueryClient) {
    this(defaultProjectId, BigQueryAPIResourceProvider.build(bigQueryClient));
  }

  /**
   * Constructs a BigQueryCatalog that uses the provided {@link BigQueryResourceProvider} for
   * getting resources.
   *
   * @param defaultProjectId The BigQuery default project id, queries are assumed to be running on
   *     this project
   * @param bigQueryResourceProvider The BigQueryResourceProvider this catalog will use to get
   *     resources
   */
  public BigQueryCatalog(
      String defaultProjectId, BigQueryResourceProvider bigQueryResourceProvider) {
    this.defaultProjectId = defaultProjectId;
    this.bigQueryResourceProvider = bigQueryResourceProvider;
    this.catalog = new SimpleCatalog("catalog");
    this.catalog.addZetaSQLFunctionsAndTypes(
        new ZetaSQLBuiltinFunctionOptions(BigQueryLanguageOptions.get()));
    BigQueryBuiltIns.addToCatalog(this.catalog);
  }

  /** Private constructor used for implementing {@link #copy()} */
  private BigQueryCatalog(
      String defaultProjectId,
      BigQueryResourceProvider bigQueryResourceProvider,
      SimpleCatalog internalCatalog) {
    this.defaultProjectId = defaultProjectId;
    this.bigQueryResourceProvider = bigQueryResourceProvider;
    this.catalog = internalCatalog;
  }

  /**
   * Validates that a {@link CreateScope} is in a list of allowed scopes, used before creation of
   * resources. Throws {@link BigQueryCreateError} in case the scope is not allowed.
   *
   * @param scope The CreateScope to be validated
   * @param allowedScopes The list of allowed CreateScopes
   * @param resourceFullName The full name of the resource being created, used for error reporting
   * @param resourceType The name of the type of resource being created, used for error reporting
   * @throws BigQueryCreateError if the validation fails
   */
  private void validateCreateScope(
      CreateScope scope,
      List<CreateScope> allowedScopes,
      String resourceFullName,
      String resourceType) {
    if (!allowedScopes.contains(scope)) {
      String message =
          String.format(
              "Invalid create scope %s for BigQuery %s %s", scope, resourceType, resourceFullName);
      throw new BigQueryCreateError(message, scope, resourceFullName);
    }
  }

  /**
   * Validates a resources name path before its creation. If the name path is invalid, throws {@link
   * BigQueryCreateError}.
   *
   * @param namePath The name path to be validated
   * @param createScope The CreateScope used to create this resource
   * @param resourceType he name of the type of resource being created, used for error reporting
   * @throws BigQueryCreateError if the validation fails
   */
  private void validateNamePathForCreation(
      List<String> namePath, CreateScope createScope, String resourceType) {
    String fullName = String.join(".", namePath);
    List<String> flattenedNamePath =
        namePath.stream()
            .flatMap(pathElement -> Arrays.stream(pathElement.split("\\.")))
            .collect(Collectors.toList());

    // Names for TEMP BigQuery resources should not be qualified
    if (createScope.equals(CreateScope.CREATE_TEMP) && flattenedNamePath.size() > 1) {
      String message =
          String.format(
              "Cannot create BigQuery TEMP %s %s, TEMP resources should not be qualified",
              resourceType, fullName);
      throw new BigQueryCreateError(message, createScope, fullName);
    }

    // Names for persistent BigQuery resources should be qualified
    if (!createScope.equals(CreateScope.CREATE_TEMP) && flattenedNamePath.size() == 1) {
      String message =
          String.format(
              "Cannot create BigQuery %s %s, persistent BigQuery resources should be qualified",
              resourceType, fullName);
      throw new BigQueryCreateError(message, createScope, fullName);
    }
  }

  /**
   * Creates the list of resource paths that should be used for creating a resource to make sure it
   * is always found when analyzing queries.
   *
   * <p>Given the way the ZetaSQL {@link SimpleCatalog} resolves names, different ways of
   * referencing resources while querying results in different lookups. For example; "SELECT * FROM
   * `A.B`" will look for a table named "A.B", while "SELECT * FROM `A`.`B`" will look for a table
   * named "B" on a catalog named "A".
   *
   * <p>Because of the previous point, a table or function being created needs to be registered in
   * multiple paths. This method creates all those distinct paths. Given the resource
   * "project.dataset.resource", this method will create these paths:
   *
   * <ul>
   *   <li>["project.dataset.resource"]
   *   <li>["project", "dataset", "resource"]
   *   <li>["project", "dataset.resource"]
   *   <li>["project.dataset", "resource"]
   *   <li>["dataset.resource"] if the resource project is this catalog's default project id
   *   <li>["dataset", "resource"] if the resource project is this catalog's default project id
   * </ul>
   *
   * @param reference The BigQueryReference for the resource that needs to be created
   * @return All the distinct name paths at which the resource should be created
   */
  private List<List<String>> buildCatalogPathsForResource(BigQueryReference reference) {
    String projectId = reference.getProjectId();
    String datasetName = reference.getDatasetId();
    String resourceName = reference.getResourceName();

    List<List<String>> resourcePaths =
        List.of(
            List.of(projectId, datasetName, resourceName), // format: project.dataset.table format
            List.of(
                projectId
                    + "."
                    + datasetName
                    + "."
                    + resourceName), // format: `project.dataset.table`
            List.of(projectId + "." + datasetName, resourceName), // format: `project.dataset`.table
            List.of(projectId, datasetName + "." + resourceName) // format: project.`dataset.table`
            );

    List<List<String>> resourcePathsWithImplicitProject = List.of();

    if (projectId.equals(this.defaultProjectId)) {
      resourcePathsWithImplicitProject =
          List.of(
              List.of(datasetName, resourceName), // format: dataset.table (project implied)
              List.of(datasetName + "." + resourceName) // format: `dataset.table` (project implied)
              );
    }

    return Stream.concat(resourcePaths.stream(), resourcePathsWithImplicitProject.stream())
        .collect(Collectors.toList());
  }

  /** @see #buildCatalogPathsForResource(BigQueryReference) */
  private List<List<String>> buildCatalogPathsForResource(String referenceStr) {
    BigQueryReference reference = BigQueryReference.from(this.defaultProjectId, referenceStr);
    return this.buildCatalogPathsForResource(reference);
  }

  /** @see #buildCatalogPathsForResource(BigQueryReference) */
  private List<List<String>> buildCatalogPathsForResource(List<String> resourcePath) {
    return this.buildCatalogPathsForResource(String.join(".", resourcePath));
  }

  private CatalogResourceAlreadyExists addCaseInsensitivityWarning(
      CatalogResourceAlreadyExists error) {
    return new CatalogResourceAlreadyExists(
        error.getResourceName(),
        String.format(
            "Catalog resource already exists: %s. BigQuery resources are treated as "
                + "case-insensitive, so resources with the same name but different casing "
                + "are treated as equals and can trigger this error.",
            error.getResourceName()),
        error);
  }

  /**
   * {@inheritDoc}
   *
   * <p>Multiple copies of the registered {@link SimpleTable} will be created in the Catalog to
   * comply with BigQuery name resolution semantics.
   *
   * @see #buildCatalogPathsForResource(BigQueryReference)
   * @throws BigQueryCreateError if a pre-create validation fails
   * @throws CatalogResourceAlreadyExists if the table already exists and CreateMode !=
   *     CREATE_OR_REPLACE
   */
  @Override
  public void register(SimpleTable table, CreateMode createMode, CreateScope createScope) {
    this.validateCreateScope(
        createScope,
        List.of(CreateScope.CREATE_DEFAULT_SCOPE, CreateScope.CREATE_TEMP),
        table.getFullName(),
        "table");
    this.validateNamePathForCreation(List.of(table.getFullName()), createScope, "table");

    List<List<String>> tablePaths =
        createScope.equals(CreateScope.CREATE_TEMP)
            ? List.of(List.of(table.getName()))
            : this.buildCatalogPathsForResource(table.getFullName());

    try {
      CatalogOperations.createTableInCatalog(
          this.catalog, tablePaths, table.getFullName(), table.getColumnList(), createMode);
    } catch (CatalogResourceAlreadyExists alreadyExists) {
      throw this.addCaseInsensitivityWarning(alreadyExists);
    }
  }

  /**
   * {@inheritDoc}
   *
   * <p>Multiple copies of the registered {@link Function} will be created in the Catalog to comply
   * with BigQuery name resolution semantics.
   *
   * @see #buildCatalogPathsForResource(BigQueryReference)
   * @throws BigQueryCreateError if a pre-create validation fails
   * @throws CatalogResourceAlreadyExists if the function already exists and CreateMode !=
   *     CREATE_OR_REPLACE
   */
  @Override
  public void register(Function function, CreateMode createMode, CreateScope createScope) {
    List<String> functionNamePath = function.getNamePath();
    String fullName = String.join(".", functionNamePath);

    this.validateCreateScope(
        createScope,
        List.of(CreateScope.CREATE_DEFAULT_SCOPE, CreateScope.CREATE_TEMP),
        fullName,
        "function");
    this.validateNamePathForCreation(functionNamePath, createScope, "function");

    List<List<String>> functionPaths =
        createScope.equals(CreateScope.CREATE_TEMP)
            ? List.of(functionNamePath)
            : this.buildCatalogPathsForResource(functionNamePath);

    try {
      CatalogOperations.createFunctionInCatalog(this.catalog, functionPaths, function, createMode);
    } catch (CatalogResourceAlreadyExists alreadyExists) {
      throw this.addCaseInsensitivityWarning(alreadyExists);
    }
  }

  /**
   * {@inheritDoc}
   *
   * @throws BigQueryCreateError if a pre-create validation fails
   * @throws CatalogResourceAlreadyExists if the function already exists and CreateMode !=
   *     CREATE_OR_REPLACE
   */
  @Override
  public void register(TVFInfo tvfInfo, CreateMode createMode, CreateScope createScope) {
    String fullName = String.join(".", tvfInfo.getNamePath());

    this.validateCreateScope(
        createScope, List.of(CreateScope.CREATE_DEFAULT_SCOPE), fullName, "TVF");
    this.validateNamePathForCreation(tvfInfo.getNamePath(), createScope, "TVF");

    List<List<String>> functionPaths = this.buildCatalogPathsForResource(fullName);

    try {
      CatalogOperations.createTVFInCatalog(this.catalog, functionPaths, tvfInfo, createMode);
    } catch (CatalogResourceAlreadyExists alreadyExists) {
      throw this.addCaseInsensitivityWarning(alreadyExists);
    }
  }

  /**
   * {@inheritDoc}
   *
   * <p>Multiple copies of the registered {@link Procedure} will be created in the Catalog to comply
   * with BigQuery name resolution semantics.
   *
   * @see #buildCatalogPathsForResource(BigQueryReference)
   * @throws BigQueryCreateError if a pre-create validation fails
   * @throws CatalogResourceAlreadyExists if the precedure already exists and CreateMode !=
   *     CREATE_OR_REPLACE
   */
  @Override
  public void register(
      ProcedureInfo procedureInfo, CreateMode createMode, CreateScope createScope) {
    String fullName = String.join(".", procedureInfo.getNamePath());

    this.validateCreateScope(
        createScope, List.of(CreateScope.CREATE_DEFAULT_SCOPE), fullName, "procedure");
    this.validateNamePathForCreation(List.of(fullName), createScope, "procedure");

    List<List<String>> procedurePaths = this.buildCatalogPathsForResource(fullName);

    try {
      CatalogOperations.createProcedureInCatalog(
          this.catalog, procedurePaths, procedureInfo, createMode);
    } catch (CatalogResourceAlreadyExists alreadyExists) {
      throw this.addCaseInsensitivityWarning(alreadyExists);
    }
  }

  @Override
  public void removeTable(String tableReference) {
    boolean isQualified = tableReference.split("\\.").length > 1;

    List<List<String>> tablePaths =
        !isQualified
            ? List.of(List.of(tableReference))
            : this.buildCatalogPathsForResource(tableReference);

    CatalogOperations.deleteTableFromCatalog(this.catalog, tablePaths);
  }

  @Override
  public void removeFunction(String functionReference) {
    boolean isQualified = functionReference.split("\\.").length > 1;

    List<List<String>> functionPaths =
        !isQualified
            ? List.of(List.of(functionReference))
            : this.buildCatalogPathsForResource(functionReference);

    CatalogOperations.deleteFunctionFromCatalog(this.catalog, functionPaths);
  }

  @Override
  public void removeTVF(String functionReference) {
    List<List<String>> functionPaths = this.buildCatalogPathsForResource(functionReference);
    CatalogOperations.deleteTVFFromCatalog(this.catalog, functionPaths);
  }

  @Override
  public void removeProcedure(String procedureReference) {
    List<List<String>> functionPaths = this.buildCatalogPathsForResource(procedureReference);
    CatalogOperations.deleteProcedureFromCatalog(this.catalog, functionPaths);
  }

  /**
   * {@inheritDoc}
   *
   * <p>Table references should be in the format "project.dataset.table" or "dataset.table"
   */
  @Override
  public void addTables(List<String> tableReferences) {
    this.bigQueryResourceProvider
        .getTables(this.defaultProjectId, tableReferences)
        .forEach(
            table ->
                this.register(
                    table, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  /**
   * Adds all tables in the provided dataset to this catalog
   *
   * @param projectId The project id the dataset belongs to
   * @param datasetName The name of the dataset to get tables from
   */
  public void addAllTablesInDataset(String projectId, String datasetName) {
    this.bigQueryResourceProvider
        .getAllTablesInDataset(projectId, datasetName)
        .forEach(
            table ->
                this.register(
                    table, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  /**
   * Adds all tables in the provided project to this catalog
   *
   * @param projectId The project id to get tables from
   */
  public void addAllTablesInProject(String projectId) {
    this.bigQueryResourceProvider
        .getAllTablesInProject(projectId)
        .forEach(
            table ->
                this.register(
                    table, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  /**
   * {@inheritDoc}
   *
   * <p>Function references should be in the format "project.dataset.function" or "dataset.function"
   */
  @Override
  public void addFunctions(List<String> functionReferences) {
    this.bigQueryResourceProvider
        .getFunctions(this.defaultProjectId, functionReferences)
        .forEach(
            function ->
                this.register(
                    function, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  /**
   * Adds all functions in the provided dataset to this catalog
   *
   * @param projectId The project id the dataset belongs to
   * @param datasetName The name of the dataset to get functions from
   */
  public void addAllFunctionsInDataset(String projectId, String datasetName) {
    this.bigQueryResourceProvider
        .getAllFunctionsInDataset(projectId, datasetName)
        .forEach(
            function ->
                this.register(
                    function, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  /**
   * Adds all functions in the provided project to this catalog
   *
   * @param projectId The project id to get functions from
   */
  public void addAllFunctionsInProject(String projectId) {
    this.bigQueryResourceProvider
        .getAllFunctionsInProject(projectId)
        .forEach(
            function ->
                this.register(
                    function, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  /**
   * {@inheritDoc}
   *
   * <p>Function references should be in the format "project.dataset.function" or "dataset.function"
   */
  @Override
  public void addTVFs(List<String> functionReferences) {
    this.bigQueryResourceProvider
        .getTVFs(this.defaultProjectId, functionReferences)
        .forEach(
            tvfInfo ->
                this.register(
                    tvfInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  /**
   * Adds all TVFs in the provided dataset to this catalog
   *
   * @param projectId The project id the dataset belongs to
   * @param datasetName The name of the dataset to get TVFs from
   */
  public void addAllTVFsInDataset(String projectId, String datasetName) {
    this.bigQueryResourceProvider
        .getAllTVFsInDataset(projectId, datasetName)
        .forEach(
            tvfInfo ->
                this.register(
                    tvfInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  /**
   * Adds all TVFs in the provided project to this catalog
   *
   * @param projectId The project id to get TVFs from
   */
  public void addAllTVFsInProject(String projectId) {
    this.bigQueryResourceProvider
        .getAllTVFsInProject(projectId)
        .forEach(
            tvfInfo ->
                this.register(
                    tvfInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  /**
   * {@inheritDoc}
   *
   * <p>Procedure references should be in the format "project.dataset.procedure" or
   * "dataset.procedure"
   */
  @Override
  public void addProcedures(List<String> procedureReferences) {
    this.bigQueryResourceProvider
        .getProcedures(this.defaultProjectId, procedureReferences)
        .forEach(
            procedureInfo ->
                this.register(
                    procedureInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  @Override
  public void removeTables(List<String> tables) {}

  @Override
  public void removeFunctions(List<String> functions) {}

  @Override
  public void removeTVFs(List<String> functions) {}

  @Override
  public void removeProcedures(List<String> procedures) {}

  /**
   * Adds all procedures in the provided dataset to this catalog
   *
   * @param projectId The project id the dataset belongs to
   * @param datasetName The name of the dataset to get procedures from
   */
  public void addAllProceduresInDataset(String projectId, String datasetName) {
    this.bigQueryResourceProvider
        .getAllProceduresInDataset(projectId, datasetName)
        .forEach(
            procedureInfo ->
                this.register(
                    procedureInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  /**
   * Adds all procedures in the provided project to this catalog
   *
   * @param projectId The project id to get procedures from
   */
  public void addAllProceduresInProject(String projectId) {
    this.bigQueryResourceProvider
        .getAllProceduresInProject(projectId)
        .forEach(
            procedureInfo ->
                this.register(
                    procedureInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE));
  }

  @Override
  public BigQueryCatalog copy() {
    return new BigQueryCatalog(
        this.defaultProjectId,
        this.bigQueryResourceProvider,
        CatalogOperations.copyCatalog(this.getZetaSQLCatalog()));
  }

  @Override
  public SimpleCatalog getZetaSQLCatalog() {
    return this.catalog;
  }
}
