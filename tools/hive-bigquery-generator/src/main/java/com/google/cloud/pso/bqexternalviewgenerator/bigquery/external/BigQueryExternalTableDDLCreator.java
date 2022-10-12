/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery.external;


import com.google.cloud.pso.bqexternalviewgenerator.common.CustomUtils;
import com.google.cloud.pso.bqexternalviewgenerator.common.FieldTraverseAndTransform;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveBigQuerySchemaMapping;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveBigQuerySchemaMapping.BigQueryTableType;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveSchemaParser;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTable;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTable.SERDE;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTableHandler;
import java.util.ArrayList;
import java.util.stream.Collectors;
import org.apache.hadoop.hive.metastore.api.FieldSchema;

public class BigQueryExternalTableDDLCreator {

  public static String makeDDL(HiveTableHandler hiveTableHandler, ViewGeneratorProperties configs) {
    StringBuilder createStatementBuilder = new StringBuilder();
    String bigQueryExternalTableId = hiveTableHandler.getBQExternalTableId();
    HiveTable hiveTable = hiveTableHandler.getHiveTable();

    createStatementBuilder.append(
        String.format("CREATE OR REPLACE EXTERNAL TABLE `%s`%n", bigQueryExternalTableId));

    ArrayList<String> options = new ArrayList<String>();
    String partitionOptions;
    // Hive metastore splits table columns and partitions columns, hence, concating both for BQ
    createStatementBuilder.append(
        String.format("(%n%s%n)%n", schemaString(hiveTableHandler.getHiveSchemaString())));

    if (hiveTable.getSerde().equals(SERDE.CSV)) {

      // Assuming that first row in a CSV / Text is always header
      options.add("skip_leading_rows=1");

      // Keeping default csv delimiter i.e. ,
      if (hiveTable.getProperties().getFieldDelim() != null) {
        options.add(
            String.format("field_delimiter='%s'", hiveTable.getProperties().getFieldDelim()));
      }
    }

    String uri_extention = "*";

    // Handling partitioned tables
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/data-definition-language#create_external_table_statement
    if (hiveTable.getPartitions().size() != 0) {
      partitionOptions = getExtPartitionOptions(hiveTable.getPartitions());

      if (partitionOptions == null) createStatementBuilder.append("WITH PARTITION COLUMNS\n");
      else
        createStatementBuilder.append(
            String.format(
                "WITH PARTITION COLUMNS (%n%s%n)%n", CustomUtils.indent(partitionOptions, 2)));

      options.add(String.format("hive_partition_uri_prefix='%s'", hiveTable.getGcsLocation()));
      // This is to ignore the .hive-staging folders in the gcs location path
      uri_extention = hiveTable.getPartitions().get(0).getName() + "*";

      if (configs.bigquery.requirePartitionFilter)
        options.add(
            String.format("require_hive_partition_filter=true", hiveTable.getGcsLocation()));
    }

    options.add(String.format("uris=['%s/%s']", hiveTable.getGcsLocation(), uri_extention));
    options.add(String.format("format='%s'", hiveTable.getSerde().toString()));

    // https://cloud.google.com/bigquery/docs/loading-data-cloud-storage-avro#logical_types
    if (hiveTable.getSerde() == SERDE.AVRO) options.add("enable_logical_types=true");

    return createStatementBuilder
        .append(
            String.format("OPTIONS (%n%s%n);", CustomUtils.indent(String.join(",\n", options), 2)))
        .toString();
  }

  private static String getExtPartitionOptions(ArrayList<FieldSchema> partCols) {
    return partCols.stream()
        .map(
            partCol ->
                String.format(
                    "`%s` %s",
                    partCol.getName().replaceAll("\\`", ""),
                    HiveBigQuerySchemaMapping.getExtPartitionBQType(
                        partCol.getType(), BigQueryTableType.EXTERNAL_TABLE)))
        .collect(Collectors.joining(",\n  "));
  }

  private static String schemaString(String schemaString) {
    return CustomUtils.indent(
        new FieldTraverseAndTransform(
                HiveSchemaParser.parseSchema(schemaString), new HiveToBQExternalTransform())
            .processSchema(),
        2);
  }
}
