package com.google.pso.zetasql.helper.catalog.bigquery;

public class InvalidBigQueryReference extends BigQueryCatalogException {

  private final String reference;

  public InvalidBigQueryReference(String reference) {
    super("Invalid BigQuery reference: " + reference);
    this.reference = reference;
  }

  public InvalidBigQueryReference(String reference, String reason) {
    super(String.format("Invalid BigQuery reference: %s: %s", reference, reason));
    this.reference = reference;
  }

  public String getReference() {
    return reference;
  }

}
