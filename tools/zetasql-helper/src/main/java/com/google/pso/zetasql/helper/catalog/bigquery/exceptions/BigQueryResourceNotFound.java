package com.google.pso.zetasql.helper.catalog.bigquery.exceptions;

import com.google.pso.zetasql.helper.catalog.bigquery.exceptions.BigQueryCatalogException;

public class BigQueryResourceNotFound extends BigQueryCatalogException {

  private final String reference;

  public BigQueryResourceNotFound(String reference) {
    super("BigQuery resource not found: " + reference);
    this.reference = reference;
  }

  public String getReference() {
    return reference;
  }

}
