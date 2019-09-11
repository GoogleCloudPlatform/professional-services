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

package pipelines;

import static org.apache.avro.Schema.Type.INT;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.FormatOptions;
import com.google.cloud.bigquery.JobId;
import com.google.cloud.bigquery.JobInfo;
import com.google.cloud.bigquery.LoadJobConfiguration;
import com.google.cloud.bigquery.TableId;
import com.google.cloud.bigquery.TimePartitioning;
import com.google.common.collect.ImmutableList;
import io.confluent.kafka.serializers.AbstractKafkaAvroSerDeConfig;
import io.confluent.kafka.serializers.KafkaAvroDeserializer;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.Serializable;
import java.nio.channels.Channels;
import java.nio.channels.SeekableByteChannel;
import java.nio.channels.WritableByteChannel;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;
import java.util.stream.Collectors;
import org.apache.avro.LogicalTypes;
import org.apache.avro.Schema;
import org.apache.avro.SchemaBuilder;
import org.apache.avro.SchemaBuilder.FieldAssembler;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericDatumWriter;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.generic.GenericRecordBuilder;
import org.apache.avro.io.DatumReader;
import org.apache.avro.io.DecoderFactory;
import org.apache.avro.io.EncoderFactory;
import org.apache.avro.io.JsonDecoder;
import org.apache.avro.io.JsonEncoder;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.coders.ByteArrayCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;
import org.apache.beam.sdk.extensions.gcp.options.GcsOptions;
import org.apache.beam.sdk.io.kafka.KafkaIO;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.Validation;
import org.apache.beam.sdk.options.ValueProvider;
import org.apache.beam.sdk.transforms.Combine;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.GroupByKey;
import org.apache.beam.sdk.transforms.Max;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.View;
import org.apache.beam.sdk.transforms.windowing.AfterWatermark;
import org.apache.beam.sdk.transforms.windowing.FixedWindows;
import org.apache.beam.sdk.transforms.windowing.Window;
import org.apache.beam.sdk.util.GcsUtil;
import org.apache.beam.sdk.util.gcsfs.GcsPath;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionView;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.kafka.common.serialization.ByteArrayDeserializer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.log4j.BasicConfigurator;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.apache.parquet.avro.AvroParquetReader;
import org.apache.parquet.avro.AvroParquetWriter;
import org.apache.parquet.hadoop.ParquetReader;
import org.apache.parquet.hadoop.ParquetWriter;
import org.joda.time.Duration;

/**
 * KafkaToGcs class.
 */
public class KafkaToGcs {
    private static final String OP_TYPE = "op_type";
    private static final String POS = "pos";
    private static final String CREATEDTS = "CREATEDTS";
    private static final String DATE_FOR_PARTITIONING = "DATE_FOR_PARTITIONING";
    private static final List<JobInfo.SchemaUpdateOption> SCHEMA_UPDATE_OPTIONS =
            ImmutableList.of(JobInfo.SchemaUpdateOption.ALLOW_FIELD_ADDITION, JobInfo.SchemaUpdateOption.ALLOW_FIELD_RELAXATION);

    private static final BigQuery BIG_QUERY = BigQueryOptions.getDefaultInstance().getService();
    private static final Logger LOG = Logger.getLogger(KafkaToGcs.class);
    private static SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    /**
     * Options interface.
     */
    public interface O2bqOptions extends PipelineOptions {

        /**
         * BQ table name.
         */
        @Description("BQ Table Name")
        @Default.String("O2BQTEST")
        String getBqTable();

        void setBqTable(String bqTable);

        /**
         * BQ dataset.
         */
        @Description("BQ data set name")
        // @Required
        @Default.String("demo")
        String getBqDataset();

        void setBqDataset(String bqDataset);

        /**
         * Kafka bootstrapServer.
         */
        @Description("Kafka bootstrapServer")
        // @Required
        @Default.String("10.36.6.3:9092,10.36.6.6:9092,10.36.8.6:9092")
        String getBootstrapServer();

        void setBootstrapServer(String bootstrapServer);

