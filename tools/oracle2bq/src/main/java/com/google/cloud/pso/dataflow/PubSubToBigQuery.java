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
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubMessage;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.ValueProvider;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;

/**
 * This pipeline reads data from Pub/Sub and writes to BigQuery.
 */
public class PubSubToBigQuery extends AbstractStreamToBigQuery {

    public static void main(String[] args) {
        PipelineOptionsFactory.register(PubSubToBigQueryPipelineOptions.class);

        final PubSubToBigQueryPipelineOptions options = PipelineOptionsFactory.fromArgs(args)
                .withValidation()
                .as(PubSubToBigQueryPipelineOptions.class);
        new PubSubToBigQuery().run(options);
    }

    /**
     * Applies read source to the pipeline to begin streaming into BigQuery.
     *
     * @param pipeline The pipeline
     * @return The data source
     */
    @Override
    protected PCollection<byte[]> applyReadSource(Pipeline pipeline) {
        final PubSubToBigQueryPipelineOptions options = pipeline
                .getOptions()
                .as(PubSubToBigQueryPipelineOptions.class);

        final PCollection<PubsubMessage> messages = pipeline
                .apply(
                        "Read from Pub/Sub",
                        PubsubIO
                                .readMessagesWithAttributes()
                                .fromSubscription(options.getSubscription()));

        final PCollection<byte[]> bytes = messages.apply(
                "Extract data as bytes",
                ParDo.of(new DoFn<PubsubMessage, byte[]>() {
                    @ProcessElement
                    public void processElement(ProcessContext context) {
                        final PubsubMessage message = context.element();
                        context.output(message.getPayload());
                    }
                }));
        return bytes;
    }

    /**
     * The pipeline options.
     */
    public interface PubSubToBigQueryPipelineOptions extends StreamToBigQueryPipelineOptions {
        /**
         * Option to set the subscription ID to subscribe to.
         */
        @Description("Pub/Sub subscription ID")
        ValueProvider<String> getSubscription();

        void setSubscription(ValueProvider<String> subscriptionId);
    }
}
