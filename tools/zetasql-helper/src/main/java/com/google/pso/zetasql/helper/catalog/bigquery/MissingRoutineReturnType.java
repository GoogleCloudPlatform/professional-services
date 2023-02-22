package com.google.pso.zetasql.helper.catalog.bigquery;

public class MissingRoutineReturnType extends BigQueryCatalogException {

  private final String routineReference;

  public MissingRoutineReturnType(String routineReference) {
    super(String.format(
        "BigQuery routine %s is missing an explicit return type. UDFs and Table Valued Functions "
        + "should be define with a RETURNS clause.",
        routineReference
    ));
    this.routineReference = routineReference;
  }

  public String getRoutineReference() {
    return routineReference;
  }

}
