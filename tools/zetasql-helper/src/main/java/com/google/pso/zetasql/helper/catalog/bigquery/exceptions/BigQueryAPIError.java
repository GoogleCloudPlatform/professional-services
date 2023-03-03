package com.google.pso.zetasql.helper.catalog.bigquery.exceptions;

import com.google.cloud.bigquery.BigQueryException;

public class BigQueryAPIError extends BigQueryCatalogException {

  public BigQueryAPIError(String message, BigQueryException cause) {
    super(message, cause);
  }

}
