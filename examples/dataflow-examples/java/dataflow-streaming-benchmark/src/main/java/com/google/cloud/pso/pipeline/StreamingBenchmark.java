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

package com.google.cloud.pso.pipeline;

import com.github.vincentrussell.json.datagenerator.JsonDataGenerator;
import com.github.vincentrussell.json.datagenerator.JsonDataGeneratorException;
import com.github.vincentrussell.json.datagenerator.impl.JsonDataGeneratorImpl;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Maps;
import com.google.common.io.ByteStreams;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.nio.channels.WritableByteChannel;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.PipelineResult;
import org.apache.beam.sdk.io.FileSystems;
import org.apache.beam.sdk.io.GenerateSequence;
import org.apache.beam.sdk.io.fs.MatchResult.Metadata;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubMessage;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.Validation.Required;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.joda.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The {@link StreamingBenchmark} is a streaming pipeline which generates messages at a specified
 * rate to a Pub/Sub topic. The messages are generated according to a schema template which
 * instructs the pipeline how to populate the messages with fake data compliant to constraints.
 *
 * <p>The number of workers executing the pipeline must be large enough to support the supplied QPS.
 * Use a general rule of 2,500 QPS per core in the worker pool.
 *
 * <p>See <a href="https://github.com/vincentrussell/json-data-generator">json-data-generator</a>
 * for instructions on how to construct the schema file.
 *
 * <p><b>Pipeline Requirements</b>
 *
 * <ul>
 *   <li>The schema file exists.
 *   <li>The Pub/Sub topic exists.
 * </ul>
 *
 * <p><b>Example Usage</b>
 *
 * <pre>
 * # Set the pipeline vars
 * PROJECT_ID=<project-id>
 * BUCKET=<bucket>
 * PIPELINE_FOLDER=gs://${BUCKET}/dataflow/pipelines/streaming-benchmark
 *
 * # Set the runner
 * RUNNER=DataflowRunner
 *
 * # Build the template
 * mvn compile exec:java \
 *  * -Dexec.mainClass=com.google.cloud.pso.pipeline.StreamingBenchmark \
 *  * -Dexec.cleanupDaemonThreads=false \
 *  * -Dexec.args=" \
 *  * --project=${PROJECT_ID} \
 *  * --stagingLocation=${PIPELINE_FOLDER}/staging \
 *  * --tempLocation=${PIPELINE_FOLDER}/temp \
 *  * --runner=${RUNNER} \
 *  * --zone=us-east1-d \
 *  * --autoscalingAlgorithm=THROUGHPUT_BASED \
 *  * --maxNumWorkers=5 \
 *  * --qps=50000 \
 *  * --validateSchema=true \
 *  * --schemaLocation=gs://<bucket>/<path>/<to>/game-event-schema \
 *  * --topic=projects/<project-id>/topics/<topic-id>"
 * </pre>
 */
public class StreamingBenchmark {

  private static final Logger LOG = LoggerFactory.getLogger(StreamingBenchmark.class);
  private static final ImmutableList<String> ATTRIBUTES_SCHEMA_FIELDS =
      ImmutableList.of("eventid", "eventtimestamp");

  /**
   * The {@link Options} class provides the custom execution options passed by the executor at the
   * command-line.
   */
  public interface Options extends PipelineOptions {
    @Description("The QPS which the benchmark should output to Pub/Sub.")
    @Required
    Long getQps();

    void setQps(Long value);

    @Description("The path to the schema to generate.")
    @Required
    String getSchemaLocation();

    void setSchemaLocation(String value);

    @Description("The path to the schema to generate.")
    @Required
    @Default.Boolean(true)
    Boolean getValidateSchema();

    void setValidateSchema(Boolean value);

    @Description("The Pub/Sub topic to write to.")
    @Required
    String getTopic();

    void setTopic(String value);
  }

  /** Class {@link MalformedSchemaException} captures json schema syntax related exceptions */
  static class MalformedSchemaException extends Exception {

    public MalformedSchemaException(String message) {
      super(message);
    }
  }

  /**
   * The main entry-point for pipeline execution. This method will start the pipeline but will not
   * wait for it's execution to finish. If blocking execution is required, use the {@link
   * StreamingBenchmark#run(Options)} method to start the pipeline and invoke {@code
   * result.waitUntilFinish()} on the {@link PipelineResult}.
   *
   * @param args The command-line args passed by the executor.
   */
  public static void main(String[] args) {
    Options options = PipelineOptionsFactory.fromArgs(args).withValidation().as(Options.class);
    run(options);
  }

