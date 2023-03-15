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

    BigQueryReference reference = assertDoesNotThrow(
        () -> BigQueryReference.from(
          projectId,
          String.format("%s.%s.%s", projectId, datasetId, resourceName)
      )
    );

    assertAll(
        () -> assertEquals(projectId, reference.getProjectId()),
        () -> assertEquals(datasetId, reference.getDatasetId()),
        () -> assertEquals(resourceName, reference.getResourceName())
    );
  }

  @Test
  void testParseReferenceWithImplicitProject() {
    String projectId = "project";
    String datasetId = "dataset";
    String resourceName = "resource";

    BigQueryReference reference = assertDoesNotThrow(
        () -> BigQueryReference.from(
            projectId,
            String.format("%s.%s", datasetId, resourceName)
        )
    );

    assertAll(
        () -> assertEquals(projectId, reference.getProjectId()),
        () -> assertEquals(datasetId, reference.getDatasetId()),
        () -> assertEquals(resourceName, reference.getResourceName())
    );
  }

  @Test
  void testInvalidReferences() {
    assertThrows(
        InvalidBigQueryReference.class,
        () -> BigQueryReference.from("project", "not.a.valid.ref.string")
    );

    assertThrows(
        InvalidBigQueryReference.class,
        () -> BigQueryReference.from("project", "notvalid")
    );
  }

}
