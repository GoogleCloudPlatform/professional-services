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

package com.google.cloud.pso.dataflow.transform;

import static com.google.cloud.pso.dataflow.common.Util.CREATED_TS;
import static com.google.cloud.pso.dataflow.common.Util.DATE_FOR_PARTITIONING;
import static com.google.cloud.pso.dataflow.common.Util.INSERT_ID;
import static com.google.cloud.pso.dataflow.common.Util.POS;
import static com.google.cloud.pso.dataflow.common.Util.PRIMARY_KEY;
import static com.google.cloud.pso.dataflow.common.Util.WINDOW_TIMESTAMP;
import static com.google.cloud.pso.dataflow.common.Util.createParquetSchema;
import static com.google.cloud.pso.dataflow.common.Util.extractWindowTimestamp;
import static com.google.cloud.pso.dataflow.common.Util.getBqTableReference;
import static org.apache.avro.Schema.Type.INT;

import com.google.api.services.bigquery.model.TableRow;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.auto.value.AutoValue;
import com.google.cloud.pso.bigquery.TableRowWithSchema;
import com.google.cloud.pso.dataflow.common.BigQueryAvroUtils;
import com.google.cloud.pso.dataflow.common.Util;
import com.google.cloud.pso.dataflow.options.StreamToBigQueryPipelineOptions;
import com.google.common.flogger.FluentLogger;
import io.confluent.kafka.serializers.AbstractKafkaAvroSerDeConfig;
import io.confluent.kafka.serializers.KafkaAvroDeserializer;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.avro.LogicalTypes;
import org.apache.avro.Schema;
import org.apache.avro.SchemaBuilder;
import org.apache.avro.SchemaBuilder.FieldAssembler;
import org.apache.avro.file.DataFileStream;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.generic.GenericRecordBuilder;
import org.apache.avro.io.DatumReader;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.windowing.BoundedWindow;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollectionView;

/**
 * Transforms the generic records to a BigQuery table row.
 */
@AutoValue
public abstract class GenericRecordToTableRow extends DoFn<byte[], TableRowWithSchema> {

    private static final FluentLogger LOGGER = FluentLogger.forEnclosingClass();

    private DatumReader<GenericRecord> datumReader;

    abstract PCollectionView<KV<byte[], String>> latestElementSideInput();

    /**
     * Initializes instances needed to process the elements in the bundle.
     */
    @StartBundle
    public void startBundle() {
        if (datumReader == null) {
            datumReader = new GenericDatumReader<>();
        }
    }

