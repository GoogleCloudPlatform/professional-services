package com.google.pso.zetasql.helper.catalog.spanner;

public class InvalidSpannerTableName extends RuntimeException {

  private final String tableName;

  public InvalidSpannerTableName(String tableName) {
    super("Invalid Spanner table name: " + tableName);
    this.tableName = tableName;
  }

  public String getTableName() {
    return tableName;
  }

}
