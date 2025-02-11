/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.google.cloud.pso;

import com.google.cloud.pso.coders.ErrorMessageCoder;
import com.google.cloud.pso.common.ErrorMessage;
import com.google.cloud.pso.common.ExtractKeyFn;
import com.google.cloud.pso.common.ExtractMetadata;
import com.google.cloud.pso.common.FailSafeValidate;
import com.google.cloud.pso.common.InsertMetadataFn;
import com.google.cloud.pso.options.IndexerOptions;
import com.google.common.base.Splitter;
import com.google.common.collect.Lists;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.PipelineResult;
import org.apache.beam.sdk.coders.CoderRegistry;
import org.apache.beam.sdk.io.elasticsearch.ElasticsearchIO;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.Flatten;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.windowing.AfterPane;
import org.apache.beam.sdk.transforms.windowing.GlobalWindows;
import org.apache.beam.sdk.transforms.windowing.Window;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollectionList;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.TupleTag;

/**
 * The {@link IndexerMain} pipeline is a streaming pipeline which demonstrates the process of
 * ingesting data in JSON format from Cloud Pub/Sub into an Elasticsearch index. The pipeline
 * validates the messages to confirm that it is a valid JSON and extracts the value of a user
 * specified field to be used as the document ID in Elasticsearch. The pipeline also demonstrates
 * how to enhance the documents with external data sitting in Cloud Bigtable prior to indexing it
 * into Elasticsearch.
 *
 * Note: The idField should be provided in {@link com.fasterxml.jackson.core.JsonPointer} syntax
 * e.g.: { "sku": 123}
 * will have an id field of: /sku
 *
 * <pre>
 * Build and execute:
 * mvn compile exec:java \
 * -Dexec.mainClass=com.google.cloud.pso.IndexerMain -Dexec.args=" \
 * --runner=DataflowRunner \
 * --project=[PROJECT_ID] \
 * --stagingLocation=[GCS_STAGING_LOCATION] \
 * --inputSubscription=[INPUT_PUBSUB_SUBSCRIPTION] \
 * --addresses=[ELASTIC_SEARCH_ADDRESSES_COMMA_SEPARATED] \
 * --idField=[ID_FIELD] \
 * --index=[INDEX_NAME] \
 * --type=[INDEX_TYPE] \
 * --rejectionTopic=[PUBSUB_TOPIC_FOR_REJECTED_MESSAGES] \
 * --instanceId=[BIGTABLE_INSTANCE_ID] \
 * --tableName=[BIGTABLE_TABLE_NAME] \
 * --columnFamily=[BIGTABLE_COLUMN_FAMILY] \
 * --columnQualifier=[BIGTABLE_COLUMN_QUALIFIER]"
 * </pre>
 */
public class IndexerMain {

  /**
   * {@link TupleTag> to tag succesfully validated
   * messages.
   */
  private static final TupleTag<KV<String, String>> VALIDATION_SUCCESS_TAG =
      new TupleTag<KV<String, String>>() {};

  /** {@link TupleTag} to tag messages where metadata is available and extracted. */
  private static final TupleTag<KV<String, Boolean>> METADATA_SUCCESS_TAG =
      new TupleTag<KV<String, Boolean>>() {};

  /**
   * {@link TupleTag> to tag failed messages.
   */
  private static final TupleTag<ErrorMessage> FAILURE_TAG = new TupleTag<ErrorMessage>() {};

  /**
   * Main entry point of the pipeline
   *
   * @param args The command-line args passed by the executor.
   */
  public static void main(String[] args) {
    IndexerOptions options =
        PipelineOptionsFactory.fromArgs(args).withValidation().as(IndexerOptions.class);

    run(options);
  }

  /**
   * Runs the pipeline to completion with the specified options.
   *
   * @param options The execution options.
   * @return The pipeline result.
   */
  private static PipelineResult run(IndexerOptions options) {
    Pipeline pipeline = Pipeline.create(options);

    // Set the CustomCoder for the ErrorMessage class.
    CoderRegistry coderRegistry = pipeline.getCoderRegistry();
    coderRegistry.registerCoderForClass(ErrorMessage.class, ErrorMessageCoder.of());

    String[] addresses =
        Lists.newArrayList(Splitter.on(",").trimResults().split(options.getAddresses()))
            .toArray(new String[0]);

    ElasticsearchIO.ConnectionConfiguration connection =
        ElasticsearchIO.ConnectionConfiguration.create(
            addresses, options.getIndex(), options.getType());

    /**
     * The pipeline executes the following steps: 1. Read messages as Strings from PubSub. 2.
     * Validate messages and tag them with success and failure tags. 3. Extract metadata for
     * successfully validated messages. 4. Apply metadata extract in the previous step. 5.
     * Successful messages are written to Elasticsearch index. 6. Failed messages (wrapped as
     * ErrorMessage objects) are written to a PubSub topic for rejected messages.
     */
    PCollectionTuple validated =
        pipeline
            // 1. Read messages as Strings from PubSub.
            .apply(
                "Read Messages from PubSub",
                PubsubIO.readStrings().fromSubscription(options.getInputSubscription()))

            // Note that streaming pipelines have GlobalWindows by default.
            // This explicit specification is meant to indicate that more
            // advanced windowing/triggering can be added to the pipeline as
            // needed.
            .apply(
                Window.<String>into(new GlobalWindows())
                    .triggering(AfterPane.elementCountAtLeast(1))
                    .discardingFiredPanes())

            // 2. Validate messages and tag them with success and failure tags.
            .apply(
                "Validate Messages",
                FailSafeValidate.newBuilder()
                    .withSuccessTag(VALIDATION_SUCCESS_TAG)
                    .withFailureTag(FAILURE_TAG)
                    .withKeyPath(options.getIdField())
                    .build());

    PCollectionTuple metadataApplied =
        validated
            .get(VALIDATION_SUCCESS_TAG)

            // 3. Extract metadata for successfully validated messages.
            .apply(
                "Extract Metadata",
                ExtractMetadata.newBuilder()
                    .withBigtableInstanceId(options.getInstanceId())
                    .withBigtableProjectId(options.getProject())
                    .withBigtableTableName(options.getTableName())
                    .withColumnFamily(options.getColumnFamily())
                    .withColumnQualifier(options.getColumnQualifier())
                    .withSuccessTag(METADATA_SUCCESS_TAG)
                    .withFailureTag(FAILURE_TAG)
                    .build());

    metadataApplied
        .get(METADATA_SUCCESS_TAG)

        // 4. Apply metadata extract in the previous step.
        .apply("Insert Metadata", ParDo.of(new InsertMetadataFn(options.getColumnQualifier())))

        // 5. Successful messages are written to Elasticsearch index.
        .apply(
            "Write to Elasticsearch Index",
            ElasticsearchIO.write()
                .withConnectionConfiguration(connection)
                .withIdFn(new ExtractKeyFn(options.getIdField()))
                .withUsePartialUpdate(true));

    PCollectionList.of(validated.get(FAILURE_TAG))
        .and(metadataApplied.get(FAILURE_TAG))

        // 6. Failed messages (wrapped as ErrorMessage objects) are written
        // to a PubSub topic for rejected messages.
        .apply("Flatten Failed Messages", Flatten.pCollections())
        .apply(
            "Write Failed Messages",
            PubsubIO.writeAvros(ErrorMessage.class).to(options.getRejectionTopic()));

    return pipeline.run();
  }
}
