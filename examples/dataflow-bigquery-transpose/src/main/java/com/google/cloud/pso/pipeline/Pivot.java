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

import static com.google.common.base.Preconditions.checkArgument;

import com.google.api.services.bigquery.model.TableReference;
import com.google.api.services.bigquery.model.TableRow;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.Schema;
import com.google.cloud.bigquery.Table;
import com.google.cloud.pso.common.PivotInputProvider;
import com.google.cloud.pso.common.PivotUtils;
import com.google.cloud.pso.transforms.PivotSchemaExtract;
import com.google.cloud.pso.transforms.TableRowPivot;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.base.Splitter;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import java.io.IOException;
import java.util.Map;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.PipelineResult;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryHelpers;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.Validation;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.View;
import org.apache.beam.sdk.util.Transport;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionView;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The {@link Pivot} pipeline is a sample pipeline that can transpose/pivot a BigQuery table based
 * on a user provided list of pivot fields and values.
 *
 * <p><b>Example Usage</b>
 *
 * <pre>
 * # Set the pipeline vars
 * PROJECT_ID=PROJECT_ID
 * PIPELINE_FOLDER=gs://PIPELINE_FOLDER/my-pipeline
 *
 * # Set the runner
 * RUNNER=DataflowRunner
 *
 * # Build the template
 * mvn compile exec:java \
 * -Dexec.mainClass=com.google.cloud.pso.pipeline.Pivot \
 * -Dexec.cleanupDaemonThreads=false \
 * -Dexec.args=" \
 * --project=${PROJECT_ID} \
 * --stagingLocation=${PIPELINE_FOLDER}/staging \
 * --tempLocation=${PIPELINE_FOLDER}/temp \
 * --runner=${RUNNER} \
 * --inputTableSpec=${PROJECT_ID}:my-dataset.my_input_table \
 * --outputTableSpec=${PROJECT_ID}:my-dataset.my_output_table \
 * --keyFields=c1,c2 \
 * --pivotFields=c3,c4 \
 * --valueFields=c5,c6"
 * </pre>
 */
public class Pivot {

  /*
   * The logger to output status messages to.
   */
  private static final Logger LOG = LoggerFactory.getLogger(Pivot.class);

  /**
   * The main entry-point for pipeline execution. This method will start the pipeline but will not
   * wait for it's execution to finish. If blocking execution is required, use the {@link
   * Pivot#run(PivotOptions)} method to start the pipeline and invoke {@code
   * result.waitUntilFinish()} on the {@link PipelineResult}.
   *
   * @param args The command-line args passed by the executor.
   */
  public static void main(String[] args) {

    PivotOptions pivotOptions = PipelineOptionsFactory.fromArgs(args).as(PivotOptions.class);

    run(pivotOptions);
  }

  /**
   * Runs the pipeline to completion with the specified pivotOptions. This method does not wait
   * until the pipeline is finished before returning. Invoke {@code result.waitUntilFinish()} on the
   * result object to block until the pipeline is finished running if blocking programmatic
   * execution is required.
   *
   * @param pivotOptions The execution pivotOptions.
   * @return The pipeline result.
   */
  public static PipelineResult run(PivotOptions pivotOptions) {

    final Splitter splitter = Splitter.on(',').trimResults();

    /*
     * Extract Schema from BigQuery based on the input tableSpec.
     */
    Schema schema = getSchema(pivotOptions.getInputTableSpec());
    LOG.info("Extracted input schema: " + schema.toString());

    PivotInputProvider inputProvider =
        PivotInputProvider.newBuilder()
            .withInputTableSchema(schema)
            .withKeyFieldNames(splitter.splitToList(pivotOptions.getKeyFields()))
            .withPivotFieldNames(splitter.splitToList(pivotOptions.getPivotFields()))
            .withValueFieldNames(splitter.splitToList(pivotOptions.getValueFields()))
            .build();

    // Create the pipeline
    Pipeline pipeline = Pipeline.create(pivotOptions);

    /*
     * Steps:
     *  1) Read TableRow records from input BigQuery table.
     *  2) Extract pivot schema from TableRow records.
     *  3) Convert to singleton view for sideInput.
     *  4) Create dynamic schema view for writing to output table.
     *  5) Pivot individual rows.
     *  6) Write to output BigQuery table.
     */

    PCollection<TableRow> inputTableRows =
        // 1) Read TableRow records from input BigQuery table.
        pipeline.apply(
            "Read BigQuery table",
            BigQueryIO.readTableRows().from(pivotOptions.getInputTableSpec()).withoutValidation());

    PCollection<Schema> pivotedSchema =
        // 2) Extract pivot schema from TableRow records.
        inputTableRows.apply(
            "Extract pivot schema",
            PivotSchemaExtract.newBuilder()
                .withPivotFieldsSchema(inputProvider.pivotFieldSchema())
                .withPivotValuesSchema(inputProvider.valueFieldSchema())
                .build());

    PCollectionView<Schema> pivotedSchemaView =
        // 3) Convert to singleton view for sideInput.
        pivotedSchema.apply("Convert to singleton view", View.asSingleton());

    PCollectionView<Map<String, String>> dynamicSchema =
        // 4) Create dynamic schema view for writing to output table.
        pivotedSchema
            .apply(
                "Convert dynamic schema map",
                ParDo.of(
                    new SchemaToMapFn(
                        pivotOptions.getOutputTableSpec(), inputProvider.keyFieldSchema())))
            .apply(View.asSingleton());

    inputTableRows
        // 5) Pivot individual rows.
        .apply(
            "Pivot individual records",
            TableRowPivot.newBuilder()
                .withPivotedSchema(pivotedSchemaView)
                .withKeySchema(inputProvider.keyFieldSchema())
                .withNonKeySchema(inputProvider.nonKeySchema())
                .withPivotFieldsSchema(inputProvider.pivotFieldSchema())
                .withPivotValuesSchema(inputProvider.valueFieldSchema())
                .build())

        // 6) Write to output BigQuery table.
        .apply(
            "Write to BigQuery table",
            BigQueryIO.writeTableRows()
                .to(pivotOptions.getOutputTableSpec())
                .withoutValidation()
                .withMethod(BigQueryIO.Write.Method.FILE_LOADS)
                .withCreateDisposition(BigQueryIO.Write.CreateDisposition.CREATE_IF_NEEDED)
                .withWriteDisposition(BigQueryIO.Write.WriteDisposition.WRITE_APPEND)
                .withSchemaFromView(dynamicSchema));

    return pipeline.run();
  }

