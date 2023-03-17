package com.google.zetasql.toolkit.examples;

import com.google.zetasql.toolkit.catalog.spanner.SpannerCatalog;
import java.util.List;

public class AddResourcesToSpannerCatalog {

  public static void main(String[] args) {
    SpannerCatalog catalog = new SpannerCatalog("projectId", "instance", "database");

    // Add a table or a set of tables by name
    // Views are considered tables as well, so they can be added this way to the catalog
    catalog.addTable("bigquery-public-data.samples.wikipedia");
    catalog.addTables(
        List.of(
            "bigquery-public-data.samples.wikipedia",
            "bigquery-public-data.samples.github_nested"));

    // Add all tables in the database
    // Views are considered tables as well, so they will be added to the catalog too
    catalog.addAllTablesInDatabase();
  }
}
