/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery.view;


import com.google.cloud.pso.bqexternalviewgenerator.common.CustomUtils;
import com.google.cloud.pso.bqexternalviewgenerator.common.FieldTraverseAndTransform;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveBigQuerySchemaMapping;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveBigQuerySchemaMapping.BigQueryTableType;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveSchemaParser;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTableHandler;
import java.util.ArrayList;
import java.util.stream.Collectors;
import org.apache.hadoop.hive.metastore.api.FieldSchema;

public class BigQueryViewDDLCreator {

  public static String makeDDL(HiveTableHandler hiveTableHandler) {
    ArrayList<FieldSchema> partCols = hiveTableHandler.getHiveTable().getPartitions();
    return String.format(
        "CREATE OR REPLACE VIEW `%s` AS\n" + "SELECT\n" + "%s\n" + "FROM `%s`;",
        hiveTableHandler.getBQViewId(),
        schemaString(hiveTableHandler.getHiveSchemaString()) + partitionSchemaString(partCols),
        hiveTableHandler.getBQExternalTableId());
  }

  private static String partitionSchemaString(ArrayList<FieldSchema> partCols) {
    String bqPartColSchema = "";
    if (partCols.size() != 0) {
      bqPartColSchema =
          partCols.stream()
              .map(
                  hiveCol -> {
                    String viewDataType =
                        HiveBigQuerySchemaMapping.getBQType(
                            hiveCol.getType(), BigQueryTableType.VIEW);
                    String extDataType =
                        HiveBigQuerySchemaMapping.getExtPartitionBQType(
                            hiveCol.getType(), BigQueryTableType.EXTERNAL_TABLE);

                    if (viewDataType.equalsIgnoreCase(extDataType))
                      return String.format("`%s`", hiveCol.getName());

                    if (viewDataType.equalsIgnoreCase("DATETIME")
                        && extDataType.equalsIgnoreCase("STRING"))
                      // %% is to escape % character in String.format
                      return String.format(
                          "CAST(REPLACE(`%s`,'%%3A',':') AS DATETIME) AS `%s`",
                          hiveCol.getName(), hiveCol.getName());

                    return String.format(
                        "CAST(`%s` AS %s) AS `%s`",
                        hiveCol.getName(), viewDataType, hiveCol.getName());
                  })
              .collect(Collectors.joining(",\n"));

      bqPartColSchema = ",\n" + CustomUtils.indent(bqPartColSchema, 2);
    }
    return bqPartColSchema;
  }

  private static String schemaString(String schemaString) {
    return CustomUtils.indent(
        new FieldTraverseAndTransform(
                HiveSchemaParser.parseSchema(schemaString),
                new ExternalToViewTypeCastingTransform())
            .processSchema(),
        2);
  }
}