        /**
         * Kafka schema registry server.
         */
        @Description("Kafka schema regitry server")
        // @Required
        @Default.String("http://10.36.9.6:8081")
        String getSchemaRegistryServer();

        void setSchemaRegistryServer(String schemaRegistryServer);

        /**
         * Kafka topic.
         */
        @Description("Kafka topic")
        @Validation.Required
        @Default.String("SAMPLE.O2BQTEST")
        String getKafkaTopic();

        void setKafkaTopic(String kafkaTopic);

        /**
         * GCS resultBucket.
         */
        @Description("GCS resultBucket ")
        // @Required
        @Default.String("gs://result_dataflow_madhu/")
        String getResultBucket();

        void setResultBucket(String resultBucket);

        /**
         * Option to set projectId.
         */
        @Description("The bootstrap servers for Kafka).")
        @Default.String("10.36.6.3:9092,10.36.6.6:9092,10.36.8.6:9092")
        String getProjectId();

        void setProjectId(String projectId);

        /**
         * Option to set the GCS sink bucket name.
         */
        @Description("GCS bucket to write failed inserts.")
        ValueProvider<String> getFileOutput();

        void setFileOutput(ValueProvider<String> fileOutput);

        /**
         * Option to set the duration (in seconds) in windowing the streaming data.
         */
        @Description("The windowing duration (in seconds).")
        @Default.Long(10L)
        long getWindowingDuration();

        void setWindowingDuration(long durationInSeconds);

        /**
         * Option to set the delay (in seconds) before retrying failed insert retries.
         */
        @Description("The delay before retrying failed inserts (in minutes).")
        @Default.Long(10L)
        long getRetryFailedInsertDelay();

        void setRetryFailedInsertDelay(long delayMinutes);

        /**
         * Option to set schema registry url.
         */
        @Description("Schema registry url).")
        @Default.String("http://10.36.6.3:8081")
        String getSchemaRegistyUrl();

        void setSchemaRegistyUrl(String schemaRegistyUrl);

        /**
         * Option to set bootstrap servers.
         */
        @Description("The bootstrap servers for Kafka).")
        @Default.String("10.36.6.3:9092,10.36.6.6:9092,10.36.8.6:9092")
        String getBootstrapServers();

        void setBootstrapServers(String bootstrapServers);

        /**
         * Option to set primary-key column name.
         */
        @Description("Primary-key column name")
        @Default.String("PK")
        String getPrimaryKeyColumnNmae();

        void setPrimaryKeyColumnNmae(String primaryKeyColumnNmae);

    }

    /*
       private static Schema createParquetSchema(Schema schema) {
           Schema dateType = LogicalTypes.date().addToSchema(Schema.create(INT));
           FieldAssembler<Schema> fieldAssembler = SchemaBuilder.record("parquetschema").namespace("resources.avro").fields()
                   .name(DATE_FOR_PARTITIONING).type(dateType).noDefault();
           for (Schema.Field field : schema.getFields()) {
               fieldAssembler = fieldAssembler.name(field.name()).type(field.schema()).withDefault(field.defaultVal());
           }
           return (Schema) fieldAssembler.endRecord();
       }

   */
    static {
        sdf.setTimeZone(TimeZone.getTimeZone(ZoneOffset.UTC));
    }

