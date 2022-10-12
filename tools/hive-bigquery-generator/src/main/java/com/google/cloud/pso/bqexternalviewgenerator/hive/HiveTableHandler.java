/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.hive;

import static com.google.common.base.Preconditions.checkArgument;

import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties.BigQueryProperties;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTable.Properties;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTable.SERDE;
import com.google.common.primitives.Ints;
import java.util.ArrayList;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.extern.log4j.Log4j2;
import org.apache.hadoop.hive.metastore.api.FieldSchema;
import org.apache.hadoop.hive.metastore.api.Table;

@Log4j2
public class HiveTableHandler {

  // Example : org.apache.hadoop.hive.ql.io.orc.OrcSerde --> OrcSerde
  public static final Pattern SERIALIZATION_CLASS_EXTRACTOR = Pattern.compile("\\.+(\\w+)$");

  BigQueryProperties bigQueryProperties;

  public final HiveTable hiveTable;

  public HiveTableHandler(Table hiveTable, BigQueryProperties bigQueryProperties)
      throws IllegalArgumentException {
    checkArgument(!Objects.isNull(hiveTable), "ERROR: Provided hiveTable is null");
    this.hiveTable = buildHiveTable(hiveTable);
    this.bigQueryProperties = bigQueryProperties;
  }

  public HiveTableHandler(HiveTable hiveTable) {
    this.hiveTable = hiveTable;
  }

  public HiveTable getHiveTable() {
    return this.hiveTable;
  }

  public String getBQExternalTableId() {
    return String.format(
        "%s.%s.%s",
        bigQueryProperties.project,
        bigQueryProperties.externalTableDatasetPrefix + hiveTable.getDbName(),
        hiveTable.getTableName());
  }

  public String getBQViewId() {
    return String.format(
        "%s.%s.%s",
        bigQueryProperties.project,
        bigQueryProperties.viewDatasetPrefix + hiveTable.getDbName(),
        hiveTable.getTableName());
  }

  public String getHiveTableId() {
    return String.format("%s.%s", hiveTable.getDbName(), hiveTable.getTableName());
  }

  private HiveTable buildHiveTable(Table table) {
    return HiveTable.builder()
        .setTableName(table.getTableName())
        .setDbName(table.getDbName())
        .setSerde(getSerde(table))
        .setGcsLocation(getGcsLocation(table))
        .setTableType(getTableType(table))
        .setCols(getCols(table))
        .setPartitions(getPartitions(table))
        .setCreateTime(getCreateTime(table))
        .setTransientLastDDLTime(getTransientLastDDLTime(table))
        .setViewExpandedText(getViewExpandedText(table))
        .setProperties(
            new Properties(getSerializationLib(table), getInputFormat(table), getFieldDelim(table)))
        .build();
  }

  private ArrayList<FieldSchema> getPartitions(Table table) {
    return (ArrayList<FieldSchema>) table.getPartitionKeys();
  }

  private ArrayList<FieldSchema> getCols(Table table) {
    return (ArrayList<FieldSchema>) table.getSd().getCols();
  }

  private int getCreateTime(Table table) {
    return table.getCreateTime();
  }

  private int getTransientLastDDLTime(Table table) {
    return Ints.tryParse(table.getParameters().get("transient_lastDdlTime"));
  }

  private String getTableType(Table table) {
    return table.getTableType();
  }

  private String getGcsLocation(Table table) {
    return table.getSd().getLocation();
  }

  private SERDE getSerde(Table table) {
    String serializationLib = table.getSd().getSerdeInfo().getSerializationLib();

    if (serializationLib != null) return getSerdeBySerializationLib(serializationLib);

    return getSerdeByInputFormat(table.getSd().getInputFormat());
  }

  private SERDE getSerdeBySerializationLib(String serializationLib) {
    Matcher matcher = SERIALIZATION_CLASS_EXTRACTOR.matcher(serializationLib);
    SERDE serde = null;

    if (!matcher.find()) {
      throw new RuntimeException("ERROR: Unexpected Target Dataset Format");
    }

    String serializationClass = matcher.group(1);

    switch (serializationClass.toUpperCase()) {
      case "ORCSERDE":
        serde = SERDE.ORC;
        break;
      case "JSONSERDE":
        serde = SERDE.JSON;
        break;
      case "LAZYSIMPLESERDE":
      case "OPENCSVSERDE":
      case "MULTIDELIMITSERDE":
        serde = SERDE.CSV;
        break;
      case "AVROSERDE":
        serde = SERDE.AVRO;
        break;
      case "PARQUETHIVESERDE":
        serde = SERDE.PARQUET;
        break;
    }
    return serde;
  }

  private SERDE getSerdeByInputFormat(String inputFormat) {
    Matcher matcher = SERIALIZATION_CLASS_EXTRACTOR.matcher(inputFormat);
    SERDE serde = null;

    if (!matcher.find()) {
      throw new RuntimeException("ERROR: Unexpected Target Dataset Format");
    }

    String inputFormatType = matcher.group(1);

    switch (inputFormatType.toUpperCase()) {
      case "TEXTINPUTFORMAT":
        serde = SERDE.CSV;
        break;
      case "ORCINPUTFORMAT":
        serde = SERDE.ORC;
        break;
      case "AVROCONTAINERINPUTFORMAT":
        serde = SERDE.AVRO;
        break;
      case "PARQUETINPUTFORMAT":
        serde = SERDE.PARQUET;
        break;
    }
    return serde;
  }

  private String getViewExpandedText(Table table) {
    return table.getViewExpandedText();
  }

  private String getSerializationLib(Table table) {
    return table.getSd().getSerdeInfo().getSerializationLib();
  }

  private String getInputFormat(Table table) {
    return table.getSd().getInputFormat();
  }

  private String getFieldDelim(Table table) {
    return table.getSd().getSerdeInfo().getParameters().get("field.delim");
  }

  // Without Partition Columns
  // Eg: SchemaString: a:int,\n b:boolean,\nc:struct<col1:timestamp,col2:int>,\nd:array<int>
  public String getHiveSchemaString() {
    return hiveTable.getCols().stream()
        .map(col -> String.format("%s:%s", col.getName(), col.getType()))
        .collect(Collectors.joining(",\n"));
  }
}
