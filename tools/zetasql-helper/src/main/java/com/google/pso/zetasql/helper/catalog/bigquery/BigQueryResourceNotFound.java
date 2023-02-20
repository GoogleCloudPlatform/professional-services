package com.google.pso.zetasql.helper.catalog.bigquery;

public class BigQueryResourceNotFound extends RuntimeException {

  private final String reference;

  public BigQueryResourceNotFound(String reference) {
    super("BigQuery resource not found: " + reference);
    this.reference = reference;
  }

  public String getReference() {
    return reference;
  }

}
