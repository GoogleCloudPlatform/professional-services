/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery;


import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import java.util.Objects;

public class BigQueryUtil {

  public static String fullTableId(String project, String dataset, String tablename) {
    if (Objects.isNull(project) || project.equals(""))
      return String.format("%s.%s", dataset, tablename);

    return String.format("%s.%s.%s", project, dataset, tablename);
  }

  public static String fullDatasetId(String project, String dataset) {
    if (Objects.isNull(project) || project.equals("")) return dataset;

    return String.format("%s.%s", project, dataset);
  }

  public static String getBQMetastoreStatsViewId(ViewGeneratorProperties configs) {
    return fullTableId(
        configs.bigquery.project,
        configs.bigquery.audit.dataset,
        configs.bigquery.audit.bigqueryMetastoreStatsTable);
  }

  public static String getHiveMetastoreStatsTableId(ViewGeneratorProperties configs) {
    return fullTableId(
        configs.bigquery.project,
        configs.bigquery.audit.dataset,
        configs.bigquery.audit.hiveMetastoreStatsTable);
  }

  public static String getToolExecutionStatsTableId(ViewGeneratorProperties configs) {
    return fullTableId(
        configs.bigquery.project,
        configs.bigquery.audit.dataset,
        configs.bigquery.audit.toolExecutionStatsTable);
  }
}
