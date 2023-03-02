package com.google.pso.zetasql.helper.catalog.spanner.exceptions;

import com.google.pso.zetasql.helper.catalog.spanner.exceptions.SpannerCatalogException;

public class InvalidSpannerTableName extends SpannerCatalogException {

  private final String tableName;

  public InvalidSpannerTableName(String tableName) {
    super("Invalid Spanner table name: " + tableName);
    this.tableName = tableName;
  }

  public String getTableName() {
    return tableName;
  }

}
