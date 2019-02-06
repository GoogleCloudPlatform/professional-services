/*
 * Copyright (C) 2019 Google Inc.
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

package com.google.cloud.pso.pipelines;

import com.google.cloud.language.v1.Document;
import com.google.cloud.language.v1.Document.Type;
import com.google.cloud.language.v1.LanguageServiceClient;
import com.google.cloud.language.v1.Sentiment;
import com.google.cloud.pso.common.Doc;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.Validation.Required;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.DoFn.ProcessContext;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.Mean;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.WithTimestamps;
import org.apache.beam.sdk.transforms.windowing.BoundedWindow;
import org.apache.beam.sdk.transforms.windowing.IntervalWindow;
import org.apache.beam.sdk.transforms.windowing.SlidingWindows;
import org.apache.beam.sdk.transforms.windowing.Window;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptors;
import org.joda.time.DateTime;
import org.joda.time.Duration;
import org.joda.time.Instant;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.ISODateTimeFormat;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The {@link SentimentAnalysis} pipeline is a sample pipeline that can uses
 * Cloud Natural Language API to generate sentiment analysis on headlines from
 * New York Archive API articles.
 *
* <p><b>Example Usage</b>
 *
 * <pre>
 * # Set the pipeline vars
 * BUCKET_NAME=BUCKET_NAME
 * TEMP_LOCATION=TEMP_FOLDER
 * INPUT_PATH=INPUT_FOLDER/*
 * OUTPUT_PATH=OUTPUT_FOLDER/output
 * DURATION=280
 * PERIOD=1
 *
 * # Set the runner
 * RUNNER=DataflowRunner
 *
 * # Build the template
 * mvn compile exec:java \
 *   --define exec.mainClass=com.google.cloud.pso.pipelines.SentimentAnalysis \
 *   --define exec.cleanupDaemonThreads=false \
 *   --define exec.args=" \
 *     --runner=${RUNNER} \
 *     --gcpTempLocation=gs://${BUCKET_NAME}/${TEMP_LOCATION} \
 *     --inputPath=gs://${BUCKET_NAME}/${INPUT_PATH} \
 *     --outputPath=gs://${BUCKET_NAME}/${OUTPUT_PATH} \
 *     --windowDuration=${DURATION} \
 *     --windowPeriod=${PERIOD}"
 * </pre>
 */
public class SentimentAnalysis {

  /**
   * A {@link DoFn} that filters front page articles, extracts _id, pub_date,
   * and headline, and creates a {@link Doc} object.
   */
  static class ExtractDocFn extends DoFn<String, Doc> {
    public static final DateTimeFormatter FORMATTER = ISODateTimeFormat
        .dateTimeNoMillis();

    // Checks whether it is a front page article and has a valid headline.
    private boolean isValidDoc(JSONObject doc) {
      if (!doc.has("print_page")) {
        return false;
      }
      if (!doc.getString("print_page").equals("1")) {
        return false;
      }
      String headline = doc.getJSONObject("headline").getString("main");
      if (headline.matches("")) {
        return false;
      }
      // Excludes front page headlines like "Front Page 8 -- No Title".
      if (headline.matches("Front Page \\d+ -- No Title")) {
        return false;
      }
      return true;
    }

    // Extracts attributes from valid articles.
    @ProcessElement
    public void processElement(ProcessContext c) {
      JSONObject input = new JSONObject(c.element());
      JSONArray docs = input.getJSONObject("response").getJSONArray("docs");
      for (int i = 0; i < docs.length(); i++) {
        JSONObject doc = docs.getJSONObject(i);
        if (isValidDoc(doc)) {
          String headline = doc.getJSONObject("headline").getString("main");
          String docId = doc.getString("_id");
          String pubDate = doc.getString("pub_date");
          // Converts "2018-01-02T23:55:36+0000" or "2018-01-02T23:55:36Z".
          DateTime dt = FORMATTER.parseDateTime(pubDate);
          Long epoch = dt.getMillis();
          c.output(new Doc(docId, pubDate, epoch, headline, null, null));
        }
      }
    }
  }

  /**
   * A {@link DoFn} that takes a {@link Doc} articles, and analyzes its
   * through Cloud Natural Language API.
   */
  public static class AnalyzeSentimentFn extends DoFn<Doc, Doc> {
    private LanguageServiceClient language;

    // Prepares an instance with a client for processing bundles of elements.
    @Setup
    public void setup() throws Exception {
      language = LanguageServiceClient.create();
    }

    // Detects the sentiment score and magnitude of the headlines.
    @ProcessElement
    public void processElement(ProcessContext c) {
      Doc element = c.element();
      String docId = element.getDocId();
      String pubDate = element.getPubDate();
      Long epoch = element.getEpoch();
      String headline = element.getHeadline();
      Document document = Document.newBuilder()
          .setContent(headline).setType(Type.PLAIN_TEXT).build();
      Sentiment sentiment =
          language.analyzeSentiment(document).getDocumentSentiment();
      Double score = (double) sentiment.getScore();
      Double magnitude = (double) sentiment.getMagnitude();
      c.output(new Doc(docId, pubDate, epoch, headline, score, magnitude));
    }

