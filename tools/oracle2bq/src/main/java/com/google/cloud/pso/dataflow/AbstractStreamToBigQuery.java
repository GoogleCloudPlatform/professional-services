package com.google.cloud.pso.dataflow;

import com.google.api.services.bigquery.model.TableReference;
import com.google.api.services.bigquery.model.TableRow;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.cloud.pso.bigquery.TableRowWithSchema;
import com.google.cloud.pso.bigquery.TableRowWithSchemaCoder;
import com.google.cloud.pso.dataflow.options.StreamToBigQueryPipelineOptions;
import com.google.cloud.pso.dataflow.transform.BigQuerySchemaMutator;
import com.google.cloud.pso.dataflow.transform.CollectLatestData;
import com.google.cloud.pso.dataflow.transform.GenericRecordToTableRow;
import com.google.common.flogger.FluentLogger;
import java.io.Serializable;
import java.util.List;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.PipelineResult;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryInsertError;
import org.apache.beam.sdk.io.gcp.bigquery.InsertRetryPolicy;
import org.apache.beam.sdk.io.gcp.bigquery.WriteResult;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.View;
import org.apache.beam.sdk.transforms.windowing.AfterProcessingTime;
import org.apache.beam.sdk.transforms.windowing.FixedWindows;
import org.apache.beam.sdk.transforms.windowing.Repeatedly;
import org.apache.beam.sdk.transforms.windowing.Window;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionView;
import org.joda.time.Duration;


/**
 * Base class for streaming data, extracted from a messaging source, into BigQuery.
 * <br/><br/>
 * For example, streaming data received from:
 * <ul>
 * <li>Kafka</li>
 * <li>Pub/Sub</li>
 * </ul>
 */
public abstract class AbstractStreamToBigQuery implements Serializable {

    protected static final FluentLogger LOGGER = FluentLogger.forEnclosingClass();

    /**
     * Builds & runs the pipeline, using the provided options.
     * <br/><br/>
     * This method <b>does not</b> wait until the pipeline is finished before returning.
     *
     * @param options The options to build the pipeline
     * @return The {@link PipelineResult pipeline result}
     */
    public PipelineResult run(StreamToBigQueryPipelineOptions options) {
        LOGGER.atInfo().log("Creating pipeline with %s", options);

        final Pipeline pipeline = Pipeline.create(options);

        TableRowWithSchemaCoder.registerCoder(pipeline);

        final PCollection<byte[]> sourceData = applyReadSource(pipeline);

        final PCollection<byte[]> windowedData = applyWindowing(pipeline, sourceData);

        final PCollection<TableRowWithSchema> incomingRecords = applyTransformations(pipeline, windowedData);

        applyWriteData(pipeline, incomingRecords);

        return pipeline.run();
    }

    /**
     * Applies read source to the pipeline to begin streaming into BigQuery.
     *
     * @param pipeline The pipeline
     * @return The data source
     */
    protected abstract PCollection<byte[]> applyReadSource(Pipeline pipeline);

    /**
     * Applies a {@link Window window} to the data source.
     *
     * @param sourceData The data extracted from the source
     * @return The data from a specified window (i.e. a fixed duration)
     */
    protected PCollection<byte[]> applyWindowing(Pipeline pipeline, PCollection<byte[]> sourceData) {
        final StreamToBigQueryPipelineOptions options = pipeline
                .getOptions()
                .as(StreamToBigQueryPipelineOptions.class);

        return sourceData.apply("MainWindow", Window.<byte[]>into(FixedWindows
                .of(Duration.standardSeconds(options.getWindowingDuration())))
                .triggering(AfterProcessingTime.pastFirstElementInPane())
                .withAllowedLateness(Duration.ZERO)
                .discardingFiredPanes());
    }

