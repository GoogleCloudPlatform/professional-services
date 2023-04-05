package com.google.zetasql.toolkit.examples;

import com.google.zetasql.toolkit.catalog.bigquery.BigQueryCatalog;
import java.util.List;

public class AddResourcesToBigQueryCatalog {

  public static void main(String[] args) {
    BigQueryCatalog catalog = new BigQueryCatalog("bigquery-public-data");

    // Add a table or a set of tables by name
    // Views are considered tables as well, so they can be added this way to the catalog
    catalog.addTable("bigquery-public-data.samples.wikipedia");
    catalog.addTables(
        List.of(
            "bigquery-public-data.samples.wikipedia",
            "bigquery-public-data.samples.github_nested"));

    // Add all tables in a dataset or project
    // Views are considered tables as well, so they will be added to the catalog too
    catalog.addAllTablesInDataset("projectId", "datasetName");
    catalog.addAllTablesInProject("projectId");

    // Add a function or a set of functions by name
    // For the time being, functions must have an explicit return type (i.e. creating with
    // a RETURNS clause); otherwise adding them will fail.
    catalog.addFunction("project.dataset.function");
    catalog.addFunctions(List.of("project.dataset.function2", "project.dataset.function3"));

    // Add all functions in a dataset or project
    // For the time being, functions without an explicit return type are silently ignored
    catalog.addAllFunctionsInDataset("projectId", "datasetName");
    catalog.addAllFunctionsInProject("projectId");

    // Add a TVF or a set of TVFs by name
    // For the time being, TVFs must have an explicit return type (i.e. creating with
    // a RETURNS clause); otherwise adding them will fail.
    catalog.addTVF("project.dataset.tvf");
    catalog.addTVFs(List.of("project.dataset.tvf2", "project.dataset.tvf3"));

    // Add all TVFs in a dataset or project
    // For the time being, TVFs without an explicit return type are silently ignored
    catalog.addAllTVFsInDataset("projectId", "datasetName");
    catalog.addAllTVFsInProject("projectId");

    // Add a procedure or a set of procedures by name
    catalog.addProcedure("project.dataset.procedure");
    catalog.addProcedures(List.of("project.dataset.procedure1", "project.dataset.procedure2"));

    // Add all procedures in a dataset or project
    catalog.addAllProceduresInDataset("projectId", "datasetName");
    catalog.addAllProceduresInProject("projectId");
  }
}