    // Closes the connection before the instance is discarded.
    @Teardown
    public void teardown() {
      language.close();
    }
  }

  /**
   * A {@link DoFn} that extracts the score and magnitude of sentiments and
   * creates {@link KV}s for aggregation.
   */
  private static class ExtractSentimentValuesFn
      extends DoFn<Doc, KV<String, Double>> {
    @ProcessElement
    public void processElement(ProcessContext c) {
      // Extract score.
      c.output(KV.of("score", c.element().getScore()));
      // Extract magnitude.
      c.output(KV.of("magnitude", c.element().getMagnitude()));
    }
  }

  /**
   * A {@link DoFn} that converts sentiment score and magnitude aggregates to
   * strings. The string consists of the timestamp, aggregated quantity name,
   * and the aggregated value.
   */
  private static class AggregatesToStringFn
      extends DoFn<KV<String, Double>, String> {
    @ProcessElement
    public void processElement(ProcessContext c, BoundedWindow window) {
      IntervalWindow intervalWindow = (IntervalWindow) window;
      c.output(intervalWindow.toString() + ","
               + c.element().getKey() + ","
               + c.element().getValue());
    }
  }

  /**
   * The {@link SentimentAnalysisOptions} class provides the custom execution
   * options passed by the executor at the command-line.
   */
  public interface SentimentAnalysisOptions extends PipelineOptions {
    // Set where to read the input.
    @Description("GCS bucket/path of the file(s) to read from.")
    @Required
    String getInputPath();
    void setInputPath(String value);

    // Set where to write the output.
    @Description("GCS bucket/path to write to.")
    @Required
    String getOutputPath();
    void setOutputPath(String value);

    // Set window duration.
    @Description("Sliding window duration.")
    @Default.Integer(280)
    Integer getWindowDuration();
    void setWindowDuration(Integer value);

    // Sets window period.
    @Description("Sliding window period.")
    @Default.Integer(1)
    Integer getWindowPeriod();
    void setWindowPeriod(Integer value);
  }

  /** Creates the pipeline and runs it to completion. */
  static void runSentimentAnalysis(SentimentAnalysisOptions options) {
    Pipeline p = Pipeline.create(options);

    // Extracts article attributes and analyzes sentiments.
    PCollection<Doc> docs = p
        // Read input file(s) from GCS.
        .apply(
          "ReadInput",
          TextIO.read().from(options.getInputPath()))

        // Extract article attributes.
        .apply(
          "ExtractArticleAttributes",
          ParDo.of(new ExtractDocFn()))

        // Performs sentiment analysis on article headlines.
        .apply(
          "AnalyzeHeadlineSentiment",
          ParDo.of(new AnalyzeSentimentFn()));

    // Writes headline sentiments to file.
    docs
        // Converts article attributes and sentiment values to JSON.
        .apply(
          "ConvertArticleToJSON",
          MapElements.into(TypeDescriptors.strings())
                     .via((Doc doc) -> doc.toString()))

        // Writes to GCS.
        .apply(
          "WriteArticleToFile",
          TextIO.write().to(String.format(
            "%s_docs", options.getOutputPath())));

    // Calculates aggregates and writes to file.
    docs
        // Applies the publish date of an article as its timestamp.
        .apply(
          "ApplyArticleTimestamp",
          WithTimestamps.of((Doc doc) -> new Instant(doc.getEpoch())))

        // Applies sliding windows.
        .apply(
          "ApplySlidingWindows",
          Window.into(
            SlidingWindows
              .of(Duration.standardDays(options.getWindowDuration()))
              .every(Duration.standardDays(options.getWindowPeriod()))))

        // Extracts sentiment score and magnitude.
        .apply(
          "ExtractSentimentValues",
          ParDo.of(new ExtractSentimentValuesFn()))

        // Calculates aggregate.
        .apply(
          "CalculateMean",
          Mean.perKey())

        // Converts to String.
        .apply(
          "ConvertAggregatesToString",
          ParDo.of(new AggregatesToStringFn()))

        // Writes to file.
        .apply(
          "WriteAggregatesToFile",
          TextIO.write().to(String.format(
            "%s_aggregates", options.getOutputPath())));

    p.run().waitUntilFinish();
  }

  /**
   * The main entry point for pipeline execution.
   */
  public static void main(String[] args) {
    SentimentAnalysisOptions options =
        PipelineOptionsFactory.fromArgs(args).withValidation().as(
          SentimentAnalysisOptions.class);

    runSentimentAnalysis(options);
  }
}
