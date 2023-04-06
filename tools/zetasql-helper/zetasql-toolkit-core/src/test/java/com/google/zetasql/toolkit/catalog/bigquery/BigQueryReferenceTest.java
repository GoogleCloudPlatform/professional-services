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

import static org.junit.jupiter.api.Assertions.*;

import com.google.zetasql.toolkit.catalog.bigquery.exceptions.InvalidBigQueryReference;
import org.junit.jupiter.api.Test;

public class BigQueryReferenceTest {

  @Test
  void testParseFullyQualifiedReference() {
    String projectId = "project";
    String datasetId = "dataset";
    String resourceName = "resource";

    BigQueryReference reference =
        assertDoesNotThrow(
            () ->
                BigQueryReference.from(
                    projectId, String.format("%s.%s.%s", projectId, datasetId, resourceName)));

    assertAll(
        () -> assertEquals(projectId, reference.getProjectId()),
        () -> assertEquals(datasetId, reference.getDatasetId()),
        () -> assertEquals(resourceName, reference.getResourceName()));
  }

  @Test
  void testParseReferenceWithImplicitProject() {
    String projectId = "project";
    String datasetId = "dataset";
    String resourceName = "resource";

    BigQueryReference reference =
        assertDoesNotThrow(
            () ->
                BigQueryReference.from(projectId, String.format("%s.%s", datasetId, resourceName)));

    assertAll(
        () -> assertEquals(projectId, reference.getProjectId()),
        () -> assertEquals(datasetId, reference.getDatasetId()),
        () -> assertEquals(resourceName, reference.getResourceName()));
  }

  @Test
  void testInvalidReferences() {
    assertThrows(
        InvalidBigQueryReference.class,
        () -> BigQueryReference.from("project", "not.a.valid.ref.string"));

    assertThrows(
        InvalidBigQueryReference.class, () -> BigQueryReference.from("project", "notvalid"));
  }
}
