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

package com.google.cloud.pso.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.bigtable.v2.Mutation;
import com.google.cloud.pso.coders.JsonNodeCoder;
import com.google.cloud.pso.options.BigtableOptions;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.ImmutableList;
import com.google.protobuf.ByteString;
import java.io.IOException;
import java.util.Random;
import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.PipelineResult;
import org.apache.beam.sdk.io.Compression;
import org.apache.beam.sdk.io.FileIO;
import org.apache.beam.sdk.io.fs.EmptyMatchTreatment;
import org.apache.beam.sdk.io.gcp.bigtable.BigtableIO;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.Validation;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.hadoop.hbase.util.Bytes;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * A utility Dataflow pipeline to generate sample products data available at
 * https://github.com/BestBuyAPIs/open-data-set/products.json.
 *
 * <p>Requirements: 1. Copy the products.json.gz file in a GCS bucket. 2. Create a Bigtable instance
 * and table with a column family to stage the metadata for the demo. 3. Create a PubSub topic to
 * publish product JSONs to.
 *
 * <p>Note: The idField should be provided in {@link com.fasterxml.jackson.core.JsonPointer} syntax
 * e.g.: { "sku": 123} will have an id field of: /sku
 *
 * <pre>
 * Build and execute:
 * mvn compile exec:java -Dexec.mainClass=com.google.cloud.pso.utils.PublishProducts -Dexec.args=" \
 * --runner=DataflowRunner \
 * --project=[PROJECT_ID] \
 * --stagingLocation=[GCS_STAGING_LOCATION \
 * --input=[INPUT_GCS_BUCKET_FOR_PRODUCTS_DATA] \
 * --idField=[ID_FIELD] \
 * --topic=[OUTPUT_PUBSUB_TOPIC] \
 * --instanceId=[BIGTABLE_INSTANCE_ID] \
 * --tableName=[BIGTABLE_TABLE_NAME] \
 * --columnFamily=[BIGTABLE_COLUMN_FAMILY] \
 * --columnQualifier=[BIGTABLE_COLUMN_QUALIFIER]"
 * </pre>
 */
public class PublishProducts {

  /**
   * Main entry point for executing the pipeline.
   *
   * @param args The command-line arguments to the pipeline.
   */
  public static void main(String[] args) {
    PublishProductsOptions options =
        PipelineOptionsFactory.fromArgs(args).withValidation().as(PublishProductsOptions.class);

    run(options);
  }

  /**
   * Runs the pipeline with the supplied options
   *
   * @param options The execution parameters to the pipeline.
   * @return The result of the pipeline execution.
   */
  private static PipelineResult run(PublishProductsOptions options) {
    // Create the pipeline
    Pipeline pipeline = Pipeline.create(options);

    // Set coder for JsonNode
    pipeline.getCoderRegistry().registerCoderForClass(JsonNode.class, JsonNodeCoder.of());

    /**
     * Steps: 1) Create a filepattern based on the input GCS path. 2) Match the file pattern and
     * read the matched patterns. 3) Read files, one per {@link ParDo} as the json messages are not
     * line delimited. The {@link DoFn} implementation generates a separate json message for every
     * product. 4) Read the product jsons and generate {@link Mutation} using {@link
     * JsonToMutationFn} 5) Write to Bigtable 6) Publish to a PubSub topic.
     */
    PCollection<JsonNode> jsonNodes =
        pipeline
            // 1) Create a filepattern based on the input GCS path.
            .apply("Create Filepattern", Create.of(options.getInput()))

            // 2) Match the file pattern and read the
            //    matched patterns.
            .apply(FileIO.matchAll().withEmptyMatchTreatment(EmptyMatchTreatment.DISALLOW))
            .apply(FileIO.readMatches().withCompression(Compression.AUTO))

            // 3) Read files, one per {@link ParDo} as the json
            //    messages are not line delimited.
            //    The {@link DoFn} implementation generates a
            //    separate json message for every product.
            .apply(
                "Parse and Extract",
                ParDo.of(
                    new DoFn<FileIO.ReadableFile, JsonNode>() {
                      @ProcessElement
                      public void processElement(ProcessContext context) throws IOException {
                        FileIO.ReadableFile readableFile = context.element();
                        String raw = readableFile.readFullyAsUTF8String();
                        JSONArray jsonArray = new JSONArray(raw);
                        final ObjectMapper mapper = new ObjectMapper();
                        jsonArray.forEach(
                            obj -> {
                              JSONObject jsonObject = (JSONObject) obj;
                              try {
                                context.output(mapper.readTree(jsonObject.toString()));
                              } catch (IOException e) {
                                throw new RuntimeException(e);
                              }
                            });
                      }
                    }));

    jsonNodes
        // 4) Read the product jsons and generate {@link Mutation}
        //    using {@link JsonToMutationFn}
        .apply(
            "Create Mutation",
            ParDo.of(
                new JsonNodeToMutationFn(
                    options.getColumnFamily(), options.getColumnQualifier(), options.getIdField())))

        // 5) Write to Bigtable
        .apply(
            "Write to Bigtable",
            BigtableIO.write()
                .withProjectId(options.getProject())
                .withInstanceId(options.getInstanceId())
                .withTableId(options.getTableName()));

    jsonNodes
        .apply(
            "Convert JsonNode to Strings",
            ParDo.of(
                new DoFn<JsonNode, String>() {
                  private final ObjectMapper MAPPER = new ObjectMapper();

                  @ProcessElement
                  public void processElement(ProcessContext context)
                      throws JsonProcessingException {
                    context.output(
                        MAPPER
                            .writerWithDefaultPrettyPrinter()
                            .writeValueAsString(context.element()));
                  }
                }))
        // 6) Publish to a PubSub topic.
        .apply("Publish to PubSub", PubsubIO.writeStrings().to(options.getTopic()));

    return pipeline.run();
  }