  /**
   * Runs the pipeline to completion with the specified options. This method does not wait until the
   * pipeline is finished before returning. Invoke {@code result.waitUntilFinish()} on the result
   * object to block until the pipeline is finished running if blocking programmatic execution is
   * required.
   *
   * @param options The execution options.
   * @return The pipeline result.
   */
  public static PipelineResult run(Options options) {

    // Create the pipeline
    Pipeline pipeline = Pipeline.create(options);

    /*
     * Steps:
     *  1) Trigger at the supplied QPS
     *  2) Generate messages containing fake data
     *  3) Write messages to Pub/Sub
     */
    pipeline
        .apply(
            "Trigger",
            GenerateSequence.from(0L).withRate(options.getQps(), Duration.standardSeconds(1L)))
        .apply(
            "GenerateMessages",
            ParDo.of(
                new MessageGeneratorFn(options.getSchemaLocation(), options.getValidateSchema())))
        .apply("WriteToPubsub", PubsubIO.writeMessages().to(options.getTopic()));

    return pipeline.run();
  }

  /**
   * The {@link MessageGeneratorFn} class generates {@link PubsubMessage} objects from a supplied
   * schema and populating the message with fake data.
   *
   * <p>See <a href="https://github.com/vincentrussell/json-data-generator">json-data-generator</a>
   * for instructions on how to construct the schema file.
   */
  static class MessageGeneratorFn extends DoFn<Long, PubsubMessage> {

    private final String schemaLocation;
    private String schema;
    private List<String> attributeFields = new ArrayList<>();
    private final boolean shouldValidateSchema;
    private boolean includeAttributeValues = false;

    private JsonParser jsonParser;

    // Not initialized inline or constructor because {@link JsonDataGenerator} is not serializable.
    private transient JsonDataGenerator dataGenerator;

    MessageGeneratorFn(String schemaLocation, boolean shouldValidateSchema) {
      this.schemaLocation = schemaLocation;
      this.shouldValidateSchema = shouldValidateSchema;
    }

    // Leave the scope as package private since its referred inside test methods for assertions
    @VisibleForTesting
    List<String> getAttributeFields() {
      return this.attributeFields;
    }

    /**
     * Validate Schema and checks for presence of attribute schema fields
     *
     * @param dataGenerator The execution options.
     * @param schema The execution options.
     * @throws IOException, MalformedSchemaException
     */
    private void validateSchema(JsonDataGenerator dataGenerator, String schema)
        throws IOException, MalformedSchemaException {

      String payload;
      JsonObject jsonObject;

      try {
        // Generate sample message based on the provided schema.
        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream()) {
          dataGenerator.generateTestDataJson(schema, byteArrayOutputStream);
          payload = byteArrayOutputStream.toString();
        }

        LOG.info("Validating sample message: {}", payload);
        jsonObject = new JsonParser().parse(payload).getAsJsonObject();
      } catch (JsonDataGeneratorException | JsonSyntaxException ex) {
        throw new MalformedSchemaException(
            String.format("Invalid schema format. Error:%s ", ex.getMessage()));
      }

      for (Map.Entry<String, JsonElement> property : jsonObject.entrySet()) {
        if (ATTRIBUTES_SCHEMA_FIELDS.contains(property.getKey().toLowerCase())) {
          this.attributeFields.add(property.getKey());
        }
      }

      // Set these attributes appropriately to minimize per element processing costs inside the
      // process method
      this.includeAttributeValues = this.attributeFields.size() > 0;
      this.jsonParser = this.includeAttributeValues ? new JsonParser() : null;
    }

    @Setup
    public void setup() throws IOException, MalformedSchemaException {
      dataGenerator = new JsonDataGeneratorImpl();
      Metadata metadata = FileSystems.matchSingleFileSpec(schemaLocation);

      // Copy the schema file into a string which can be used for generation.
      try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream()) {
        try (ReadableByteChannel readerChannel = FileSystems.open(metadata.resourceId())) {
          try (WritableByteChannel writerChannel = Channels.newChannel(byteArrayOutputStream)) {
            ByteStreams.copy(readerChannel, writerChannel);
          }
        }

        schema = byteArrayOutputStream.toString();
        if (this.shouldValidateSchema) {
          this.validateSchema(dataGenerator, schema);
        }
      }
    }

    @ProcessElement
    public void processElement(ProcessContext context)
        throws IOException, JsonDataGeneratorException {

      byte[] payload;
      Map<String, String> attributes = Maps.newHashMap();
      // Generate the fake JSON according to the schema.
      try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream()) {
        dataGenerator.generateTestDataJson(schema, byteArrayOutputStream);
        payload = byteArrayOutputStream.toByteArray();
      }

      if (this.includeAttributeValues) {
        // Build a json Object, extract fields and include them in attributes
        JsonObject jsonObject =
            this.jsonParser.parse(new String(payload, StandardCharsets.UTF_8)).getAsJsonObject();
        for (String field : attributeFields) {
          attributes.put(field, jsonObject.get(field).getAsString());
        }
      }

      context.output(new PubsubMessage(payload, attributes));
    }
  }
}