    /**
     * @param context
     * @param window
     * @throws ParseException
     * @throws IOException
     */
    @ProcessElement
    public void processElement(ProcessContext context, BoundedWindow window) throws ParseException, IOException {
        KafkaAvroDeserializer kafkaAvroDeserializer = new KafkaAvroDeserializer();
        final StreamToBigQueryPipelineOptions options = context.getPipelineOptions()
                .as(StreamToBigQueryPipelineOptions.class);
        final KV<byte[], String> latestData = context.sideInput(latestElementSideInput());
        LOGGER.atInfo().log("********** latestData: %s ******", latestData.toString());
        final Schema latestSchemaWithDate = getLatestSchemaWithDate(context);
        final List<Schema.Field> latestSchemaFields = latestSchemaWithDate.getFields();

        LOGGER.atInfo().log("********** latestSchemaFields: %s ******", latestSchemaFields);

        final String maxTimestamp = extractWindowTimestamp(window);
        LOGGER.atFine().log("********** window: %s ----> %s ******", window, maxTimestamp);

        final byte[] avroSource = context.element();

        LOGGER.atInfo().log("********** avroSource: %s ******", avroSource);

        try {

            LOGGER.atInfo().log("********* New **************** starts");

            Map<String, Object> config = new HashMap<>();
            config.put(AbstractKafkaAvroSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG, options.getSchemaRegistyUrl());

            kafkaAvroDeserializer.configure(config, false);

            GenericRecord genericRecord = (GenericRecord) kafkaAvroDeserializer.deserialize(options.getKafkaTopic(),
                    context.element());

            LOGGER.atInfo().log("********* genericRecord****************  " + genericRecord);
            LOGGER.atInfo().log("********* genericRecord tostring ****************  " + genericRecord.toString());

            Schema schemaFromKafka = genericRecord.getSchema();

            LOGGER.atInfo().log("Schema From Kafka bytes  is " + schemaFromKafka);

            GenericRecordBuilder genericRecordBuilder = new GenericRecordBuilder(latestSchemaWithDate);
            for (Schema.Field field : genericRecord.getSchema().getFields()) {

                LOGGER.atInfo().log("********* field.name() ****************  " + field.name());
                LOGGER.atInfo().log("********* genericRecord.get(field.name()) ****************  " + genericRecord.get(field.name()));

                genericRecordBuilder.set(field.name(), genericRecord.get(field.name()));
            }

            Set<String> genericRecordSet = genericRecord.getSchema().getFields().stream()
                    .map(Schema.Field::name).collect(Collectors.toSet());
            Set<String> newFields = latestSchemaWithDate.getFields().stream().map(Schema.Field::name)
                    .collect(Collectors.toSet());
            newFields.removeAll(genericRecordSet);
            LOGGER.atInfo().log("NewFields " + newFields.toString());

            String schemaStr = latestSchemaWithDate.toString().replace("\"default\":null", "\"default\":\"null\"");

            Schema latestSchemaWithDateMod = new Schema.Parser().parse(schemaStr);
            LOGGER.atInfo().log("Modified schema again newSchema " + latestSchemaWithDateMod);
            LOGGER.atInfo().log("Generic record 2 " + genericRecord);
            LOGGER.atInfo().log("Generic record check " + genericRecord.getSchema());

            for (Schema.Field field : latestSchemaWithDateMod.getFields()) {

                LOGGER.atInfo().log("field.name() ::  " + field.name() + " genericRecord.get >> " + genericRecord.get(field.name()));
                LOGGER.atInfo().log(" genericRecord.get(CREATED_TS) >> " + genericRecord.get(CREATED_TS));

                if (field.name().equals(DATE_FOR_PARTITIONING) && genericRecord.get(CREATED_TS) != null) {
                    genericRecordBuilder.set(DATE_FOR_PARTITIONING, extractDateFromDateTime(genericRecord.get(CREATED_TS)));
                } else if (field.name().equals(WINDOW_TIMESTAMP)) {
                    genericRecordBuilder.set(WINDOW_TIMESTAMP, maxTimestamp);
                } else if (field.name().equals(INSERT_ID)) {
                    genericRecordBuilder.set(INSERT_ID, generateInsertId(genericRecord));
                } else if (field.name().equals("PRIMARY_KEY")) {
                    genericRecordBuilder.set(PRIMARY_KEY, Objects.toString(genericRecord.get(PRIMARY_KEY)));
                } else {
                    if (!newFields.contains(field.name())) {
                        genericRecordBuilder.set(field.name(), genericRecord.get(field.name()));
                    } else {
                        genericRecordBuilder.set(field.name(), field.defaultVal());
                    }
                }
            }

            LOGGER.atInfo().log("genericRecord " + genericRecord);
            LOGGER.atInfo().log("genericRecordBuilder " + genericRecordBuilder);

            String pos = genericRecord.get(POS).toString();

            LOGGER.atInfo().log("The POS value is " + pos);

            final GenericRecord record = genericRecordBuilder.build();

            final TableSchema tableSchema = BigQueryAvroUtils.getTableSchema(latestSchemaWithDate);
            final TableRow tableRow = BigQueryAvroUtils.getTableRow(record);

            LOGGER.atInfo().log("********** tableSchema:\n%s ******", tableSchema);
            LOGGER.atInfo().log("********** tableRow:\n%s", tableRow);

            final String tableName = getBqTableReference(options.getProject(), options.getBqDataset(),
                    options.getBqTable());

            TableRowWithSchema tblWithSchema = new TableRowWithSchema(tableName, tableSchema, tableRow);
            context.output(tblWithSchema);


            LOGGER.atInfo().log("********* New **************** ENDS");

        } catch (Exception e) {
            LOGGER.atInfo().log("********* Error in New **************** ", e);
            e.printStackTrace();
        } finally {
            kafkaAvroDeserializer.close();
        }

    }

