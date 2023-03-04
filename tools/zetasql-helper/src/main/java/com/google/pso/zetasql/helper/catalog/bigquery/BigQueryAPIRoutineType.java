package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.cloud.bigquery.Routine;

/**
 * Enumeration representing the types of {@link Routine} supported by
 * the BigQuery API. The labels associated with each type match the
 * routine types provided by the BigQuery API through {@link Routine#getRoutineType()}
 */
enum BigQueryAPIRoutineType {
  UDF("SCALAR_FUNCTION"),
  TVF("TABLE_VALUED_FUNCTION"),
  PROCEDURE("PROCEDURE");

  public final String label;

  BigQueryAPIRoutineType(String label) {
    this.label = label;
  }

  public String getLabel() {
    return this.label;
  }

}
