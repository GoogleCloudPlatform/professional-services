package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.cloud.bigquery.RoutineId;
import com.google.cloud.bigquery.TableId;

public class BigQueryReference {

  private final String projectId;
  private final String datasetId;
  private final String resourceName;

  public BigQueryReference(String projectId, String datasetId, String resourceName) {
    this.projectId = projectId;
    this.datasetId = datasetId;
    this.resourceName = resourceName;
  }

  public String getProjectId() {
    return projectId;
  }

  public String getDatasetId() {
    return datasetId;
  }

  public String getResourceName() {
    return resourceName;
  }

  public String getFullName() {
    return String.format(
        "%s.%s.%s",
        this.getProjectId(),
        this.getDatasetId(),
        this.getResourceName()
    );
  }

  public TableId toTableId() {
    return TableId.of(
        this.getProjectId(),
        this.getDatasetId(),
        this.getResourceName()
    );
  }

  public RoutineId toRoutineId() {
    return RoutineId.of(
        this.getProjectId(),
        this.getDatasetId(),
        this.getResourceName()
    );
  }

  public static BigQueryReference from(TableId tableId) {
    return new BigQueryReference(
        tableId.getProject(),
        tableId.getDataset(),
        tableId.getTable()
    );
  }
}
