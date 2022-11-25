package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.api.gax.paging.Page;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQuery.DatasetListOption;
import com.google.cloud.bigquery.BigQuery.TableListOption;
import com.google.cloud.bigquery.Dataset;
import com.google.cloud.bigquery.DatasetId;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableId;
import com.google.pso.zetasql.helper.catalog.CatalogHelper;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.Type;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLType;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.xml.crypto.Data;

public class BigQueryCatalogHelper extends CatalogHelper {

  private final String defaultProjectId;
  private final BigQueryService service;

  public BigQueryCatalogHelper(String defaultProjectId) {
    this(
        defaultProjectId,
        BigQueryService.buildDefault()
    );
  }

  public BigQueryCatalogHelper(String defaultProjectId, BigQuery bigQueryClient) {
    this(
        defaultProjectId,
        new BigQueryService(bigQueryClient)
    );
  }

  private BigQueryCatalogHelper(String defaultProjectId, BigQueryService service) {
    this.defaultProjectId = defaultProjectId;
    this.service = service;
  }

  public SimpleCatalog createEmptyCatalog(String name) {
    SimpleCatalog catalog = super.createEmptyCatalog(name);
    this.addBigQueryTypeAliases(catalog);
    return catalog;
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

  private void registerTempTable(SimpleCatalog catalog, SimpleTable table) {
    CatalogOperations.createTableInCatalog(
        catalog,
        List.of(List.of(table.getName())),
        table.getColumnList()
    );
  }

  private void registerQualifiedTable(SimpleCatalog catalog, SimpleTable table) {
    BigQueryReference reference = BigQueryReference.from(
        this.defaultProjectId, table.getFullName()
    );
    String projectId = reference.getProjectId();
    String datasetName = reference.getDatasetId();
    String tableName = reference.getResourceName();

    List<List<String>> tablePaths = List.of(
        List.of(projectId, datasetName, tableName),  // format: project.dataset.table format
        List.of(projectId + "." + datasetName + "." + tableName),  // format: `project.dataset.table`
        List.of(projectId + "." + datasetName, tableName),  // format: `project.dataset`.table
        List.of(projectId, datasetName + "." + tableName),  // format: project.`dataset.table`
        List.of(datasetName, tableName),  // format: dataset.table (project implied)
        List.of(datasetName + "." + tableName)  // format: `dataset.table` (project implied)
    );

    CatalogOperations.createTableInCatalog(catalog, tablePaths, table.getColumnList());
  }

  @Override
  public void registerTable(SimpleCatalog catalog, SimpleTable table, boolean isTemp) {
    if(isTemp) {
      this.registerTempTable(catalog, table);
    } else {
      this.registerQualifiedTable(catalog, table);
    }
  }

  private Optional<Table> fetchTable(String tableReference) {
    return this.service.fetchTable(this.defaultProjectId, tableReference);
  }

  private SimpleTable buildSimpleTable(Table table) {
    TableId tableId = table.getTableId();
    String fullTableName = BigQueryReference.from(tableId).getFullName();
    List<SimpleColumn> columns = BigQuerySchemaConverter.extractTableColumns(table);
    return CatalogOperations.buildSimpleTable(fullTableName, columns);
  }

  @Override
  public void addTables(SimpleCatalog catalog, List<List<String>> tablePaths) {
    tablePaths
        .stream()
        .map(tablePath -> String.join(".", tablePath))
        .map(this::fetchTable)
        .filter(Optional::isPresent)
        .map(Optional::get)
        .map(this::buildSimpleTable)
        .forEach(simpleTable -> this.registerTable(catalog, simpleTable, false));
  }

  public void addAllTablesFromDataset(SimpleCatalog catalog, String projectId, String datasetName) {
    DatasetId datasetId = DatasetId.of(projectId, datasetName);
    Page<Table> tables = this.service.getClient().listTables(
        datasetId, TableListOption.pageSize(100)
    );

    for(Table table : tables.iterateAll()) {
      this.addTable(
          catalog, List.of(projectId, datasetName, table.getTableId().getTable())
      );
    }

  }

  public void addAllTablesFromProject(SimpleCatalog catalog, String projectId) {
    Page<Dataset> datasets = this.service.getClient().listDatasets(
        projectId, DatasetListOption.pageSize(100)
    );

    for(Dataset dataset : datasets.iterateAll()) {
      this.addAllTablesFromDataset(catalog, projectId, dataset.getDatasetId().getDataset());
    }
  }

}
