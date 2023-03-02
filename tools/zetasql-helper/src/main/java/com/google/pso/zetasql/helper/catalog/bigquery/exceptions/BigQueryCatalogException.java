package com.google.pso.zetasql.helper.catalog.bigquery.exceptions;

import com.google.pso.zetasql.helper.catalog.exceptions.CatalogException;

public class BigQueryCatalogException extends CatalogException {

  public BigQueryCatalogException(String message) {
    super(message);
  }

}