  /**
   * Validate input tableSpec and return a {@link Schema}.
   *
   * @param tableSpec Input table spec - Should be in [project-id]:[dataset-id].[table_id] format.
   * @return {@link Schema} for the input table.
   */
  private static Schema getSchema(String tableSpec) {
    checkArgument(tableSpec != null, "getSchema(tableSpec) called with null input.");

    TableReference tableReference = BigQueryHelpers.parseTableSpec(tableSpec);

    BigQuery bigQuery = BigQueryOptions.getDefaultInstance().getService();
    Table table = bigQuery.getTable(tableReference.getDatasetId(), tableReference.getTableId());

    checkArgument(
        table != null && table.getDefinition() != null && table.getDefinition().getSchema() != null,
        "Invalid tableSpec or table does not exist: " + tableSpec);

    return table.getDefinition().getSchema();
  }

  /**
   * The {@link PivotOptions} class provides the custom execution options passed by the executor at
   * the command-line.
   */
  public interface PivotOptions extends PipelineOptions {

    @Description("Table spec to read input from.")
    @Validation.Required
    String getInputTableSpec();

    void setInputTableSpec(String tableSpec);

    @Description("Table spec to write transposed output to.")
    @Validation.Required
    String getOutputTableSpec();

    void setOutputTableSpec(String tableSpec);

    @Description("Comma separated list of key field names.")
    @Validation.Required
    String getKeyFields();

    void setKeyFields(String keyFields);

    @Description("Comma separated list of pivot field names.")
    @Validation.Required
    String getPivotFields();

    void setPivotFields(String pivotFields);

    @Description("Comma separated list of value field names.")
    @Validation.Required
    String getValueFields();

    void setValueFields(String valueFields);
  }

  /**
   * A {@link DoFn} that combines a {@link Schema} with a static input {@link Schema} and creates a
   * {@link Map} with key: BigQuery tableSpec and value: {@link TableSchema} object.
   */
  @VisibleForTesting
  static class SchemaToMapFn extends DoFn<Schema, Map<String, String>> {

    private String outputSpec;
    private Schema keySchema;

    SchemaToMapFn(String outputSpec, Schema keySchema) {
      this.outputSpec = outputSpec;
      this.keySchema = keySchema;
    }

    @ProcessElement
    public void apply(ProcessContext context) {
      Schema pivotSchema = context.element();

      Schema fullSchema =
          PivotUtils.mergeSchemasWithoutSort(ImmutableList.of(keySchema, pivotSchema));

      TableSchema tableSchema = PivotUtils.toTableSchema(fullSchema);
      String jsonSchema;
      try {
        jsonSchema = Transport.getJsonFactory().toString(tableSchema);
      } catch (IOException e) {
        throw new RuntimeException(e);
      }
      LOG.info(this.outputSpec + " has schema: " + jsonSchema);
      context.output(ImmutableMap.of(this.outputSpec, jsonSchema));
    }
  }
}