  /** Options used by the Dataflow Pipeline. */
  @VisibleForTesting
  protected interface PublishProductsOptions extends DataflowPipelineOptions, BigtableOptions {

    @Description(
        "The Cloud Pub/Sub topic to publish product messages to. "
            + "The name should be in the format of "
            + "projects/<project-id>/topics/<topic-name>.")
    @Validation.Required
    String getTopic();

    void setTopic(String topic);

    @Description(
        "GCS path for the input file that needs to be processed."
            + " In addition to uncompressed files, the following file"
            + " types are supported: bzip2, gzip, zip, deflate."
            + " e.g. gs://my-input-bucket/input/some_input.json")
    @Validation.Required
    String getInput();

    void setInput(String input);

    @Description("ID key to be extracted from the JSON.")
    @Validation.Required
    String getIdField();

    void setIdField(String idKey);
  }

  /**
   * A utility {@link DoFn} implementation that takes a JsonNode wrapped product message and
   * performs the following actions: 1. Extract the sku field to be used as a row key. 2. Generate a
   * random boolean value to be used for the in_stock column associated with the sku 3. Generate the
   * appropriate {@link Mutation} used by {@link BigtableIO}
   */
  @VisibleForTesting
  protected static class JsonNodeToMutationFn
      extends DoFn<JsonNode, KV<ByteString, Iterable<Mutation>>> {
    private String columnFamily;
    private String columnQualifier;
    private String idKey;

    public JsonNodeToMutationFn(String columnFamily, String columnQualifier, String idKey) {
      this.columnFamily = columnFamily;
      this.columnQualifier = columnQualifier;
      this.idKey = idKey;
    }

    @ProcessElement
    public void processElement(ProcessContext context) throws IOException {
      JsonNode jsonNode = context.element();

      if (jsonNode.at(idKey).isMissingNode()) {
        throw new RuntimeException("Missing id key: " + idKey);
      }

      byte[] key = Bytes.toBytes(jsonNode.at(idKey).asLong());

      Mutation mutation =
          Mutation.newBuilder()
              .setSetCell(
                  Mutation.SetCell.newBuilder()
                      .setFamilyName(columnFamily)
                      .setColumnQualifier(ByteString.copyFromUtf8(columnQualifier))
                      .setValue(ByteString.copyFrom(Bytes.toBytes(new Random().nextBoolean())))
                      .build())
              .build();

      Iterable<Mutation> mutations = ImmutableList.of(mutation);
      context.output(KV.of(ByteString.copyFrom(key), mutations));
    }
  }
}
