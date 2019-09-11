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

package com.google.cloud.pso.dataflow;

import com.google.cloud.pso.dataflow.options.StreamToBigQueryPipelineOptions;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.coders.ByteArrayCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;
import org.apache.beam.sdk.io.kafka.KafkaIO;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.Values;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.kafka.common.serialization.ByteArrayDeserializer;
import org.apache.kafka.common.serialization.StringDeserializer;

/**
 * Base class for pipeline.
 */
public class KafkaToBigQuery extends AbstractStreamToBigQuery {
    public static void main(String[] args) {
        PipelineOptionsFactory.register(KafkaToBigQueryPipelineOptions.class);

        final KafkaToBigQueryPipelineOptions options = PipelineOptionsFactory.fromArgs(args)
                .withValidation()
                .as(KafkaToBigQueryPipelineOptions.class);
        new KafkaToBigQuery().run(options);
    }

    /**
     * Applies read source to the pipeline to begin streaming into BigQuery.
     *
     * @param pipeline The pipeline
     * @return The data source
     */
    @Override
    protected PCollection<byte[]> applyReadSource(Pipeline pipeline) {

        final KafkaToBigQueryPipelineOptions options = pipeline
                .getOptions()
                .as(KafkaToBigQueryPipelineOptions.class);

        final PCollection<KV<String, byte[]>> values = pipeline
                .apply("Read From Kafka", KafkaIO.<String, byte[]>read()
                        .withBootstrapServers(options.getBootstrapServers())
                        .withTopic(options.getKafkaTopic())
                        .withValueDeserializerAndCoder(ByteArrayDeserializer.class, ByteArrayCoder.of())
                        .withKeyDeserializerAndCoder(StringDeserializer.class, StringUtf8Coder.of())
                        .withoutMetadata()
                );

        final PCollection<byte[]> bytes = values
                .apply("Convert to Byte array", Values.<byte[]>create());
        return bytes;
    }

    /**
     * The pipeline options.
     */
    public interface KafkaToBigQueryPipelineOptions extends StreamToBigQueryPipelineOptions {
        /** Option to set Avro schema.
         @Description("The Avro schema for Kafka).")
         void setAvroSourceSchema(String avroSrouceSchema);
         */
    }
}
