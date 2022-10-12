/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery.dataset;


import com.google.cloud.pso.bqexternalviewgenerator.common.CustomUtils;
import java.util.ArrayList;
import java.util.stream.Collectors;

public class BigQueryDatasetDDLCreator {

  public static String makeCreateDDLs(ArrayList<String> bqDatasetNames) {
    return bqDatasetNames.stream()
        .map(fullDatasetName -> String.format("CREATE SCHEMA IF NOT EXISTS `%s`;", fullDatasetName))
        .collect(Collectors.joining("\n"));
  }

  public static String makeBQMetastoreViewDDL(
      ArrayList<String> bqDatasetNames, String targetViewName, String timeZone) {
    return String.format(
        "CREATE OR REPLACE VIEW `%s` AS\n"
            + "WITH all_ext_tables_and_views AS ( \n"
            + "%s\n"
            + ")\n"
            + "SELECT\n"
            + "  table_catalog as bq_project, \n"
            + "  table_schema as bq_dataset, \n"
            + "  table_name, \n"
            + "  table_type, \n"
            + "  DATETIME(creation_time, '%s') as table_create_time,\n"
            + "  ddl\n"
            + "FROM all_ext_tables_and_views",
        targetViewName, CustomUtils.indent(unionMetastoreSelects(bqDatasetNames), 2), timeZone);
  }

  private static String unionMetastoreSelects(ArrayList<String> bqDatasetNames) {
    return bqDatasetNames.stream()
        .map(
            bqDatasetName ->
                String.format("SELECT *\n" + "FROM `%s.INFORMATION_SCHEMA.TABLES`", bqDatasetName))
        .collect(Collectors.joining("\nUNION ALL\n"));
  }
}
