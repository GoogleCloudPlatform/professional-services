package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.cloud.bigquery.RoutineId;
import com.google.cloud.bigquery.TableId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.LinkedList;
import java.util.List;
import java.util.regex.Pattern;

public class BigQueryReference {

  private final String projectId;
  private final String datasetId;
  private final String resourceName;

  private static final Pattern PROJECT_PATTERN = Pattern.compile("[a-zA-Z0-9\\.\\-\\:]+");
  private static final Pattern DATASET_PATTERN = Pattern.compile("[a-zA-Z_][a-zA-Z0-9\\_]+");
  private static final Pattern RESOURCE_PATTERN = Pattern.compile("[a-zA-Z0-9\\_]+");

  public BigQueryReference(String projectId, String datasetId, String resourceName) {
    this.projectId = projectId;
    this.datasetId = datasetId;
    this.resourceName = resourceName;
    if(
        !PROJECT_PATTERN.matcher(projectId).matches()
        || !DATASET_PATTERN.matcher(datasetId).matches()
        || !RESOURCE_PATTERN.matcher(resourceName).matches()
    ) {
      throw new InvalidBigQueryReference(this.getFullName());
    }
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

  public List<String> getNamePath() {
    return List.of(
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

  public static BigQueryReference from(RoutineId routineId) {
    return new BigQueryReference(
        routineId.getProject(),
        routineId.getDataset(),
        routineId.getRoutine()
    );
  }

  public static BigQueryReference from(String projectId, String referenceString) {
    LinkedList<String> elements = new LinkedList<>(
        Arrays.asList(referenceString.split("\\."))
    );
    int numberOfElements = elements.size();

    if(!List.of(2, 3).contains(numberOfElements)) {
      throw new InvalidBigQueryReference(referenceString);
    }

    if(numberOfElements == 2) {
      elements.addFirst(projectId);
    }

    return new BigQueryReference(
        elements.get(0),
        elements.get(1),
        elements.get(2)
    );
  }

}
