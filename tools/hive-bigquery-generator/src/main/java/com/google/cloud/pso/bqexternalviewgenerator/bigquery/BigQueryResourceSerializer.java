/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery;


import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import java.io.IOException;
import java.util.UUID;

public class BigQueryResourceSerializer extends StdSerializer<BigQueryResource> {

  public BigQueryResourceSerializer() {
    this(null);
  }

  public BigQueryResourceSerializer(Class<BigQueryResource> t) {
    super(t);
  }

  @Override
  public void serialize(BigQueryResource value, JsonGenerator jgen, SerializerProvider provider)
      throws IOException, JsonProcessingException {

    jgen.writeStartObject();
    jgen.writeStringField("runId", value.getRunId());
    jgen.writeStringField("rowId", UUID.randomUUID().toString());
    jgen.writeStringField("hiveTableId", value.getHiveTableId());
    jgen.writeStringField("bigQueryExternalTableId", value.getBigQueryExternalTableId());
    jgen.writeStringField("bigQueryViewId", value.getBigQueryViewId());
    jgen.writeStringField("bigQueryExternalTableDDL", value.getBigQueryExternalTableDDL());
    jgen.writeStringField("bigQueryViewDDL", value.getBigQueryViewDDL());
    jgen.writeStringField("bigQuerySelectViewDDL", value.getBigQuerySelectViewDDL());
    jgen.writeStringField("state", value.getState());
    jgen.writeStringField("created_at", value.getCreatedAt());
    jgen.writeEndObject();
  }
}
