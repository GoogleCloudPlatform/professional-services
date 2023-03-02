package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.cloud.bigquery.BigQuery;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.catalog.CatalogWrapper;
import com.google.zetasql.Function;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.Type;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
import com.google.zetasql.ZetaSQLType;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class BigQueryCatalog implements CatalogWrapper {

  private final String defaultProjectId;
  private final BigQueryResourceProvider bigQueryResourceProvider;
  private final SimpleCatalog catalog;

  public BigQueryCatalog(String defaultProjectId) {
    this(
        defaultProjectId,
        new BigQueryAPIResourceProvider()
    );
  }

  public BigQueryCatalog(String defaultProjectId, BigQuery bigQueryClient) {
    this(
        defaultProjectId,
        new BigQueryAPIResourceProvider(bigQueryClient)
    );
  }

  private BigQueryCatalog(
      String defaultProjectId,
      BigQueryResourceProvider bigQueryResourceProvider
  ) {
    this.defaultProjectId = defaultProjectId;
    this.bigQueryResourceProvider = bigQueryResourceProvider;
    this.catalog = new SimpleCatalog("catalog");
    this.catalog.addZetaSQLFunctions(new ZetaSQLBuiltinFunctionOptions());
    this.addBigQueryTypeAliases(this.catalog);
  }

  private BigQueryCatalog(
      String defaultProjectId,
      BigQueryResourceProvider bigQueryResourceProvider,
      SimpleCatalog internalCatalog
  ) {
    this.defaultProjectId = defaultProjectId;
    this.bigQueryResourceProvider = bigQueryResourceProvider;
    this.catalog = internalCatalog;
  }

  private void addBigQueryTypeAliases(SimpleCatalog catalog) {
    Map<String, Type> bigQueryTypeAliases = Map.of(
        "INT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "SMALLINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "INTEGER", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "BIGINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "TINYINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "BYTEINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
        "DECIMAL", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_NUMERIC),
        "BIGDECIMAL", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_BIGNUMERIC)
    );

    bigQueryTypeAliases.forEach(catalog::addType);
  }

  private void validateCreateScope(
      CreateScope scope,
      List<CreateScope> allowedScopes,
      String resourceFullName,
      String resourceType
  ) {
    if(!allowedScopes.contains(scope)) {
      String message = String.format(
          "Invalid create scope %s for BigQuery %s %s",
          scope, resourceType, resourceFullName
      );
      throw new BigQueryCreateError(message, scope, resourceFullName);
    }
  }

  private void validateNamePathForCreation(
      List<String> namePath,
      CreateScope createScope,
      String resourceType
  ) {
    String fullName = String.join(".", namePath);
    List<String> flattenedNamePath = namePath.stream()
        .flatMap(pathElement -> Arrays.stream(pathElement.split("\\.")))
        .collect(Collectors.toList());

    if(createScope.equals(CreateScope.CREATE_TEMP) && flattenedNamePath.size() > 1) {
      String message = String.format(
          "Cannot create BigQuery TEMP %s %s, TEMP resources should not be qualified",
          resourceType, fullName
      );
      throw new BigQueryCreateError(message, createScope, fullName);
    }
  }

  private List<List<String>> buildCatalogPathsForResource(BigQueryReference reference) {
    String projectId = reference.getProjectId();
    String datasetName = reference.getDatasetId();
    String resourceName = reference.getResourceName();

    List<List<String>> resourcePaths = List.of(
        List.of(projectId, datasetName, resourceName),  // format: project.dataset.table format
        List.of(projectId + "." + datasetName + "." + resourceName),  // format: `project.dataset.table`
        List.of(projectId + "." + datasetName, resourceName),  // format: `project.dataset`.table
        List.of(projectId, datasetName + "." + resourceName)  // format: project.`dataset.table`
    );

    List<List<String>> resourcePathsWithImplicitProject = List.of();

    if(projectId.equals(this.defaultProjectId)) {
      resourcePathsWithImplicitProject = List.of(
          List.of(datasetName, resourceName),  // format: dataset.table (project implied)
          List.of(datasetName + "." + resourceName)  // format: `dataset.table` (project implied)
      );
    }

    return Stream.concat(resourcePaths.stream(), resourcePathsWithImplicitProject.stream())
        .collect(Collectors.toList());
  }

  private List<List<String>> buildCatalogPathsForResource(String referenceStr) {
    BigQueryReference reference = BigQueryReference.from(
        this.defaultProjectId, referenceStr
    );
    return this.buildCatalogPathsForResource(reference);
  }

  private List<List<String>> buildCatalogPathsForResource(List<String> resourcePath) {
    return this.buildCatalogPathsForResource(String.join(".", resourcePath));
  }

  @Override
  public void register(SimpleTable table, CreateMode createMode, CreateScope createScope) {
    this.validateCreateScope(
        createScope,
        List.of(CreateScope.CREATE_DEFAULT_SCOPE, CreateScope.CREATE_TEMP),
        table.getFullName(),
        "table"
    );
    this.validateNamePathForCreation(List.of(table.getFullName()), createScope, "table");

    List<List<String>> tablePaths = createScope.equals(CreateScope.CREATE_TEMP)
        ? List.of(List.of(table.getName()))
        : this.buildCatalogPathsForResource(table.getFullName());

    CatalogOperations.createTableInCatalog(
        this.catalog, tablePaths, table.getFullName(), table.getColumnList(), createMode
    );
  }

  @Override
  public void register(Function function, CreateMode createMode, CreateScope createScope) {
    List<String> functionNamePath = function.getNamePath();
    String fullName = String.join(".", functionNamePath);

    this.validateCreateScope(
        createScope,
        List.of(CreateScope.CREATE_DEFAULT_SCOPE, CreateScope.CREATE_TEMP),
        fullName,
        "function"
    );
    this.validateNamePathForCreation(functionNamePath, createScope, "function");

    List<List<String>> functionPaths = createScope.equals(CreateScope.CREATE_TEMP)
        ? List.of(functionNamePath)
        : this.buildCatalogPathsForResource(functionNamePath);

    CatalogOperations.createFunctionInCatalog(this.catalog, functionPaths, function, createMode);
  }

  @Override
  public void register(TVFInfo tvfInfo, CreateMode createMode, CreateScope createScope) {
    String fullName = String.join(".", tvfInfo.getNamePath());

    this.validateCreateScope(
        createScope,
        List.of(CreateScope.CREATE_DEFAULT_SCOPE),
        fullName,
        "TVF"
    );
    this.validateNamePathForCreation(tvfInfo.getNamePath(), createScope, "TVF");

    List<List<String>> functionPaths = this.buildCatalogPathsForResource(fullName);
    CatalogOperations.createTVFInCatalog(this.catalog, functionPaths, tvfInfo, createMode);
  }

  @Override
  public void register(
      ProcedureInfo procedureInfo,
      CreateMode createMode,
      CreateScope createScope
  ) {
    String fullName = String.join(".", procedureInfo.getNamePath());

    this.validateCreateScope(
        createScope,
        List.of(CreateScope.CREATE_DEFAULT_SCOPE),
        fullName,
        "procedure"
    );
    this.validateNamePathForCreation(List.of(fullName), createScope, "procedure");

    List<List<String>> procedurePaths = this.buildCatalogPathsForResource(fullName);

    CatalogOperations.createProcedureInCatalog(
        this.catalog, procedurePaths, procedureInfo, createMode
    );
  }

  @Override
  public void addTables(List<List<String>> tablePaths) {
    List<String> tableReferences = tablePaths
        .stream()
        .map(tablePath -> String.join(".", tablePath))
        .collect(Collectors.toList());

    this.bigQueryResourceProvider
        .getTables(this.defaultProjectId, tableReferences)
        .forEach(table -> this.register(
            table, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE)
        );
  }

  public void addAllTablesInDataset(String projectId, String datasetName) {
    this.bigQueryResourceProvider
        .getAllTablesInDataset(projectId, datasetName)
        .forEach(table -> this.register(
            table, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE)
        );
  }

  public void addAllTablesInProject(String projectId) {
    this.bigQueryResourceProvider
        .getAllTablesInProject(projectId)
        .forEach(table -> this.register(
            table, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE)
        );
  }

  @Override
  public void addFunctions(List<List<String>> functionPaths) {
    List<String> functionReferences = functionPaths
        .stream()
        .map(functionPath -> String.join(".", functionPath))
        .collect(Collectors.toList());

    this.bigQueryResourceProvider
        .getFunctions(this.defaultProjectId, functionReferences)
        .forEach(function -> this.register(
            function, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
        ));
  }

  public void addAllFunctionsInDataset(String projectId, String datasetName) {
    this.bigQueryResourceProvider
        .getAllFunctionsInDataset(projectId, datasetName)
        .forEach(function -> this.register(
            function, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
        ));
  }

  public void addAllFunctionsInProject(String projectId) {
    this.bigQueryResourceProvider
        .getAllFunctionsInProject(projectId)
        .forEach(function -> this.register(
            function, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
        ));
  }

  @Override
  public void addTVFs(List<List<String>> functionPaths) {
    List<String> functionReferences = functionPaths
        .stream()
        .map(functionPath -> String.join(".", functionPath))
        .collect(Collectors.toList());

    this.bigQueryResourceProvider
        .getTVFs(this.defaultProjectId, functionReferences)
        .forEach(tvfInfo -> this.register(
            tvfInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
        ));
  }

  public void addAllTVFsInDataset(String projectId, String datasetName) {
    this.bigQueryResourceProvider
        .getAllTVFsInDataset(projectId, datasetName)
        .forEach(tvfInfo -> this.register(
            tvfInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
        ));
  }

  public void addAllTVFsInProject(String projectId) {
    this.bigQueryResourceProvider
        .getAllTVFsInProject(projectId)
        .forEach(tvfInfo -> this.register(
            tvfInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
        ));
  }

  @Override
  public void addProcedures(List<List<String>> procedurePaths) {
    List<String> procedureReferences = procedurePaths
        .stream()
        .map(functionPath -> String.join(".", functionPath))
        .collect(Collectors.toList());

    this.bigQueryResourceProvider
        .getProcedures(this.defaultProjectId, procedureReferences)
        .forEach(procedureInfo -> this.register(
            procedureInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
        ));
  }

  public void addAllProceduresInDataset(String projectId, String datasetName) {
    this.bigQueryResourceProvider
        .getAllProceduresInDataset(projectId, datasetName)
        .forEach(procedureInfo -> this.register(
            procedureInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
        ));
  }

  public void addAllProceduresInProject(String projectId) {
    this.bigQueryResourceProvider
        .getAllProceduresInProject(projectId)
        .forEach(procedureInfo -> this.register(
            procedureInfo, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
        ));
  }

  @Override
  public BigQueryCatalog copy(boolean deepCopy) {
    return new BigQueryCatalog(
        this.defaultProjectId,
        this.bigQueryResourceProvider,
        CatalogOperations.copyCatalog(this.getZetaSQLCatalog(), deepCopy)
    );
  }

  @Override
  public SimpleCatalog getZetaSQLCatalog() {
    return this.catalog;
  }

}
