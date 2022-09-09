/*
 * Copyright (C) 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.google.cloud.pso.util;

import com.google.api.gax.paging.Page;
import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQuery.TableListOption;
import com.google.cloud.bigquery.BigQueryException;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.DatasetId;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.FieldList;
import com.google.cloud.bigquery.StandardSQLTypeName;
import com.google.cloud.bigquery.Table;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The {@link BigQuerySerializeable} builds the connection to BigQuery schema as well as validating
 * incoming JSON file with the schema in BigQuery.
 */
public class BQDatasetSchemas implements Serializable {
  private static final long serialVersionUID = 1L;
  private static final Logger LOG = LoggerFactory.getLogger(BQDatasetSchemas.class);
  private static final String UNKNOWN_FIELD_NAME = "unknown";

  private static BQDatasetSchemas bqaDatasetSchemaSingleton;
  private static Map<String, BQTableSchemaInfo> eventTableSchema;

  private static DateTime schemaLastUpdatedDate;
  private static String schemaDataset = "place_holder";

  public static BQDatasetSchemas getInstance() {
    if (bqaDatasetSchemaSingleton == null) {
      bqaDatasetSchemaSingleton = new BQDatasetSchemas();
    }
    return bqaDatasetSchemaSingleton;
  }

  public static void setDataset(String schemaDataset) {
    BQDatasetSchemas.schemaDataset = schemaDataset;
  }

  private BQDatasetSchemas() {
    DateTimeZone.setDefault(DateTimeZone.UTC);
    schemaLastUpdatedDate = DateTime.now(); // Uses UTC timezeone as Activision standard

    initializeTableSchema();
  }

  /**
   * Act to initialize the Table schema map as well as to check the validility of the schema.
   * Validity is based on time, after a certain time, most of the time the Map will be used from a
   * memory cache. After a certain amount of time, the cache will be refresh (default to one day).
   */
  private static void init() {
    if (eventTableSchema != null
        && schemaLastUpdatedDate.toDate().before(DateTime.now().toDate())) {
      return;
    }
    initializeTableSchema();
  }

  public boolean isTableSchemaExist(String tableName) {
    init();

    return eventTableSchema.containsKey(tableName);
  }

  public FieldList getFieldList(String tableName) {
    init();

    return eventTableSchema
        .getOrDefault(tableName, eventTableSchema.get(UNKNOWN_FIELD_NAME))
        .getBqFieldList();
  }

  public TableSchema getTableSchema(String tableName) {
    init();

    return eventTableSchema
        .getOrDefault(tableName, eventTableSchema.get(UNKNOWN_FIELD_NAME))
        .getTableSchema();
  }

  public TableSchema getInvalidSchema() {
    init();
    if (eventTableSchema.get(UNKNOWN_FIELD_NAME) == null) {
      return new TableSchema();
    }

    return eventTableSchema.get(UNKNOWN_FIELD_NAME).getTableSchema();
  }

  private static TableSchema convertFieldListToTableSchema(FieldList fieldList) {
    List<TableFieldSchema> tableFieldsSchemas = new ArrayList<>();

    return new TableSchema().setFields(buildSubTableFieldSchema(fieldList, tableFieldsSchemas));
  }

  private static List<TableFieldSchema> buildSubTableFieldSchema(
      FieldList fieldList, List<TableFieldSchema> res) {
    for (Field f : fieldList) {
      TableFieldSchema tableFieldSchema =
          new TableFieldSchema().setName(f.getName()).setType(f.getType().name());
      if (f.getMode() != null) {
        tableFieldSchema.setMode(f.getMode().name());
      }

      if (f.getSubFields() != null && !f.getSubFields().isEmpty()) {
        tableFieldSchema.setFields(
            buildSubTableFieldSchema(f.getSubFields(), new ArrayList<TableFieldSchema>()));
      }
      res.add(tableFieldSchema);
    }
    return res;
  }

  private static synchronized void initializeTableSchema() {
    eventTableSchema = new HashMap<String, BQTableSchemaInfo>();
    try {
      BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();
      DatasetId datasetId = DatasetId.of(schemaDataset);
      Page<Table> tables = bigquery.listTables(datasetId, TableListOption.pageSize(100));

      for (Table tempTable : tables.getValues()) {
        Table table = bigquery.getTable(tempTable.getTableId());
        table.reload();
        FieldList fieldList = table.getDefinition().getSchema().getFields();
        TableSchema tableSchema = convertFieldListToTableSchema(fieldList);

        eventTableSchema.put(
            table.getTableId().getTable(), new BQTableSchemaInfo(fieldList, tableSchema));
      }

      FieldList unknownFields =
          FieldList.of(
              Field.of(Constants.EVENT_NAME, StandardSQLTypeName.STRING),
              Field.of(Constants.EVENT_BODY, StandardSQLTypeName.STRING),
              Field.of(Constants.REASON, StandardSQLTypeName.STRING),
              Field.of(Constants.LAST_UPDATED_TIMESTAMP, StandardSQLTypeName.TIMESTAMP));
      eventTableSchema.put(
          UNKNOWN_FIELD_NAME,
          new BQTableSchemaInfo(unknownFields, convertFieldListToTableSchema(unknownFields)));
    } catch (BigQueryException e) {
      LOG.error("Dataset info not retrieved. Unable to build map schema.\n" + e.toString());
    }
  }

  private static class BQTableSchemaInfo {
    FieldList bqFieldList;
    TableSchema bqTableSchema;

    BQTableSchemaInfo(FieldList bqFieldList, TableSchema bqTableSchema) {
      this.bqFieldList = bqFieldList;
      this.bqTableSchema = bqTableSchema;
    }

    FieldList getBqFieldList() {
      return this.bqFieldList;
    }

    TableSchema getTableSchema() {
      return this.bqTableSchema;
    }
  }
}