    /**
     *
      * @param args
     */
    public static void main(String[] args) {
        BasicConfigurator.configure();
        LOG.getRootLogger().setLevel(Level.INFO);
        O2bqOptions options = PipelineOptionsFactory.fromArgs(args)
                .withValidation().as(O2bqOptions.class);
        Pipeline pipeline = Pipeline.create(options);
        final String tableName = options.getBqTable();
        final String datasetId = options.getBqDataset();
        //transform  to read from Kafka
        PCollection<KV<String, byte[]>> values = pipeline.apply("Read From Kafka", KafkaIO.<String, byte[]>read()
                .withBootstrapServers(options.getBootstrapServers())
                .withTopic(options.getKafkaTopic())
                .withValueDeserializerAndCoder(ByteArrayDeserializer.class, ByteArrayCoder.of())
                .withKeyDeserializerAndCoder(StringDeserializer.class, StringUtf8Coder.of())
                .withoutMetadata()
        );

        //transform to  convert message into bytes
        PCollection<byte[]> bytes = values.apply("Convert into bytes", ParDo.of(new DoFn<KV<String, byte[]>, byte[]>() {
            @ProcessElement
            public void processElement(ProcessContext c) {
                LOG.info("As read from kafka ***");
                //printing the String form of the data
                String s = new String(c.element().getValue());
                LOG.info(s);
                c.output(c.element().getValue());

            }
        }));

        //transform for windowing
        PCollection<byte[]> streamedDataWindows = bytes.apply("Windowing", Window.<byte[]>into(FixedWindows.of(Duration.standardSeconds(options.getWindowingDuration())))
                .withAllowedLateness(Duration.ZERO)
                .triggering(AfterWatermark.pastEndOfWindow())
                .discardingFiredPanes());

        /*transform to extract pos from each record. The output of this transform will be a <key, value> pair of byte[]  and POS in its string form
        This transform uses kafkaAvroDeserializer to deserialize the byte[] data, then it is converted to generic record and pos is extracted
         */
        PCollection<KV<byte[], String>> byteAndPOS = streamedDataWindows.apply("Getting the latest Element", ParDo.of(new DoFn<byte[], KV<byte[], String>>() {
            @ProcessElement
            public void processElement(ProcessContext c) throws IOException {
                O2bqOptions options = c.getPipelineOptions().as(O2bqOptions.class);
                LOG.info("After windowing ****");
                Map<String, Object> config = new HashMap<>();
                config.put(AbstractKafkaAvroSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG, options.getSchemaRegistyUrl());
                KafkaAvroDeserializer kafkaAvroDeserializer = new KafkaAvroDeserializer();
                kafkaAvroDeserializer.configure(config, false);
                GenericRecord genericRecord = (GenericRecord) kafkaAvroDeserializer.deserialize(options.getKafkaTopic(), c.element());
                Schema schemaFromKafka = genericRecord.getSchema();
                LOG.info("Schema From Kafka bytes  is " + schemaFromKafka);
                LOG.info("Schema types " + schemaFromKafka.getField(options.getPrimaryKeyColumnNmae()).getClass().getTypeName());
                GenericRecordBuilder genericRecordBuilder = new GenericRecordBuilder(schemaFromKafka);
                for (Schema.Field field : genericRecord.getSchema().getFields()) {
                    //LOG.info("get field name "+genericRecord.get(field.name()));
                    //LOG.info("field PK "+ field.getClass().  getTypeName());
                    genericRecordBuilder.set(field.name(), genericRecord.get(field.name()));

                }
                LOG.info("field "+options.getPrimaryKeyColumnNmae()+" "+ genericRecord.get(options.getPrimaryKeyColumnNmae()).getClass().getTypeName());
                String pos = genericRecord.get(POS).toString();
                LOG.info("The POS value is " + pos);
                c.output(KV.of(c.element(), pos));
            }
        }));

        //transform to find the latest element (based on POS) from the windowed data. This data will be passed as a side input to the next transform
        PCollection<KV<byte[], String>> latestElement = byteAndPOS.apply("Combine on MAX values", Combine.globally(Max.of(new KVComparatorforLocal())).withoutDefaults());
        final PCollectionView<KV<byte[], String>> latestElementView =
                latestElement.apply("Convert latestElement to singleton", View.asSingleton());


        /*transform to prepare generic records. These records will be built based on parquet schema(i.e., the schema that has DATE_FOR_PARTITIONING)
        column in it.
        1. Do this , first we read the schema from the latest element supplied as side input from above step(Using KafkaAvroDeserializer). (Ref lines 191-197)
        2. Once, this schema is obtained we evolve this into parquet schema by calling createparquetschema() function. (Ref line 198)
        3. Then, this latest parquet schema is used to build generic records for the rest of the elements in the window. (Ref line 201-206)
        4. The rest of this transform deals with extracting the date from CREATEDTS, adding that value to the DATE_FOR_PARTITIONING column.
        5. Finally, this transform will emit a <key,value> pair where key is the date(extracted from CREATEDTS) and value is a Pair<latest schema, element>
        both in string forms
        */
        PCollection<KV<String, Pair<String, String>>> keyValueForm = streamedDataWindows.apply("Prepare Generic Records", ParDo.of(new DoFn<byte[], KV<String, Pair<String, String>>>() {
            private static final long serialVersionUID = 1L;

            @ProcessElement
            public void processElement(ProcessContext c) throws ParseException, IOException {
                O2bqOptions options = c.getPipelineOptions().as(O2bqOptions.class);
                try {
                    KV<byte[], String> sideInputasKV = c.sideInput(latestElementView);
                    Map<String, Object> config = new HashMap<>();
                    config.put(AbstractKafkaAvroSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG, options.getSchemaRegistyUrl());
                    KafkaAvroDeserializer kafkaAvroDeserializer = new KafkaAvroDeserializer();
                    kafkaAvroDeserializer.configure(config, false);
                    GenericRecord genericRecord = (GenericRecord) kafkaAvroDeserializer.deserialize(options.getKafkaTopic(), sideInputasKV.getKey());
                    Schema latestSchema = genericRecord.getSchema();
                    LOG.info("The schema from sideinput is" + latestSchema);
                    //Schema latestSchemaWithDate = createParquetSchema(latestSchema);
                    String schemaStr = latestSchema.toString().replace("\"default\":null", "\"default\":\"null\"");
                    //Gson gson = new Gson();
                    //Schema latestSchemaMod = gson.fromJson(schemaStr,latestSchema.getClass());
                    //Schema latestSchemaMod =  new Schema.Parser().parse(schemaStr); //org.apache.avro.Schema.Parser;
                    Schema latestSchemaMod = new Schema.Parser().parse(schemaStr);
                    LOG.info("Modified schema newSchema " + latestSchemaMod);
                    Schema dateType = LogicalTypes.date().addToSchema(Schema.create(INT));
                    LOG.info("The schema dateType " + dateType);
                    FieldAssembler<Schema> fieldAssembler = SchemaBuilder.record("parquetschema").namespace("resources.avro").fields()
                            .name(DATE_FOR_PARTITIONING).type(dateType).noDefault();
                    for (Schema.Field field : latestSchemaMod.getFields()) {
                        fieldAssembler = fieldAssembler.name(field.name()).type(field.schema()).withDefault(field.defaultVal());
                    }
                    Schema latestSchemaWithDate = (Schema) fieldAssembler.endRecord();


                    LOG.info("The Schema for Generic Record  ****\n" + latestSchemaWithDate);

                    GenericRecord genericRecord2 = (GenericRecord) kafkaAvroDeserializer.deserialize(options.getKafkaTopic(), c.element());
                    GenericRecordBuilder genericRecordBuilder = new GenericRecordBuilder(latestSchemaWithDate);
                    for (Schema.Field field : genericRecord2.getSchema().getFields()) {
                        genericRecordBuilder.set(field.name(), genericRecord2.get(field.name()));

                    }
                    String createdTs = null;
                    LOG.info("Generic Record is  **** " + genericRecord);
                    Set<String> genericRecordSet = genericRecord.getSchema().getFields().stream().map(Schema.Field::name).collect(Collectors.toSet());
                    Set<String> newFields = latestSchemaWithDate.getFields().stream().map(Schema.Field::name).collect(Collectors.toSet());
                    newFields.removeAll(genericRecordSet);
                    LOG.info("NewFields " + newFields.toString());
                    schemaStr = latestSchemaWithDate.toString().replace("\"default\":null", "\"default\":\"null\"");
                    @SuppressWarnings("deprecation")
                    Schema latestSchemaWithDateMod = new Schema.Parser().parse(schemaStr);
                    //Gson gson = new Gson();
                    //Schema latestSchemaWithDateMod = gson.fromJson(schemaStr, Schema.class);
                    LOG.info("Modified schema again newSchema " + latestSchemaWithDateMod);
                    LOG.info("Generic record " + genericRecord);
                    LOG.info("Generic record check " + genericRecord.getSchema());
                    for (Schema.Field field : latestSchemaWithDateMod.getFields()) {
                        if (field.name().equals(DATE_FOR_PARTITIONING)) {
                            //createdTs = ((org.apache.avro.generic.GenericData.Record)genericRecord.get("after")).get(CREATEDTS).toString();
                            createdTs = genericRecord.get(CREATEDTS).toString();
                            LOG.info("CREATEDTS " + genericRecord.get("after"));
                            Date dateValue = sdf.parse(createdTs);
                            LocalDate localDate = dateValue.toInstant().atZone(ZoneOffset.UTC).toLocalDate();
                            long day = localDate.toEpochDay();
                            genericRecordBuilder.set(DATE_FOR_PARTITIONING, day);

                        } else {

                            if (!newFields.contains(field.name())) {

                                genericRecordBuilder.set(field.name(), genericRecord.get(field.name()));
                            } else {

                                genericRecordBuilder.set(field.name(), field.defaultVal());

                            }

                        }
                    }
                    GenericRecord outputdatum = genericRecordBuilder.build();
                    String dateKey = createdTs.split(" ")[0];
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    GenericDatumWriter<GenericRecord> writer = new GenericDatumWriter<>(latestSchemaWithDate);
                    JsonEncoder encoder = EncoderFactory.get().jsonEncoder(latestSchemaWithDate, baos, false);
                    writer.write(outputdatum, encoder);
                    encoder.flush();
                    c.output(KV.of(dateKey, Pair.of(latestSchemaWithDate.toString(), new String(baos.toByteArray(), StandardCharsets.UTF_8))));


                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }).withSideInputs(latestElementView));

        //transform to do a groupbyKey( date, in this case ) on the values
        PCollection<KV<String, Iterable<Pair<String, String>>>> valuesForParquet = keyValueForm.apply("GroupingByDate", GroupByKey.create());

        /*transform to perform the merge logic, create or update the gcs files. The output of this transform will be a list of GCS files that
        have been changed or newly created */
        PCollection<KV<String, String>> filesforBQ = valuesForParquet.apply("Writing Parquet to GCS", ParDo.of(new DoFn<KV<String, Iterable<Pair<String, String>>>, KV<String, String>>() {
            @ProcessElement
            public void processElement(ProcessContext c) throws IOException, ParseException {
                O2bqOptions options = c.getPipelineOptions().as(O2bqOptions.class);
                Schema jsonElementSchema = null;
                String dateKey = c.element().getKey();
                LOG.debug("Processing updates for date " + dateKey);
                //HashMap<Double, GenericRecord> kafkaUpdates = new HashMap<>();
                HashMap<Object, GenericRecord> kafkaUpdates = new HashMap<>();
                PipelineOptions options1 = c.getPipelineOptions();
                GcsOptions gcsOptions = options1.as(GcsOptions.class);
                LOG.info("GCS options " + options1);
                GcsUtil gs = gcsOptions.getGcsUtil();
                assert dateKey != null;
                String[] dateKeyArray = dateKey.split("-");
                String year = dateKeyArray[0];
                String month = dateKeyArray[1];
                String date = dateKeyArray[2];
                String dayPartition = year + month + date;
                String fileName = options.getResultBucket() + year + "/" + month + "/" + date + ".parquet";
                GcsPath sourcePath = GcsPath.fromUri(fileName);
                LOG.info("GcsPath " + sourcePath);
                String type = "application/octetstream";
                GenericRecord elementKafkaUpdate = null;
                for (Pair<String, String> jsonElement : c.element().getValue()) {
                    //deserialize json to generic record
                    String jsonElementSchemaString = jsonElement.getLeft();
                    jsonElementSchema = new Schema.Parser().parse(jsonElementSchemaString);
                    String jsonElementValue = jsonElement.getRight();
                    LOG.info("Schema of Json Element is (1) " + "\n" + "\n" + jsonElementSchema + "\n");
                    LOG.info("Json Element is" + "\n" + "\n" + jsonElementValue + "\n");
                    JsonDecoder jsonDecoder = DecoderFactory.get().jsonDecoder(jsonElementSchema, jsonElementValue);
                    DatumReader<GenericRecord> datumReader = new GenericDatumReader<GenericRecord>(jsonElementSchema);
                    elementKafkaUpdate = datumReader.read(null, jsonDecoder);
                    LOG.info("elementKafkaUpdate " + elementKafkaUpdate);
                    Object pk = elementKafkaUpdate.get(options.getPrimaryKeyColumnNmae());

                    LOG.info("Adding generic record to hashmap " + pk);
                    if (kafkaUpdates.containsKey(pk)) {
                        GenericRecord hashmapKafkaUpdate = kafkaUpdates.get(pk);
                        String hashmapPOSKafka = hashmapKafkaUpdate.get(POS).toString();
                        //Date hashmapDate = sdf.parse(hashmapOpTsKafka);
                        String elementPOS = elementKafkaUpdate.get(POS).toString();
                        //Date elementDate = sdf.parse(elementOpTs);
                        if (hashmapPOSKafka.compareTo(elementPOS) < 0) {
                            kafkaUpdates.put(pk, elementKafkaUpdate);
                        }
                    } else {
                        kafkaUpdates.put(pk, elementKafkaUpdate);
                    }
                }
                LOG.info("jsonElementSchema is " + jsonElementSchema);
                GenericRecordBuilder genericRecordBuilder = new GenericRecordBuilder(jsonElementSchema);
                WritableByteChannel wb = gs.create(sourcePath, type);
                BeamParquetOutputFile beamParquetOutputFile =
                        new BeamParquetOutputFile(Channels.newOutputStream(wb));
                ParquetWriter<GenericRecord> pw =
                        AvroParquetWriter.<GenericRecord>builder(beamParquetOutputFile)
                                .withSchema(jsonElementSchema)
                                .build();
                LOG.info("pw " + pw.toString());
                try (SeekableByteChannel rb = gs.open(sourcePath)) {
                    try (ParquetReader<GenericRecord> pr =
                                 AvroParquetReader.<GenericRecord>builder(new BeamParquetInputFile(rb))
                                         .build()) {
                        GenericRecord gcsRecord;
                        while ((gcsRecord = pr.read()) != null) {

                            //long pkValue = (long) gcsRecord.get(PK);
                            Object pkValue = gcsRecord.get(options.getPrimaryKeyColumnNmae());
                            if (kafkaUpdates.containsKey(pkValue)) {
                                String gcsOpTs = gcsRecord.get(POS).toString();
                                Date gcsDate = sdf.parse(gcsOpTs);
                                GenericRecord kafkaUpdate = kafkaUpdates.get(pkValue);
                                String elementOpTs = kafkaUpdate.get(POS).toString();
                                Date elementDate = sdf.parse(elementOpTs);
                                if (gcsDate.compareTo(elementDate) <= 0) {
                                    String opType = kafkaUpdate.get(OP_TYPE).toString();
                                    switch (opType) {
                                        case "I":
                                            LOG.debug("Newer insert was found for pk value " + pkValue);
                                            pw.write(kafkaUpdate);
                                            break;
                                        case "U":
                                            pw.write(kafkaUpdate);
                                            break;
                                        case "D":
                                            break;
                                        default:
                                            LOG.error("Unknown opType " + opType);
                                            break;
                                    }
                                } else {

                                    LOG.info("POS in GCS greater than POS of kafka element for pk value " + pkValue);
                                    Set<String> genericRecordSet = gcsRecord.getSchema().getFields().stream().map(Schema.Field::name).collect(Collectors.toSet());
                                    Set<String> newFields = jsonElementSchema.getFields().stream().map(Schema.Field::name).collect(Collectors.toSet());
                                    newFields.removeAll(genericRecordSet);

                                    for (Schema.Field field : jsonElementSchema.getFields()) {

                                        if (!newFields.contains(field.name())) {
                                            genericRecordBuilder.set(field.name(), gcsRecord.get(field.name()));
                                        } else {

                                            genericRecordBuilder.set(field.name(), kafkaUpdate.get(field.name()));

                                        }


                                    }
                                    GenericRecord outputdatum = genericRecordBuilder.build();
                                    pw.write(outputdatum);
                                }
                                kafkaUpdates.remove(pkValue);
                            } else {
                                Set<String> genericRecordSet = gcsRecord.getSchema().getFields().stream().map(Schema.Field::name).collect(Collectors.toSet());
                                Set<String> newFields = jsonElementSchema.getFields().stream().map(Schema.Field::name).collect(Collectors.toSet());
                                newFields.removeAll(genericRecordSet);
                                for (Schema.Field field : jsonElementSchema.getFields()) {

                                    if (!newFields.contains(field.name())) {
                                        genericRecordBuilder.set(field.name(), gcsRecord.get(field.name()));
                                    } else {

                                        genericRecordBuilder.set(field.name(), "null");

                                    }


                                }

                                GenericRecord outputdatum2 = genericRecordBuilder.build();
                                LOG.info("GCS Record is" + "\n" + "\t" + outputdatum2);
                                pw.write(outputdatum2);
                            }
                        }
                    }
                } catch (IOException e) {
                    LOG.error("File not found in gcs " + sourcePath);
                }
                for (GenericRecord kafkaUpdate : kafkaUpdates.values()) {
                    switch (kafkaUpdate.get(OP_TYPE).toString()) {
                        case "I":
                            pw.write(kafkaUpdate);
                            LOG.debug("Inserted the record for pkvalue " + kafkaUpdate.get(options.getPrimaryKeyColumnNmae()));
                            break;
                        case "U":
                            pw.write(kafkaUpdate);
                            LOG.warn("No record found to update in GCS for pk value " + kafkaUpdate.get(options.getPrimaryKeyColumnNmae()));
                            break;
                        case "D":
                            LOG.warn("No record found to delete in GCS " + kafkaUpdate.get(options.getPrimaryKeyColumnNmae()));
                            break;
                    }
                }
                pw.close();
                LOG.info("Data written as parquet files into GCS");
                c.output(KV.of(dayPartition, fileName));
            }
        }));

        //loading the files into BQ partitioned tables.
        filesforBQ.apply("Load into BQ", ParDo.of(new DoFn<KV<String, String>, Void>() {
            @ProcessElement
            public void processElement(ProcessContext c) {
                String dayPartition = c.element().getKey();
                String gcsFilename = c.element().getValue();
                O2bqOptions options = c.getPipelineOptions().as(O2bqOptions.class);
                LoadJobConfiguration loadConf = LoadJobConfiguration.newBuilder(TableId.of(options.getProjectId(), options.getBqDataset(), options.getBqTable() + "$" + dayPartition),
                        gcsFilename, FormatOptions.parquet())
                        .setWriteDisposition(JobInfo.WriteDisposition.WRITE_TRUNCATE)
                        .setCreateDisposition(JobInfo.CreateDisposition.CREATE_IF_NEEDED)
                        .setAutodetect(Boolean.TRUE)
                        .setSchemaUpdateOptions(SCHEMA_UPDATE_OPTIONS)
                        .setTimePartitioning(TimePartitioning.newBuilder(TimePartitioning.Type.DAY).setField(DATE_FOR_PARTITIONING).build())
                        .build();
                try {
                    //TODO add retry logic and implement logic that ensures that there is not more than 1 update per five seconds
                    JobId jobID = BIG_QUERY.create(JobInfo.of(loadConf)).waitFor().getJobId();
                    LOG.info("BigQuery job submitted.JobID is " + jobID);
                    LOG.info("Parquet files written into BigQuery");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }));
        pipeline.run().waitUntilFinish();
    }//end of main
}//end of class


//comparator class for finding the latest element in a window
class KVComparatorforLocal implements Comparator<KV<byte[], String>>, Serializable {
    @Override
    public int compare(KV<byte[], String> o1, KV<byte[], String> o2) {
        int returnValue = o2.getValue().compareTo(o1.getValue());
        return returnValue;
    }
}