    /**
     * Finds the latest schema from the given data set.
     * <br/><br/>
     * The method will just get the <b>last</b> item the given data set, and used the last date to build
     * the latest schema.
     *
     * @param latestData The data set
     * @return The latest schema, as determined from the data set
     * @throws IOException if failed to process the data
     */
    private Schema getLatestSchemaWithDate1(KV<byte[], String> latestData) throws IOException {
        final Schema latestSchemaWithDate;
        Schema latestSchema = null;

        try (final InputStream inputStreamForSideInput = new ByteArrayInputStream(latestData.getKey());
             final DataFileStream<GenericRecord> dataReader =
                     new DataFileStream<>(inputStreamForSideInput, datumReader)) {
            while (dataReader.hasNext()) {
                GenericRecord genericRecordForSchema = dataReader.next();
                latestSchema = genericRecordForSchema.getSchema();
            }
            latestSchemaWithDate = createParquetSchema(latestSchema);
            LOGGER.atInfo().log("The Schema from SideInput is %s", latestSchemaWithDate);
            return latestSchemaWithDate;
        }
    }

    private Schema getLatestSchemaWithDate(ProcessContext context) throws IOException {
        final StreamToBigQueryPipelineOptions options = context.getPipelineOptions()
                .as(StreamToBigQueryPipelineOptions.class);
        final KV<byte[], String> sideInputasKV = context.sideInput(latestElementSideInput());
        Map<String, Object> config = new HashMap<>();
        config.put(AbstractKafkaAvroSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG, options.getSchemaRegistyUrl());
        KafkaAvroDeserializer kafkaAvroDeserializer = new KafkaAvroDeserializer();
        kafkaAvroDeserializer.configure(config, false);
        GenericRecord genericRecord = (GenericRecord) kafkaAvroDeserializer.deserialize(options.getKafkaTopic(), sideInputasKV.getKey());
        Schema latestSchema = genericRecord.getSchema();
        String schemaStr = latestSchema.toString().replace("\"default\":null", "\"default\":\"null\"");
        Schema latestSchemaMod = new Schema.Parser().parse(schemaStr);
        Schema dateType = LogicalTypes.date().addToSchema(Schema.create(INT));
        FieldAssembler<Schema> fieldAssembler = SchemaBuilder.record("parquetschema").namespace("resources.avro").fields()
                .name(DATE_FOR_PARTITIONING).type(dateType).noDefault();
        for (Schema.Field field : latestSchemaMod.getFields()) {
            fieldAssembler = fieldAssembler.name(field.name()).type(field.schema()).withDefault(field.defaultVal());
        }
        Schema latestSchemaWithDate = (Schema) fieldAssembler.endRecord();
        return latestSchemaWithDate;
    }

    /**
     * Returns just the date in the following form YYYY-MM-DD.
     */
    static String extractDateFromDateTime(Object dateTime) throws ParseException {
        final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        final Date dateValue = dateFormat.parse(Objects.toString(dateTime));
        return Util.convertToDate(dateValue
                .toInstant()
                .atZone(ZoneOffset.UTC)
                .toLocalDate()
                .toEpochDay());
    }

    /**
     * Returns the insert ID.
     */
    static String generateInsertId(GenericRecord record) {
        return Objects.toString(record.get(POS));
    }

    public static Builder builder() {
        return new AutoValue_GenericRecordToTableRow.Builder();
    }

    /**
     * Builder class.
     */
    @AutoValue.Builder
    public abstract static class Builder {

        public abstract Builder latestElementSideInput(PCollectionView<KV<byte[], String>> latestElementSideInput);

        public abstract GenericRecordToTableRow build();
    }
}

