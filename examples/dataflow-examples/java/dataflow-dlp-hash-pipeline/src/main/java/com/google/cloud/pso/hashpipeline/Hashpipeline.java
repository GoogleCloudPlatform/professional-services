/*
 * Copyright (C) 2020 Google Inc.
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

package com.google.cloud.pso.hashpipeline;

import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.PipelineResult;
import org.apache.beam.sdk.io.FileIO;
import org.apache.beam.sdk.io.fs.EmptyMatchTreatment;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubMessage;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.Validation.Required;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.TypeDescriptors;

public class Hashpipeline {
  public interface HashpipelineOptions extends PipelineOptions {
    @Description("The Pub/Sub subscription to read from. i.e projects/*/subscriptions/*")
    @Required
    String getInputSubscription();

    void setInputSubscription(String value);

    @Description("The Pub/Sub topic to write to.")
    @Required
    String getOutputTopic();

    void setOutputTopic(String value);

    @Description("The project where Firestore lives. This project will also be used for DLP")
    @Required
    String getFirestoreProject();

    void setFirestoreProject(String value);

    @Description("The Firestore collection name where hashed social security numbers live")
    @Required
    String getCollection();

    void setCollection(String value);

    @Description(
        "Fully qualified Secret Manager secret name where the hash key lives. ie. projects/*/secrets/*")
    @Required
    String getSecretName();

    void setSecretName(String value);

    @Description("Salt used for hashing")
    @Required
    String getSalt();

    void setSalt(String value);
  }

  public static void main(String[] args) {
    HashpipelineOptions options =
        PipelineOptionsFactory.fromArgs(args).withValidation().as(HashpipelineOptions.class);
    run(options);
  }

  public static PipelineResult run(HashpipelineOptions options) {
    // Create the pipeline
    Pipeline pipeline = Pipeline.create(options);

    pipeline
        .apply(
            "Read filename from Pubsub",
            PubsubIO.readMessagesWithAttributes().fromSubscription(options.getInputSubscription()))
        .apply(
            MapElements.into(TypeDescriptors.strings())
                .via(
                    (PubsubMessage msg) ->
                        String.format(
                            "gs://%s/%s",
                            msg.getAttribute("bucketId"), msg.getAttribute("objectId"))))
        .apply(
            "Match all files from Pubsub",
            FileIO.matchAll().withEmptyMatchTreatment(EmptyMatchTreatment.DISALLOW))
        .apply("Get a File Handle for GCS", FileIO.readMatches())
        .apply("Chunk file for DLP", ParDo.of(new ChunkFileDoFn()))
        .apply("Get DLP Findings", ParDo.of(new DLPFindingsDoFn(options.getFirestoreProject())))
        .apply(
            "Hash DLP Findings",
            ParDo.of(new HashQuotesDoFn(options.getSecretName(), options.getSalt())))
        .apply(
            "Match hashed finding",
            ParDo.of(new MatchHashDoFn(options.getFirestoreProject(), options.getCollection())))
        .apply("Convert to JSON", ParDo.of(new KVtoJSONDoFn()))
        .apply("WriteToPubsub", PubsubIO.writeStrings().to(options.getOutputTopic()));

    return pipeline.run();
  }
}
