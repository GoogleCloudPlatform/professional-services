/*
 * Copyright (C) 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.google.cloud.pso.pipeline;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.api.services.bigquery.model.TableRow;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.cloud.bigquery.BigQueryException;
import com.google.cloud.pso.transforms.JsonEventMatcher;
import com.google.cloud.pso.transforms.JsonSchemaExist;
import com.google.cloud.pso.transforms.ReadPubSub;
import com.google.cloud.pso.util.BQDatasetSchemas;
import com.google.cloud.pso.util.BigQueryConverters;
import com.google.cloud.pso.util.Constants;
import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO.Write.CreateDisposition;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO.Write.WriteDisposition;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryOptions;
import org.apache.beam.sdk.io.gcp.bigquery.DynamicDestinations;
import org.apache.beam.sdk.io.gcp.bigquery.InsertRetryPolicy;
import org.apache.beam.sdk.io.gcp.bigquery.TableDestination;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.Validation.Required;
import org.apache.beam.sdk.options.ValueProvider;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.TupleTagList;
import org.apache.beam.sdk.values.ValueInSingleWindow;
import org.joda.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Main code to allow reading data from pubsub to dataflow (stream) and ingested it to BigQuery
 * table.
 *
 * <p>The program constantly wait for a pubsub push and read the streaming data to be inserted to
 * BigQuery table.
 *
 * <p>The program will read of determine which kind of event message it is, and insert the table
 * based on the event message. Mostly used to read off the activstat log server request and append
 * the result to BigQuery table
 *
 * <p>To run this starter example using managed resource in Google Cloud Platform, you should
 * specify the following command-line options: --project=<YOUR_PROJECT_ID>
 * --pubsubSubscription=projects/<YOUR_PROJECT_ID>/subscriptions/<YOUR_PUBSUB_SUBSCRIPTION>
 * --dataset=<YOUR_BIGQUERY_DATASET_NAME> --stagingLocation=<STAGING_LOCATION_IN_CLOUD_STORAGE>
 * --runner=DataflowRunner
 */
public class PubsubToBigQueryJSON {
  private static final Logger LOG = LoggerFactory.getLogger(PubsubToBigQueryJSON.class);

  /**
   * Options supported by {@link PubsubToBigQueryJSONOptions}.
   *
   * <p>Concept #4: Defining your own configuration options. Here, you can add your own arguments to
   * be processed by the command-line parser, and specify default values for them. You can then
   * access the options values in your pipeline code.
   *
   * <p>Inherits standard configuration options.
   */
  public interface PubsubToBigQueryJSONOptions extends DataflowPipelineOptions {
    /** Set this required option to specify which subscription topic to be read from. */
    @Description("Name of the subscribed topic")
    @Required
    String getPubsubSubscription();

    void setPubsubSubscription(String value);

    /** Set the GCP BigQuery dataset that will be used, default is "activstat_dev_dataset". */
    @Description("The name of the GCP dataset in BigQuery to be used")
    @Default.String("example")
    String getDataset();

    void setDataset(String value);

    @Description(
        "The dead-letter table to output to within BigQuery in <project-id>:<dataset>.<table> "
            + "format. If it doesn't exist, it will be created during pipeline execution.")
    @Default.String("example.error_dataflow_stream")
    ValueProvider<String> getOutputDeadletterTable();

    void setOutputDeadletterTable(ValueProvider<String> value);
  }

  public static void main(String[] args) {
    PubsubToBigQueryJSONOptions options =
        PipelineOptionsFactory.fromArgs(args)
            .withValidation()
            .as(PubsubToBigQueryJSONOptions.class);
    options.as(BigQueryOptions.class).setNumStreamingKeys(1024);

    runPubsubRead(options);
  }

