/*
 *  Copyright 2024 Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.google.cloud.pso.migration.utils;

import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import org.apache.beam.sdk.schemas.Schema;
import org.apache.beam.sdk.values.Row;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility class for working with Beam Rows and Bigtable data structures.
 *
 * <p>This class provides static methods for defining Beam Row schemas representing Bigtable data
 * and converting between Beam Rows and Bigtable structures.
 */
public class BeamRowUtils {
  private static final Logger LOG = LoggerFactory.getLogger(BeamRowUtils.class);
  private static final Schema bigtableCellBytesPayloadSchema = getBigtableCellSchema();
  public static final Schema bigtableRowWithBytesPayloadSchema =
      getBigtableRowSchema(bigtableCellBytesPayloadSchema);

  private static final Schema bigtableCellTextPayloadSchema = getBigtableCellSchema();
  public static final Schema bigtableRowWithTextPayloadSchema =
      getBigtableRowSchema(bigtableCellTextPayloadSchema);

  private static final Gson gson = new Gson();
  private static final Type mapType = new TypeToken<Map<String, String>>() {}.getType();

  static {
    // Log schema initialization
    LOG.info("Initialized Bigtable schemas:");
    LOG.info("Bigtable Row with Bytes Payload Schema: {}", bigtableRowWithBytesPayloadSchema);
    LOG.info("Bigtable Row with Text Payload Schema: {}", bigtableRowWithTextPayloadSchema);
  }

  private static Schema getBigtableCellSchema() {
    Schema schema =
        Schema.builder()
            .addNullableField(DataLoadConstants.SchemaFields.COLUMN_FAMILY, Schema.FieldType.STRING)
            .addNullableField(DataLoadConstants.SchemaFields.COLUMN, Schema.FieldType.STRING)
            .addNullableField(DataLoadConstants.SchemaFields.PAYLOAD, Schema.FieldType.STRING)
            .build();
    LOG.info("Created Bigtable cell schema with payload: {}", schema);
    return schema;
  }

  private static Schema getBigtableRowSchema(Schema bigtableCellSchema) {
    Schema schema =
        Schema.builder()
            .addField(DataLoadConstants.SchemaFields.ROW_KEY, Schema.FieldType.STRING)
            .addArrayField(
                DataLoadConstants.SchemaFields.CELLS, Schema.FieldType.row(bigtableCellSchema))
            .build();
    LOG.info("Created Bigtable row schema: {}", schema);
    return schema;
  }

  public static Row jsonToBeamRow(
      String dynamoJsonRow, String bigtableRowKey, String bigtableColFamily) {
    DynamoRowUtils converter = new DynamoRowUtils();

    String bigtableJsonRow =
        converter.convertDynamoDBJson(dynamoJsonRow, bigtableRowKey, bigtableColFamily);

    LOG.info("Converting JSON to Beam Row: {}", bigtableJsonRow);

    JsonObject jsonObject = gson.fromJson(bigtableJsonRow, JsonObject.class);
    List<Row> bigtableCells = new ArrayList<>();

    String rowKey = jsonObject.get(DataLoadConstants.SchemaFields.ROW_KEY).getAsString();

    for (JsonElement jsonElement :
        jsonObject.getAsJsonArray(DataLoadConstants.SchemaFields.CELLS).asList()) {
      JsonObject bigtableCell = jsonElement.getAsJsonObject();

      Row.Builder rowBuilder = Row.withSchema(bigtableCellBytesPayloadSchema);

      // Handle payload field with null safety
      JsonElement payloadElement = bigtableCell.get(DataLoadConstants.SchemaFields.PAYLOAD);
      String payload = extractPayload(payloadElement);
      Row.FieldValueBuilder fieldValueBuilder =
          rowBuilder.withFieldValue(
              DataLoadConstants.SchemaFields.PAYLOAD,
              payload // This will handle null automatically since the field is nullable
              );
      fieldValueBuilder =
          addFieldIfNotNull(
              fieldValueBuilder, DataLoadConstants.SchemaFields.COLUMN_FAMILY, bigtableCell);
      fieldValueBuilder =
          addFieldIfNotNull(fieldValueBuilder, DataLoadConstants.SchemaFields.COLUMN, bigtableCell);

      bigtableCells.add(fieldValueBuilder.build());
    }

    Row result =
        Row.withSchema(bigtableRowWithTextPayloadSchema)
            .withFieldValue(DataLoadConstants.SchemaFields.ROW_KEY, rowKey)
            .withFieldValue(DataLoadConstants.SchemaFields.CELLS, bigtableCells)
            .build();

    return result;
  }

  private static Row.FieldValueBuilder addFieldIfNotNull(
      Row.FieldValueBuilder fieldValueBuilder, String fieldName, JsonObject cell) {
    return addFieldIfNotNull(fieldValueBuilder, fieldName, cell, JsonElement::getAsString);
  }

  private static <T> Row.FieldValueBuilder addFieldIfNotNull(
      Row.FieldValueBuilder fieldValueBuilder,
      String fieldName,
      JsonObject cell,
      Function<JsonElement, T> typeConverter) {

    JsonElement value = cell.get(fieldName);
    if (value == null || value.isJsonNull()) {

      return fieldValueBuilder;
    }

    return fieldValueBuilder.withFieldValue(fieldName, typeConverter.apply(value));
  }

  private static String extractPayload(JsonElement payloadElement) {
    if (payloadElement == null || payloadElement.isJsonNull()) {
      LOG.debug("Payload element is null or JsonNull");
      return null;
    }

    try {
      if (payloadElement.isJsonArray()) {
        JsonArray jsonArray = payloadElement.getAsJsonArray();
        return jsonArray.toString(); // Convert the entire array to a string
      } else if (payloadElement.isJsonPrimitive()) {
        return payloadElement.getAsString();
      } else if (payloadElement.isJsonObject()) {
        return payloadElement.toString(); // Convert JsonObject to string
      } else {
        LOG.warn("Unexpected payload type: {}", payloadElement.getClass());
        return null;
      }
    } catch (Exception e) {
      LOG.error("Error processing payload element: {}", e.getMessage());
      return null;
    }
  }
}
