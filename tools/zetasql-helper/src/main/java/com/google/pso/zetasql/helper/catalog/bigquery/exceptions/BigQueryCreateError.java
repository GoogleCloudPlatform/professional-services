package com.google.pso.zetasql.helper.catalog.bigquery.exceptions;

import com.google.pso.zetasql.helper.catalog.bigquery.exceptions.BigQueryCatalogException;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;

public class BigQueryCreateError extends BigQueryCatalogException {

  private final CreateScope createScope;
  private final String resource;

  public BigQueryCreateError(String message, CreateScope createScope, String resource) {
    super(message);
    this.createScope = createScope;
    this.resource = resource;
  }

  public CreateScope getCreateScope() {
    return createScope;
  }

  public String getResource() {
    return resource;
  }
}