    /**
     * Applies the data transformations to the data, prior to being written into BigQuery.
     *
     * @param sourceData The data extracted from the source
     * @return The transformed data
     */
    protected PCollection<TableRowWithSchema> applyTransformations(Pipeline pipeline, PCollection<byte[]> sourceData) {
        final PCollection<KV<byte[], String>> latestElements = sourceData.apply(new CollectLatestData());
        LOGGER.atInfo().log("applyTransformations latestElements " + latestElements);
        final PCollectionView<KV<byte[], String>> latestElementView = latestElements.apply("ConvertLatestElementToSingleton", View.asSingleton());

        if (latestElementView == null) {
            LOGGER.atInfo().log("latestElementView is null ");
        }

        return sourceData.apply("ConvertSourceToTableRow",
                ParDo.of(GenericRecordToTableRow.builder()
                        .latestElementSideInput(latestElementView)
                        .build())
                        .withSideInputs(latestElementView));
    }

    /**
     * Applies the write data to BigQuery.
     *
     * @param pipeline The pipeline
     * @param values   The data to write to BigQuery
     */
    protected void applyWriteData(Pipeline pipeline, PCollection<TableRowWithSchema> values) {
        final StreamToBigQueryPipelineOptions options = pipeline
                .getOptions()
                .as(StreamToBigQueryPipelineOptions.class);

        TableReference tablespec = new TableReference().setProjectId(options.getProject()).setDatasetId(options.getBqDataset().toString()).setTableId(options.getBqTable().toString());

        PCollection<TableRowWithSchema> val = values.apply("Get schema", ParDo.of(new DoFn<TableRowWithSchema, TableRowWithSchema>() {
            @ProcessElement
            public void processElement(ProcessContext context) {
                TableRowWithSchema schemaAndData = (TableRowWithSchema) context.element();
                TableSchema schema = schemaAndData.getTableSchema();
                TableRow tableRow = schemaAndData.getTableRow();

                LOGGER.atInfo().log("values get schema " + schema);
                LOGGER.atInfo().log("values get tablerow " + tableRow);
                context.output(schemaAndData);

            }
        }));

        WriteResult writeResult = values.apply("WriteData", BigQueryIO.<TableRowWithSchema>write().to(tablespec)
                .withFormatFunction(TableRowWithSchema::getTableRow)
                .withMethod(BigQueryIO.Write.Method.STREAMING_INSERTS)
                .withCreateDisposition(BigQueryIO.Write.CreateDisposition.CREATE_NEVER)
                .withWriteDisposition(BigQueryIO.Write.WriteDisposition.WRITE_APPEND)
                .withExtendedErrorInfo()
                .withFailedInsertRetryPolicy(InsertRetryPolicy.retryTransientErrors()));

        // Create side-input to join records with their incoming schema.
        PCollectionView<List<TableRowWithSchema>> incomingRecordsView =
                values.apply("CreateView", View.asList());


        PCollection<TableRowWithSchema> failedRows = writeResult
                .getFailedInsertsWithErr()
                .apply("RetryFailedInsertWindow", Window.<BigQueryInsertError>into(FixedWindows
                        .of(Duration.standardSeconds(1)))
                        .triggering(Repeatedly
                                .forever(AfterProcessingTime.pastFirstElementInPane())))
                .apply("MutateSchema", BigQuerySchemaMutator.mutateWithSchema(
                        incomingRecordsView, options.getRetryFailedInsertDelay()));
        failedRows.apply("RetryWriteMutatedRows", BigQueryIO.<TableRowWithSchema>write().to(tablespec)
                .withFormatFunction(TableRowWithSchema::getTableRow)
                .withCreateDisposition(BigQueryIO.Write.CreateDisposition.CREATE_NEVER)
                .withWriteDisposition(BigQueryIO.Write.WriteDisposition.WRITE_APPEND));

        failedRows.apply("TableRowWithSchemaToString", ParDo.of(new DoFn<TableRowWithSchema, String>() {
            @ProcessElement
            public void processElement(ProcessContext context) {
                context.output(context.element().toString());
            }
        })).apply("WritingToGCS", TextIO.write().to(options.getFileOutput() + "failedInserts").withWindowedWrites().withNumShards(1));
    }
}

