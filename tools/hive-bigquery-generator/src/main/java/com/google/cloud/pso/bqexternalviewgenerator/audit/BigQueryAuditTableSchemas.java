/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.audit;


import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.Field.Mode;
import com.google.cloud.bigquery.Schema;
import com.google.cloud.bigquery.StandardSQLTypeName;

// Note: Make sure all the fields match the HiveTableSerializer.class
// An explicit schema ensure column ordering in the BQ table
// Also, doesn't depend on BigQuery Json fields infer schema
public class BigQueryAuditTableSchemas {

  public static Schema getHiveStatsSchema() {
    return Schema.of(
        Field.of("id", StandardSQLTypeName.STRING),
        Field.of("dbname", StandardSQLTypeName.STRING),
        Field.of("tablename", StandardSQLTypeName.STRING),
        Field.newBuilder(
                "cols",
                StandardSQLTypeName.STRUCT,
                Field.of("name", StandardSQLTypeName.STRING),
                Field.of("datatype", StandardSQLTypeName.STRING))
            .setMode(Mode.REPEATED)
            .build(),
        Field.newBuilder(
                "partitions",
                StandardSQLTypeName.STRUCT,
                Field.of("name", StandardSQLTypeName.STRING),
                Field.of("datatype", StandardSQLTypeName.STRING))
            .setMode(Mode.REPEATED)
            .build(),
        Field.of("gcs_location", StandardSQLTypeName.STRING),
        Field.of("serde", StandardSQLTypeName.STRING),
        Field.of("table_createtime", StandardSQLTypeName.DATETIME),
        Field.of("table_transient_last_ddl_time", StandardSQLTypeName.DATETIME),
        Field.of("table_type", StandardSQLTypeName.STRING),
        Field.of("view_expanded_text", StandardSQLTypeName.STRING),
        Field.newBuilder(
                "properties",
                StandardSQLTypeName.STRUCT,
                Field.of("serializationLib", StandardSQLTypeName.STRING),
                Field.of("inputFormat", StandardSQLTypeName.STRING),
                Field.of("fieldDelim", StandardSQLTypeName.STRING))
            .build(),
        Field.of("created_at", StandardSQLTypeName.TIMESTAMP));
  }

  public static Schema getBQResourceSchema() {
    return Schema.of(
        Field.of("runId", StandardSQLTypeName.STRING),
        Field.of("rowId", StandardSQLTypeName.STRING),
        Field.of("hiveTableId", StandardSQLTypeName.STRING),
        Field.of("bigQueryExternalTableId", StandardSQLTypeName.STRING),
        Field.of("bigQueryViewId", StandardSQLTypeName.STRING),
        Field.of("bigQueryExternalTableDDL", StandardSQLTypeName.STRING),
        Field.of("bigQueryViewDDL", StandardSQLTypeName.STRING),
        Field.of("bigQuerySelectViewDDL", StandardSQLTypeName.STRING),
        Field.of("state", StandardSQLTypeName.STRING),
        Field.of("created_at", StandardSQLTypeName.DATETIME));
  }
}
