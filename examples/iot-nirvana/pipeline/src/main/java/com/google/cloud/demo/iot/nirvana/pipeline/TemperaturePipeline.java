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

package com.google.cloud.demo.iot.nirvana.pipeline;

import com.google.cloud.demo.iot.nirvana.common.City;
import com.google.cloud.demo.iot.nirvana.common.FormatException;
import com.google.cloud.demo.iot.nirvana.common.Message;
import com.google.cloud.demo.iot.nirvana.common.TemperatureUtils;
import java.util.Map;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.PipelineResult;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.io.gcp.datastore.DatastoreIO;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.View;
import org.apache.beam.sdk.transforms.windowing.FixedWindows;
import org.apache.beam.sdk.transforms.windowing.Window;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.PCollectionView;
import org.apache.beam.sdk.values.TupleTag;
import org.apache.beam.sdk.values.TupleTagList;
import org.joda.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Pipeline reading the temperature data coming from the IoT devices through IoT Core and writing
 * them to BigQuery and Datastore
 */
public class TemperaturePipeline {

  private static final TupleTag<Message> GOOD_TAG = new TupleTag<Message>() {};

  private static final TupleTag<String> ERROR_TAG = new TupleTag<String>() {};

  private static final String PARIS_TIME_ZONE = "Europe/Paris";

  private static final Logger LOG = LoggerFactory.getLogger(TemperaturePipeline.class);

  /**
   * The main entry-point for pipeline execution. This method will start the pipeline but will not
   * wait for it's execution to finish. If blocking execution is required, use the {@link
   * TemperaturePipeline#run(TemperaturePipelineOptions)} method to start the pipeline and invoke
   * {@code result.waitUntilFinish()} on the {@link PipelineResult}.
   *
   * @param args The command-line args passed by the executor.
   */
  public static void main(String[] args) {
    try {
      TemperaturePipelineOptions options =
          PipelineOptionsFactory.fromArgs(args)
              .withValidation()
              .as(TemperaturePipelineOptions.class);
      run(options);
    } catch (FormatException e) {
      LOG.error("Pipeline critical failure", e);
      throw new RuntimeException(e);
    }
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
  public static PipelineResult run(TemperaturePipelineOptions options) throws FormatException {
    Pipeline p = Pipeline.create(options);

    // Read messages from Pub/Sub
    PCollection<String> pubSubMessages =
        p.apply("PubSubRead", PubsubIO.readStrings().fromTopic(options.getInputTopic()));

    // Filter out messages that don't contain temperatures for actual cities
    PCollectionView<Map<String, City>> cities = loadCitiesSideInput(p);

    PCollectionTuple filteredMessages =
        pubSubMessages.apply(
            "FilterMessages",
            ParDo.of(FilterMessages.newBuilder().setCities(cities).setErrorTag(ERROR_TAG).build())
                .withSideInputs(cities)
                .withOutputTags(GOOD_TAG, TupleTagList.of(ERROR_TAG)));
    PCollection<Message> validTemperatures = filteredMessages.get(GOOD_TAG);
    PCollection<String> invalidTemperatures = filteredMessages.get(ERROR_TAG);

    // Convert valid messages into TableRow and write them to BigQuery
    validTemperatures
        .apply("MessageToTableRow", ParDo.of(new MessageToTableRow(PARIS_TIME_ZONE)))
        .apply(
            "BigQueryWrite",
            BigQueryIO.writeTableRows()
                .to(options.getTable())
                .withSchema(MessageToTableRow.getSchema())
                .withCreateDisposition(BigQueryIO.Write.CreateDisposition.CREATE_IF_NEEDED)
                .withWriteDisposition(BigQueryIO.Write.WriteDisposition.WRITE_APPEND));

    // Convert valid messages to Entity objects and write them to Datastore
    validTemperatures
        .apply("MessageToEntity", ParDo.of(new MessageToEntity()))
        .apply("DatastoreWrite", DatastoreIO.v1().write().withProjectId(options.getProject()));

    // Write invalid messages to Google Cloud Storage in 1 minute windows
    invalidTemperatures
        .apply("OneMinuteWindows", Window.into(FixedWindows.of(Duration.standardMinutes(1))))
        .apply(
            "WriteInvalidMessages",
            TextIO.write()
                .to(options.getErrLocationPrefix() + "_" + System.currentTimeMillis())
                .withNumShards(1)
                .withSuffix(".txt")
                .withWindowedWrites());

    // Execute pipeline
    return p.run();
  }

  /** Load the list of cities to be used as a side input */
  static PCollectionView<Map<String, City>> loadCitiesSideInput(Pipeline p) throws FormatException {
    final Map<String, City> cities = TemperatureUtils.loadCities();
    PCollection<KV<String, City>> citiesCollection = p.apply("LoadCities", Create.of(cities));
    PCollectionView<Map<String, City>> citiesCollectionView =
        citiesCollection.apply("CitiesToSingleton", View.<String, City>asMap());
    return citiesCollectionView;
  }
}
