/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.hive;


import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.UUID;
import org.apache.hadoop.hive.metastore.api.FieldSchema;

// Ensure all updates are also made to BigQueryAuditTableSchemas.class
public class HiveTableSerializer extends StdSerializer<HiveTable> {

  public HiveTableSerializer() {
    this(null);
  }

  public HiveTableSerializer(Class<HiveTable> t) {
    super(t);
  }

  @Override
  public void serialize(HiveTable value, JsonGenerator jgen, SerializerProvider provider)
      throws IOException, JsonProcessingException {

    jgen.writeStartObject();
    jgen.writeStringField("id", UUID.randomUUID().toString());
    jgen.writeStringField("dbname", value.getDbName());
    jgen.writeStringField("tablename", value.getTableName());

    if (value.getCols() == null) {
      jgen.writeNullField("cols");
    } else {
      jgen.writeArrayFieldStart("cols");
      for (FieldSchema fieldschema : value.getCols()) {
        jgen.writeStartObject();
        jgen.writeStringField("name", fieldschema.getName());
        jgen.writeStringField("datatype", fieldschema.getType());
        jgen.writeEndObject();
      }
      jgen.writeEndArray();
    }

    if (value.getPartitions() == null) {
      jgen.writeNullField("partitions");
    } else {
      jgen.writeArrayFieldStart("partitions");
      for (FieldSchema fieldschema : value.getPartitions()) {
        jgen.writeStartObject();
        jgen.writeStringField("name", fieldschema.getName());
        jgen.writeStringField("datatype", fieldschema.getType());
        jgen.writeEndObject();
      }
      jgen.writeEndArray();
    }

    jgen.writeStringField("gcs_location", value.getGcsLocation());
    jgen.writeStringField("serde", (value.getSerde() == null) ? null : value.getSerde().toString());
    jgen.writeStringField(
        "table_createtime",
        new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
            .format(new java.util.Date(Long.valueOf(value.getCreateTime()) * 1000L)));
    jgen.writeStringField(
        "table_transient_last_ddl_time",
        new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
            .format(new java.util.Date(Long.valueOf(value.getTransientLastDdlTime()) * 1000L)));
    jgen.writeStringField("table_type", value.getTableType());

    jgen.writeStringField("view_expanded_text", value.getViewExpandedText());

    jgen.writeObjectFieldStart("properties");
    jgen.writeStringField("serialization_lib", value.getProperties().getSerializationLib());
    jgen.writeStringField("input_format", value.getProperties().getInputFormat());
    jgen.writeStringField("field_delim", value.getProperties().getFieldDelim());
    jgen.writeEndObject();
    jgen.writeStringField(
        "created_at", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()));

    jgen.writeEndObject();
  }
}
