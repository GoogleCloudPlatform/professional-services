package com.google.zetasql.toolkit.catalog.spanner.exceptions;

import java.util.List;

public class SpannerTablesNotFound extends SpannerCatalogException {

  private final List<String> tableNames;

  public SpannerTablesNotFound(List<String> tableNames) {
    super("Spanner tables not found in database: " + String.join(", ", tableNames));
    this.tableNames = tableNames;
  }

  public List<String> getTableNames() {
    return tableNames;
  }
}