  /*
   * <p> 1.  Read Json message from pubsub topic as string </p>
   * <p> 2.  Parse Json input string as Java Map Key value pair </p>
   * <p> 3. Get table schema, and append/create records to BigQuery table </p>
   */
  static void runPubsubRead(PubsubToBigQueryJSONOptions options) {
    // Initalize variables
    String dataset = options.getDataset().trim();
    String projectId = options.getProject().trim();
    String pubsub = options.getPubsubSubscription().trim();
    String errorTable = "error_catcher_table";

    Pipeline p = Pipeline.create(options);

    /*
    1. Will read message and parse the PubSub message into a key/Value pair. The value pair is a valid JSON from the server
    2. The code will then match the incoming events with the Schema and detect if there are any schema evolution
    3. Write result to differents BQ dataset depending on the incoming event (valid, evolution, unknown event)

    */
    PCollectionTuple pCollectionTuple =
        p.apply(
                "Read PubSub Message and convert to Key Value pairs",
                PubsubIO.readStrings().fromSubscription(pubsub))
            .apply(ParDo.of(new ReadPubSub()))
            .apply(
                ParDo.of(new JsonSchemaExist(dataset))
                    .withOutputTags(
                        Constants.MAIN_TAG,
                        TupleTagList.of(
                            Constants
                                .UNKNOWN_SCHEMA_TAG))); // Separate known schema and the unknown
    // schema

    PCollection<KV<String, String>> unknownSchemaCollection =
        pCollectionTuple.get(Constants.UNKNOWN_SCHEMA_TAG);

    if (unknownSchemaCollection != null) {
      unknownSchemaCollection.apply(
          "Unknown schema",
          BigQueryIO.<KV<String, String>>write()
              .ignoreInsertIds()
              .to(
                  new DynamicDestinations<KV<String, String>, String>() {
                    @Override
                    public String getDestination(ValueInSingleWindow<KV<String, String>> element) {
                      return element.getValue().getKey();
                    }

                    @Override
                    public TableDestination getTable(String destinationTable) {
                      String tableName = String.format("%s:%s.%s", projectId, dataset, errorTable);
                      return new TableDestination(tableName, " table " + tableName);
                    }

                    @Override
                    public TableSchema getSchema(String destinationTable) {
                      return BQDatasetSchemas.getInstance().getInvalidSchema();
                    }
                  })
              .withFormatFunction(
                  (element) -> {
                    return convertEventToGenericFailureRow(element, "Unkown Schema");
                  })
              .withoutValidation()
              .withFailedInsertRetryPolicy(InsertRetryPolicy.retryTransientErrors())
              .withCreateDisposition(CreateDisposition.CREATE_IF_NEEDED)
              .withWriteDisposition(WriteDisposition.WRITE_APPEND)
              .withExtendedErrorInfo()
              .withMethod(BigQueryIO.Write.Method.STREAMING_INSERTS));
    }

    PCollectionTuple pCollectionSchemaExistTuple =
        pCollectionTuple
            .get(Constants.MAIN_TAG)
            .apply(
                "Separate unmatch schema",
                ParDo.of(new JsonEventMatcher(dataset))
                    .withOutputTags(
                        Constants.MATCH_SCHEMA_TAG, TupleTagList.of(Constants.UNMATCH_SCHEMA_TAG)));

    pCollectionSchemaExistTuple
        .get(Constants.MATCH_SCHEMA_TAG)
        .apply(
            "Write to BQ with pre-defined schema",
            BigQueryIO.<KV<String, String>>write()
                .ignoreInsertIds()
                .to(
                    new DynamicDestinations<KV<String, String>, String>() {
                      @Override
                      public String getDestination(
                          ValueInSingleWindow<KV<String, String>> element) {
                        return element.getValue().getKey();
                      }

                      @Override
                      public TableDestination getTable(String destinationTable) {
                        String tableFullPathName =
                            buildBigQueryTableName(projectId, dataset, destinationTable);

                        return new TableDestination(tableFullPathName, "Table " + destinationTable);
                      }

                      @Override
                      public TableSchema getSchema(String destinationTable) {
                        return BQDatasetSchemas.getInstance().getTableSchema(destinationTable);
                      }
                    })
                .withFormatFunction(
                    (element) -> {
                      TableRow row = new TableRow();
                      JsonFactory factory = new JsonFactory();
                      ObjectMapper mapper = new ObjectMapper(factory);
                      try {
                        JsonNode rootNode = mapper.readTree(element.getValue());
                        ((ObjectNode) rootNode).remove(Constants.LAST_UPDATED_TIMESTAMP);

                        return BigQueryConverters.convertJsonToTableRow(rootNode.toString());
                      } catch (JsonProcessingException e) {
                        LOG.error(
                            "Issue with processing JSON object, with the following erorr"
                                + " message:\n"
                                + e.getMessage());
                      } catch (BigQueryException e) {
                        LOG.error("Error when inserting row to BQ table: \n" + e.getMessage());
                      }

                      return row;
                    })
                .withoutValidation()
                .withFailedInsertRetryPolicy(InsertRetryPolicy.retryTransientErrors())
                .withCreateDisposition(CreateDisposition.CREATE_IF_NEEDED)
                .withWriteDisposition(WriteDisposition.WRITE_APPEND)
                .withExtendedErrorInfo()
                .withMethod(BigQueryIO.Write.Method.STREAMING_INSERTS));

    /*
              In case of there are schema evolution detected, it will write to another DLT (Dead letter table)
    */

    PCollection<KV<String, String>> wrongSchemaCollection =
        pCollectionSchemaExistTuple.get(Constants.UNMATCH_SCHEMA_TAG);

    if (wrongSchemaCollection != null) {
      wrongSchemaCollection.apply(
          "Write to BQ when schema evolution detected",
          BigQueryIO.<KV<String, String>>write()
              .ignoreInsertIds()
              .to(
                  new DynamicDestinations<KV<String, String>, String>() {
                    @Override
                    public String getDestination(ValueInSingleWindow<KV<String, String>> element) {
                      return element.getValue().getKey();
                    }

                    @Override
                    public TableDestination getTable(String destinationTable) {
                      String tableName = String.format("%s:%s.%s", projectId, dataset, errorTable);
                      return new TableDestination(tableName, " table " + tableName);
                    }

                    @Override
                    public TableSchema getSchema(String destinationTable) {
                      return BQDatasetSchemas.getInstance().getInvalidSchema();
                    }
                  })
              .withFormatFunction(
                  (element) -> {
                    return convertEventToGenericFailureRow(element, "Unmatch Schema");
                  })
              .withoutValidation()
              .withFailedInsertRetryPolicy(InsertRetryPolicy.retryTransientErrors())
              .withCreateDisposition(CreateDisposition.CREATE_IF_NEEDED)
              .withWriteDisposition(WriteDisposition.WRITE_APPEND)
              .withExtendedErrorInfo()
              .withMethod(BigQueryIO.Write.Method.STREAMING_INSERTS));
    }

    p.run();
  }

  private static String buildBigQueryTableName(String projectId, String dataset, String table) {
    return String.format("%s:%s.%s", projectId, dataset, table);
  }

  private static TableRow convertEventToGenericFailureRow(
      KV<String, String> element, String reason) {
    TableRow row = new TableRow();
    JsonFactory factory = new JsonFactory();
    ObjectMapper mapper = new ObjectMapper(factory);
    try {
      JsonNode rootNode = mapper.readTree(element.getValue());

      row.put(Constants.EVENT_NAME, element.getKey());
      row.put(Constants.LAST_UPDATED_TIMESTAMP, new Instant().toString());
      row.put(Constants.REASON, reason);

      ((ObjectNode) rootNode).remove(Constants.LAST_UPDATED_TIMESTAMP);
      row.put(Constants.EVENT_BODY, rootNode.toString());
    } catch (JsonProcessingException e) {
      e.printStackTrace();
    }
    return row;
  }
}
