/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery.select;


import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTableHandler;
import java.util.ArrayList;
import org.apache.hadoop.hive.metastore.api.FieldSchema;

public class BigQuerySelectViewQueryCreator {
  public static String makeDDL(HiveTableHandler hiveTableHandler, ViewGeneratorProperties configs) {
    // External table limit1 do not scan full table
    // This is just to check if tables can be read properly

    StringBuilder selectViewQuery = new StringBuilder();
    selectViewQuery.append(String.format("SELECT * \nFROM `%s` ", hiveTableHandler.getBQViewId()));

    if (configs.bigquery.requirePartitionFilter) {
      ArrayList<FieldSchema> partCols = hiveTableHandler.getHiveTable().getPartitions();
      if (partCols != null && partCols.size() > 0) {
        selectViewQuery.append(
            String.format("\nWHERE `%s` IS NOT NULL", partCols.get(0).getName()));
      }
    }

    selectViewQuery.append("\nLIMIT 1;");

    return selectViewQuery.toString();
  }
}
