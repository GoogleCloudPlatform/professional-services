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

import com.google.api.services.bigquery.model.TableRow;
import com.google.cloud.pso.Employee;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.PipelineResult;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.io.gcp.bigquery.InsertRetryPolicy;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.Validation;

/**
 * The {@link IngestionMain} is a sample pipeline that demonstrates how a Dataflow pipeline can read
 * Avro records from Pub/Sub and stream those records into a BigQuery table.
 *
 * <p><b>Pipeline Requirements</b>
 *
 * <ul>
 *   <li>An existing Cloud Pub/Sub subscription to read Avro records from.
 *   <li>An existing BigQuery table to stream Avro records into.
 * </ul>
 *
 * <p><b>Example Usage</b>
 *
 * <pre>
 * # Set the pipeline vars
 * PROJECT_ID=project_id
 * DATAFLOW_GCS_BUCKET=dataflow_gcs_bucket
 * PIPELINE_FOLDER=gs://${DATAFLOW_GCS_BUCKET}/dataflow/pipelines/ingestion-main
 *
 * # Set the runner
 * RUNNER=DataflowRunner
 *
 * # Additional parameters
 * MAX_NUM_WORKERS=max_workers
 * INPUT_PUBSUB_SUBSCRIPTION=input_pubsub_subscription
 * OUTPUT_BIGQUERY_TABLE=output_bigquery_table
 *
 * # Build the template
 * mvn compile exec:java \
 * -Dexec.mainClass=com.google.cloud.pso.pipeline.IngestionMain \
 * -Dexec.cleanupDaemonThreads=false \
 * -Dexec.args=" \
 * --project=${PROJECT_ID} \
 * --stagingLocation=${PIPELINE_FOLDER}/staging \
 * --tempLocation=${PIPELINE_FOLDER}/temp \
 * --runner=${RUNNER} \
 * --autoscalingAlgorithm=THROUGHPUT_BASED \
 * --maxNumWorkers=${MAX_NUM_WORKERS} \
 * --subscription=${INPUT_PUBSUB_SUBSCRIPTION} \
 * --tableId=${OUTPUT_BIGQUERY_TABLE}
 * </pre>
 */
public class IngestionMain {

  /**
   * The {@link Options} class provides the custom execution options passed by the executor at the
   * command-line.
   */
  public interface Options extends PipelineOptions {

    @Description(
        "The Cloud Pub/Sub subscription to consume from. "
            + "The name should be in the format of "
            + "projects/<project-id>/subscriptions/<subscription-name>.")
    @Validation.Required
    String getSubscription();

    void setSubscription(String subscription);

    @Description("The output BigQuery table in <project-id>:<dataset>.<table> " + "format.")
    @Validation.Required
    String getTableId();

    void setTableId(String tableId);
  }

  /**
   * The main entry-point for pipeline execution. This method will start the pipeline but will not
   * wait for it's execution to finish. If blocking execution is required, use the {@link
   * IngestionMain#run(Options)} method to start the pipeline and invoke {@code
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
     *  1) Read from Pub/Sub
     *  2) Stream into BigQuery
     */
    pipeline
        // 1) Read from Pub/Sub
        .apply(
            "Read Avro records from Pub/Sub",
            PubsubIO.readAvros(Employee.class).fromSubscription(options.getSubscription()))

        // 2) Stream into BigQuery
        .apply(
            "Stream into BigQuery",
            BigQueryIO.<Employee>write()
                .to(options.getTableId())
                .withWriteDisposition(BigQueryIO.Write.WriteDisposition.WRITE_APPEND)
                .withCreateDisposition(BigQueryIO.Write.CreateDisposition.CREATE_NEVER)
                .withMethod(BigQueryIO.Write.Method.STREAMING_INSERTS)
                .withFailedInsertRetryPolicy(InsertRetryPolicy.retryTransientErrors())
                .withFormatFunction(
                    e -> new TableRow().set("name", e.getName()).set("id", e.getId())));

    return pipeline.run();
  }
}
