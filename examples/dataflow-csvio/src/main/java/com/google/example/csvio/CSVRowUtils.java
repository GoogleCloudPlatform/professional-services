/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.google.example.csvio;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.Nullable;
import org.apache.beam.sdk.schemas.Schema;
import org.apache.beam.sdk.schemas.Schema.Field;
import org.apache.beam.sdk.schemas.Schema.FieldType;
import org.apache.beam.sdk.values.Row;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

/** Helpers to process CSV data into its expected {@link Schema.Field} types. */
class CSVRowUtils {

  static Row csvLineToRow(CSVFormat csvFormat, String header, String line, Schema schema) {
    try {
      CSVParser headerParser = CSVParser.parse(header, csvFormat);
      CSVParser lineParser = CSVParser.parse(line, csvFormat);

      List<CSVRecord> headerRecordsRaw = headerParser.getRecords();
      if (headerRecordsRaw.size() != 1) {
        throw new IllegalStateException(
            String.format(
                "header should be a single ContextualCSVRecord, got: %d", headerRecordsRaw.size()));
      }

      CSVRecord headerRecord = headerRecordsRaw.get(0);

      if (headerRecord.size() != schema.getFieldCount()) {
        throw new IllegalStateException(
            String.format(
                "mismatch of header size and schema size. header: %d vs schema: %d",
                headerRecord.size(), schema.getFieldCount()));
      }

      List<CSVRecord> lineRecordsRaw = lineParser.getRecords();
      if (lineRecordsRaw.size() != 1) {
        throw new IllegalStateException(
            String.format(
                "line should be a single ContextualCSVRecord, got: %d", headerRecordsRaw.size()));
      }

      CSVRecord lineRecord = lineRecordsRaw.get(0);

      if (lineRecord.size() != schema.getFieldCount()) {
        throw new IllegalStateException(
            String.format(
                "mismatch of line size and schema size. line: %d vs schema: %d",
                lineRecord.size(), schema.getFieldCount()));
      }

      return csvRecordToRow(headerRecord, lineRecord, schema);

    } catch (IOException e) {
      throw new IllegalStateException(
          String.format("Could not parse CSV records from %s with format %s", line, csvFormat), e);
    }
  }

  /**
   * Convert a {@link CSVRecord} line to a {@link Row} according to the {@link Schema} and the order
   * of named fields informed by the {@link CSVRecord} header.
   */
  static Row csvRecordToRow(CSVRecord header, CSVRecord line, Schema schema) {
    Map<String, Object> fieldValues = new HashMap<>();
    for (int i = 0; i < header.size(); i++) {
      String column = header.get(i);
      String value = line.get(i);
      Field field = schema.getField(column);
      Object castedValue = autoCastField(field, value);
      fieldValues.put(field.getName(), castedValue);
    }
    return Row.withSchema(schema).withFieldValues(fieldValues).build();
  }

  /** Converts the rawObj informed by the {@link Schema.Field} field {@link FieldType}. */
  static Object autoCastField(Schema.Field field, @Nullable Object rawObj) {
    if (rawObj == null) {
      if (!field.getType().getNullable()) {
        throw new IllegalArgumentException(String.format("Field %s not nullable", field.getName()));
      }
      return null;
    }

    FieldType type = field.getType();
    String raw = rawObj.toString();
    if (raw.trim().isEmpty()) {
      return null;
    }
    switch (type.getTypeName()) {
      case STRING:
        return raw;
      case BOOLEAN:
        return Boolean.valueOf(raw);
      case BYTE:
        return Byte.valueOf(raw);
      case INT16:
        return Short.valueOf(raw);
      case INT32:
        return Integer.valueOf(raw);
      case INT64:
        return Long.valueOf(raw);
      case FLOAT:
        return Float.valueOf(raw);
      case DOUBLE:
        return Double.valueOf(raw);
      default:
        throw new UnsupportedOperationException(String.format("type %s is not supported", type));
    }
  }
}
