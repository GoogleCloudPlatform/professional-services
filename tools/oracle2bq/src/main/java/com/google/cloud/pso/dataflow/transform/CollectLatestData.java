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

import com.google.cloud.pso.dataflow.common.KeyValueComparator;
import com.google.cloud.pso.dataflow.options.StreamToBigQueryPipelineOptions;
import com.google.common.flogger.FluentLogger;
import io.confluent.kafka.serializers.AbstractKafkaAvroSerDeConfig;
import io.confluent.kafka.serializers.KafkaAvroDeserializer;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import org.apache.avro.Schema;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.generic.GenericRecordBuilder;
import org.apache.avro.io.DatumReader;
import org.apache.beam.sdk.transforms.Combine;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.Max;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;

/**
 * Transform to get the latest elements from the source data.
 */
public class CollectLatestData extends PTransform<PCollection<byte[]>, PCollection<KV<byte[], String>>> {

    private static final FluentLogger LOGGER = FluentLogger.forEnclosingClass();

    /**
     * Method to specify how this {@code PTransform} should be expanded on the given source data.
     * <br/><br/>
     * <b>NOTE</b>: This method should not be called directly. Instead the {@code PTransform} should
     * be applied to the {@code InputT} using the {@code apply} method.
     *
     * @param sourceData The source data
     * @return The latest data
     */
    @Override
    public PCollection<KV<byte[], String>> expand(PCollection<byte[]> sourceData) {
        final PCollection<KV<byte[], String>> byteAndPOS = sourceData.apply("Getting the latest Element", ParDo.of(new DataProcessor()));
        final PCollection<KV<byte[], String>> latestElement = byteAndPOS.apply("Combine on MAX values", Combine.globally(Max.of(new KeyValueComparator())).withoutDefaults());
        return latestElement;
    }

    /**
     * Builds the data.
     */
    static class DataProcessor extends DoFn<byte[], KV<byte[], String>> {
        private DatumReader<GenericRecord> datumReader;
        private static final String POS = "pos";

        @StartBundle
        public void startBundle() {
            if (datumReader == null) {
                datumReader = new GenericDatumReader<>();
            }
        }

        @ProcessElement
        public void processElement(ProcessContext context) throws IOException {
            final StreamToBigQueryPipelineOptions options = context.getPipelineOptions()
                    .as(StreamToBigQueryPipelineOptions.class);
            LOGGER.atInfo().log("After windowing ****");
            Map<String, Object> config = new HashMap<>();
            config.put(AbstractKafkaAvroSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG, options.getSchemaRegistyUrl());
            KafkaAvroDeserializer kafkaAvroDeserializer = new KafkaAvroDeserializer();
            kafkaAvroDeserializer.configure(config, false);
            GenericRecord genericRecord = (GenericRecord) kafkaAvroDeserializer.deserialize(options.getKafkaTopic(), context.element());
            Schema schemaFromKafka = genericRecord.getSchema();
            LOGGER.atInfo().log("Schema From Kafka bytes  is " + schemaFromKafka);
            GenericRecordBuilder genericRecordBuilder = new GenericRecordBuilder(schemaFromKafka);
            for (Schema.Field field : genericRecord.getSchema().getFields()) {
                genericRecordBuilder.set(field.name(), genericRecord.get(field.name()));
            }
            LOGGER.atInfo().log("genericRecord " + genericRecord);
            String pos = genericRecord.get(POS).toString();
            LOGGER.atInfo().log("The POS value is " + pos);

            context.output(KV.of(context.element(), pos)); //Removed but watch
        }
    }
}

