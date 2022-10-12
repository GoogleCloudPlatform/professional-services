/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.hive;


import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import java.util.ArrayList;
import org.apache.hadoop.hive.metastore.api.FieldSchema;

@JsonAutoDetect(fieldVisibility = Visibility.ANY)
@JsonSerialize(using = HiveTableSerializer.class)
public class HiveTable {
  private String tableName;
  private String dbName;
  private ArrayList<FieldSchema> cols;
  private String gcsLocation;
  private SERDE serde;
  private int createTime;
  private int transientLastDdlTime;
  private ArrayList<FieldSchema> partitions;
  private String tableType;
  private String viewExpandedText;
  private Properties properties;

  public enum SERDE {
    ORC,
    AVRO,
    CSV,
    JSON,
    PARQUET
  }

  public static class Properties {
    private String serializationLib;
    private String inputFormat;
    private String fieldDelim;

    public Properties(String serializationLib, String inputFormat, String fieldDelim) {
      this.serializationLib = serializationLib;
      this.inputFormat = inputFormat;
      this.fieldDelim = fieldDelim;
    }

    public String getSerializationLib() {
      return serializationLib;
    }

    public String getInputFormat() {
      return inputFormat;
    }

    public String getFieldDelim() {
      return fieldDelim;
    }

    @Override
    public String toString() {
      return String.format(
          "Properties(serializationLib=%s, inputFormat=%s, fieldDelim=%s)",
          this.serializationLib == null ? "null" : this.serializationLib,
          this.inputFormat == null ? "null" : this.inputFormat,
          this.fieldDelim == null ? "null" : this.fieldDelim);
    }
  }

  HiveTable(
      String tableName,
      String dbName,
      ArrayList<FieldSchema> cols,
      String gcsLocation,
      SERDE serde,
      int createTime,
      int transientLastDdlTime,
      ArrayList<FieldSchema> partitions,
      String tableType,
      String viewExpandedText,
      Properties properties) {
    this.tableName = tableName;
    this.dbName = dbName;
    this.cols = cols;
    this.gcsLocation = gcsLocation;
    this.serde = serde;
    this.createTime = createTime;
    this.transientLastDdlTime = transientLastDdlTime;
    this.partitions = partitions;
    this.tableType = tableType;
    this.viewExpandedText = viewExpandedText;
    this.properties = properties;
  }

  public String getTableName() {
    return tableName;
  }

  public String getFullyQualifiedTableName() {
    return dbName + "." + tableName;
  }

  public String getDbName() {
    return dbName;
  }

  public ArrayList<FieldSchema> getCols() {
    return cols;
  }

  public String getGcsLocation() {
    return gcsLocation;
  }

  public SERDE getSerde() {
    return serde;
  }

  public int getCreateTime() {
    return createTime;
  }

  public int getTransientLastDdlTime() {
    return transientLastDdlTime;
  }

  public ArrayList<FieldSchema> getPartitions() {
    return partitions;
  }

  public String getTableType() {
    return tableType;
  }

  public String getViewExpandedText() {
    return viewExpandedText;
  }

  public Properties getProperties() {
    return properties;
  }

  public String getHiveTableId() {
    return String.format("%s.%s", dbName, tableName);
  };

  public static HiveTableBuilder builder() {
    return new HiveTableBuilder();
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder("HiveTable(");
    sb.append("tableName:");
    if (this.tableName == null) {
      sb.append("null");
    } else {
      sb.append(this.tableName);
    }
    sb.append(", ");
    sb.append("dbName:");
    if (this.dbName == null) {
      sb.append("null");
    } else {
      sb.append(this.dbName);
    }
    sb.append(", ");
    sb.append("cols:");
    if (this.cols == null) {
      sb.append("null");
    } else {
      sb.append(this.cols.toString());
    }
    sb.append(", ");
    sb.append("gcsLocation:");
    if (this.gcsLocation == null) {
      sb.append("null");
    } else {
      sb.append(this.gcsLocation);
    }
    sb.append(", ");
    sb.append("serde:");
    if (this.serde == null) {
      sb.append("null");
    } else {
      sb.append(this.serde.toString());
    }
    sb.append(", ");
    sb.append("createTime:");
    sb.append(this.createTime);
    sb.append(", ");
    sb.append("transientLastDdlTime:");
    sb.append(this.transientLastDdlTime);
    sb.append(", ");
    sb.append("partitions:");
    if (this.partitions == null) {
      sb.append("null");
    } else {
      sb.append(this.partitions.toString());
    }
    sb.append(", ");
    sb.append("tableType:");
    sb.append(this.tableType);
    sb.append(", ");
    sb.append("viewExpandedText:");
    sb.append(this.viewExpandedText);
    sb.append(", ");
    sb.append("properties:");
    sb.append(this.properties.toString());
    sb.append(")");

    return sb.toString();
  }

  public static class HiveTableBuilder {
    private String tableName;
    private String dbName;
    private ArrayList<FieldSchema> cols; // Required
    private String gcsLocation; // Required
    private SERDE serde; // Required
    private int createTime; // Optional
    private int transientLastDdlTime; // Optional
    private ArrayList<FieldSchema> partitions; // Optional
    private String tableType; // Optional
    private String viewExpandedText;
    private Properties properties;

    public HiveTableBuilder setTableName(String tableName) {
      this.tableName = tableName;
      return this;
    }

    public HiveTableBuilder setTableType(String tableType) {
      this.tableType = tableType;
      return this;
    }

    public HiveTableBuilder setDbName(String dbName) {
      this.dbName = dbName;
      return this;
    }

    public HiveTableBuilder setCols(ArrayList<FieldSchema> cols) {
      this.cols = cols;
      return this;
    }

    public HiveTableBuilder setGcsLocation(String gcsLocation) {
      this.gcsLocation = gcsLocation;
      return this;
    }

    public HiveTableBuilder setSerde(SERDE serde) {
      this.serde = serde;
      return this;
    }

    public HiveTableBuilder setCreateTime(int createTime) {
      this.createTime = createTime;
      return this;
    }

    public HiveTableBuilder setTransientLastDDLTime(int transientLastDdlTime) {
      this.transientLastDdlTime = transientLastDdlTime;
      return this;
    }

    public HiveTableBuilder setPartitions(ArrayList<FieldSchema> partitions) {
      this.partitions = partitions;
      return this;
    }

    public HiveTableBuilder setViewExpandedText(String viewExpandedText) {
      this.viewExpandedText = viewExpandedText;
      return this;
    }

    public HiveTableBuilder setProperties(Properties properties) {
      this.properties = properties;
      return this;
    }

    public HiveTable build() {
      return new HiveTable(
          tableName,
          dbName,
          cols,
          gcsLocation,
          serde,
          createTime,
          transientLastDdlTime,
          partitions,
          tableType,
          viewExpandedText,
          properties);
    }
  }
}
