/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.dataflow.common;

import com.google.common.base.Joiner;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.util.Objects;
import org.apache.avro.LogicalTypes;
import org.apache.avro.Schema;
import org.apache.avro.SchemaBuilder;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.io.DatumReader;
import org.apache.avro.io.DecoderFactory;
import org.apache.avro.io.JsonDecoder;
import org.apache.beam.sdk.options.ValueProvider;
import org.apache.beam.sdk.transforms.windowing.BoundedWindow;

/**
 * Helper methods.
 */
public final class Util {

    public static final String INSERT_ID = "insertId";

    public static final String PRIMARY_KEY = "PK";

    public static final String DATE_FOR_PARTITIONING = "DATE_FOR_PARTITIONING";

    public static final String POS = "POS";

    public static final String CREATED_TS = "CREATEDTS";

    public static final String WINDOW_TIMESTAMP = "WINDOW_TIMESTAMP";

    public static final DateTimeFormatter DATE_FORMATTER = new DateTimeFormatterBuilder()
            .appendValue(ChronoField.YEAR, 4).appendLiteral('-')
            .appendValue(ChronoField.MONTH_OF_YEAR, 2).appendLiteral('-')
            .appendValue(ChronoField.DAY_OF_MONTH, 2)
            .toFormatter();

    public static final DateTimeFormatter DATE_TIME_FORMATTER = new DateTimeFormatterBuilder()
            .appendValue(ChronoField.YEAR, 4).appendLiteral('-')
            .appendValue(ChronoField.MONTH_OF_YEAR, 2).appendLiteral('-')
            .appendValue(ChronoField.DAY_OF_MONTH, 2).appendLiteral(' ')
            .appendValue(ChronoField.HOUR_OF_DAY, 2).appendLiteral(':')
            .appendValue(ChronoField.MINUTE_OF_HOUR, 2).appendLiteral(':')
            .appendValue(ChronoField.SECOND_OF_MINUTE, 2)
            .toFormatter();

    private static final String RECORD_NAME = "parquetschema";

    private static final String NAMESPACE = "resources.avro";

    private static final Schema TYPE_DATE = LogicalTypes.date()
            .addToSchema(Schema.create(Schema.Type.INT));

    private static final Schema TYPE_STRING = Schema.create(Schema.Type.STRING);

    private static final Schema TYPE_TIMESTAMP = LogicalTypes.timestampMillis()
            .addToSchema(Schema.create(Schema.Type.LONG));

    private static final String NULL = "null";

    private static final Object NO_DEFAULT = null;

    private static final ImmutableList<Schema.Field> EXTRA_FIELDS = ImmutableList.of(
            new Schema.Field(
                    INSERT_ID, TYPE_STRING, INSERT_ID, NULL),
            new Schema.Field(
                    WINDOW_TIMESTAMP, TYPE_TIMESTAMP, WINDOW_TIMESTAMP, NO_DEFAULT));

    private static final DecoderFactory JSON_DECODER_FACTORY = DecoderFactory.get();

    private static final Joiner COLON_JOINER = Joiner.on(':').skipNulls();

    private static final Joiner DOT_JOINER = Joiner.on('.').skipNulls();

    /**
     * Creates the {@link Schema parquet schema}.
     */
    public static Schema createParquetSchema(Schema schema) {
        Preconditions.checkNotNull(schema, "Parquet schema cannot be null");

        SchemaBuilder.FieldAssembler fieldAssembler = SchemaBuilder
                .record(RECORD_NAME)
                .namespace(NAMESPACE)
                .fields()
                .name(DATE_FOR_PARTITIONING)
                .type(TYPE_DATE)
                .noDefault();

        for (Schema.Field field : schema.getFields()) {
            fieldAssembler = fieldAssembler
                    .name(field.name())
                    .type(field.schema())
                    .withDefault(field.defaultVal());
        }

        // Dynamically add fields that will NOT be part of the
        // actual parquet schema (i.e. to support other applications).
        for (Schema.Field field : EXTRA_FIELDS) {
            fieldAssembler = fieldAssembler
                    .name(field.name())
                    .type(field.schema())
                    .withDefault(field.defaultVal());
        }

        return (Schema) fieldAssembler.endRecord();
    }

    /**
     * Returns the BigQuery table reference.
     */
    public static String getBqTableReference(
            String projectId, ValueProvider<String> dataset, ValueProvider<String> tableName) {
        return COLON_JOINER.join(
                projectId,
                DOT_JOINER.join(
                        dataset.get(),
                        tableName.get()));
    }

    /**
     * Decodes JSON, using the given schema, to a generic record.
     *
     * @param schema The schema
     * @param json   The JSON
     * @return The generic record
     * @throws IOException if failed to decode the JSON
     */
    public static GenericRecord jsonToGenericRecord(Schema schema, String json) throws IOException {
        final JsonDecoder jsonDecoder = JSON_DECODER_FACTORY.jsonDecoder(schema, json);
        final DatumReader<GenericRecord> datumReader = new GenericDatumReader<>(schema);
        final GenericRecord record = datumReader.read(null, jsonDecoder);
        return record;
    }

    /**
     * Converts the value to a BigQuery date.
     */
    public static String convertToDate(Object value) {
        LocalDate date;
        try {
            long epochDay = ((Long) value).longValue();
            date = LocalDate.ofEpochDay(epochDay);
        } catch (ClassCastException exception) {
            date = LocalDate.parse(Objects.toString(value));
        }
        return date.format(DATE_FORMATTER);
    }

    /**
     * Returns the {@link BoundedWindow#maxTimestamp() window timestamp}.
     */
    public static String extractWindowTimestamp(BoundedWindow window) {
        Preconditions.checkNotNull(window, "Bounded window cannot be null.");
        return BoundedWindow.formatTimestamp(window.maxTimestamp());
    }
}
