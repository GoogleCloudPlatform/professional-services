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

import com.google.cloud.bigquery.RoutineId;
import com.google.cloud.bigquery.TableId;
import com.google.common.base.CharMatcher;
import com.google.common.collect.ImmutableList;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.InvalidBigQueryReference;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import java.util.regex.Pattern;

/** Dataclass representing a reference to a BigQuery resource. */
class BigQueryReference {

  private static final Pattern PROJECT_PATTERN = Pattern.compile("[a-zA-Z0-9\\.\\-\\:]+");
  private static final Pattern DATASET_PATTERN = Pattern.compile("[a-zA-Z_][a-zA-Z0-9\\_]*");
  private static final Pattern RESOURCE_PATTERN = Pattern.compile("[a-zA-Z0-9\\_]+");
  private final String projectId;
  private final String datasetId;
  private final String resourceName;

  public BigQueryReference(String projectId, String datasetId, String resourceName) {
    this.projectId = projectId;
    this.datasetId = datasetId;
    this.resourceName = resourceName;
    if (!PROJECT_PATTERN.matcher(projectId).matches()
        || !DATASET_PATTERN.matcher(datasetId).matches()
        || !RESOURCE_PATTERN.matcher(resourceName).matches()) {
      throw new InvalidBigQueryReference(this.getFullName());
    }
  }

  public static BigQueryReference from(TableId tableId) {
    return new BigQueryReference(tableId.getProject(), tableId.getDataset(), tableId.getTable());
  }

  public static BigQueryReference from(RoutineId routineId) {
    return new BigQueryReference(
        routineId.getProject(), routineId.getDataset(), routineId.getRoutine());
  }

  /**
   * Creates a BigQueryReference given the BigQuery default project id and a reference string in the
   * format of "project.dataset.resource" or "dataset.resource".
   *
   * @param projectId The BigQuery default project id
   * @param referenceString The reference string for the resource
   * @return A BigQueryReference instance representing the resource
   * @throws InvalidBigQueryReference if the project or reference are invalid
   */
  public static BigQueryReference from(String projectId, String referenceString) {
    LinkedList<String> elements = new LinkedList<>(Arrays.asList(referenceString.split("\\.")));
    int numberOfElements = elements.size();

    if (!List.of(2, 3).contains(numberOfElements)) {
      throw new InvalidBigQueryReference(referenceString);
    }

    if (numberOfElements == 2) {
      elements.addFirst(projectId);
    }

    return new BigQueryReference(elements.get(0), elements.get(1), elements.get(2));
  }

  /**
   * Returns whether the provided BigQuery reference string is qualified
   *
   * @param referenceString The reference string to check (e.g. dataset.table)
   * @return Whether the reference is qualified
   */
  public static boolean isQualified(String referenceString) {
    return CharMatcher.is('.').countIn(referenceString) > 0;
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
        "%s.%s.%s", this.getProjectId(), this.getDatasetId(), this.getResourceName());
  }

  public ImmutableList<String> getNamePath() {
    return ImmutableList.of(this.getProjectId(), this.getDatasetId(), this.getResourceName());
  }

  public TableId toTableId() {
    return TableId.of(this.getProjectId(), this.getDatasetId(), this.getResourceName());
  }

  public RoutineId toRoutineId() {
    return RoutineId.of(this.getProjectId(), this.getDatasetId(), this.getResourceName());
  }
}
