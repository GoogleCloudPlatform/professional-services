package com.google.pso.zetasql.helper.catalog.bigquery;

public class InvalidBigQueryReference extends RuntimeException {

  private final String reference;

  public InvalidBigQueryReference(String reference) {
    super("Invalid BigQuery reference: " + reference);
    this.reference = reference;
  }

  public String getReference() {
    return reference;
  }

}
