/*
 * Copyright (C) 2019 Google Inc.
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

import com.google.cloud.language.v1.Document;
import com.google.cloud.language.v1.Document.Type;
import com.google.cloud.language.v1.LanguageServiceClient;
import com.google.cloud.language.v1.Sentiment;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.Validation.Required;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.transforms.Combine;
import org.apache.beam.sdk.transforms.Combine.BinaryCombineDoubleFn;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.DoFn.ProcessContext;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.Mean;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.SimpleFunction;
import org.apache.beam.sdk.transforms.Sum;
import org.apache.beam.sdk.transforms.windowing.BoundedWindow;
import org.apache.beam.sdk.transforms.windowing.IntervalWindow;
import org.apache.beam.sdk.transforms.windowing.Window;
import org.apache.beam.sdk.transforms.windowing.SlidingWindows;
import org.apache.beam.sdk.transforms.WithTimestamps;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptors;
import org.json.JSONObject;
import org.json.JSONArray;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.joda.time.Duration;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.ISODateTimeFormat;
import org.joda.time.Instant;
import java.util.TimeZone;


public class SentimentAnalysis {
  static class ExtractDocFn extends DoFn<String, Doc> {
    @ProcessElement
    public void processElement(ProcessContext c) {
      JSONObject input = new JSONObject(c.element());
      JSONArray docs = input.getJSONObject("response").getJSONArray("docs");
      for (int i=0; i < docs.length(); i++) {
        JSONObject doc = docs.getJSONObject(i);
        if (!doc.has("print_page")) {
          continue;
        }
        if (!doc.getString("print_page").equals("1")) {
          continue;
        }
        String headline = doc.getJSONObject("headline").getString("main");
        if (headline.matches("")) {
          continue;
        }
        // Excludes front page headlines like "Front Page 8 -- No Title".
        if (headline.matches("Front Page \\d+ -- No Title")) {
          continue;
        }
        String docId = doc.getString("_id");
        String pubDate = doc.getString("pub_date");
        // Converts "2018-01-02T23:55:36+0000" or "2018-01-02T23:55:36Z".
        DateTimeFormatter formatter = ISODateTimeFormat.dateTimeNoMillis();
        DateTime dt = formatter.parseDateTime(pubDate);
        Long epoch = dt.getMillis();
        c.output(new Doc(docId, pubDate, epoch, headline, null, null));
      }
    }
  }


  public static class AnalyzeSentimentFn extends DoFn<Doc, Doc> {
    private LanguageServiceClient language;

    @Setup
    public void setup() throws Exception {
      language = LanguageServiceClient.create();
    }

    @ProcessElement
    public void processElement(ProcessContext c) {
      Doc element = c.element();
      String docId = element.getDocId();
      String pubDate = element.getPubDate();
      Long epoch = element.getEpoch();
      String headline = element.getHeadline();
      Document document = Document.newBuilder()
          .setContent(headline).setType(Type.PLAIN_TEXT).build();
      // Detects the sentiment of the headline.
      Sentiment sentiment =
          language.analyzeSentiment(document).getDocumentSentiment();
      // c.output(c.element().length() / 10.0);
      Double score = (double) sentiment.getScore();
      Double magnitude = (double) sentiment.getMagnitude();
      c.output(new Doc(docId, pubDate, epoch, headline, score, magnitude));
    }

    @Teardown
    public void teardown() {
      language.close();
    }
  }


  public static class DocToJSONFn extends SimpleFunction<Doc, String> {
    @Override
    public String apply(Doc doc) {
      return doc.toString();
    }
  }


  public static class ExtractSentimentValuesFn
      extends DoFn<Doc, KV<String, Double>> {
    @ProcessElement
    public void processElement(ProcessContext c) {
      // Extract score.
      c.output(KV.of("score", c.element().getScore()));
      // Extract magnitude.
      c.output(KV.of("magnitude", c.element().getMagnitude()));
    }
  }


  public static class AggregatesToStringFn
      extends DoFn<KV<String, Double>, String> {
    @ProcessElement
    public void processElement(ProcessContext c, BoundedWindow window) {
      IntervalWindow intervalWindow = (IntervalWindow) window;
      DateTimeFormatter minFmt = DateTimeFormat
          .forPattern("yyyy-MM-dd-HH-mm")
          .withZone(DateTimeZone.forTimeZone(TimeZone.getTimeZone("UTC")));
      c.output(intervalWindow.toString() + ","
               + c.element().getKey() + ","
               + c.element().getValue());
    }
  }


  public interface SentimentAnalysisOptions extends PipelineOptions {
    // Set where to read the input.
    @Description("Path of the file(s) to read from")
    @Required
    String getInputPath();
    void setInputPath(String value);

    // Set where to write the output.
    @Description("Path of the file to write to")
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


  static void runSentimentAnalysis(SentimentAnalysisOptions options) {
    Pipeline p = Pipeline.create(options);
    PCollection<Doc> docs = p.apply(TextIO.read().from(options.getInputPath()))
                             .apply(ParDo.of(new ExtractDocFn()))
                             .apply(ParDo.of(new AnalyzeSentimentFn()));

    // Writes headline sentiments to file.
    docs.apply(MapElements.via(new DocToJSONFn()))
        .apply(TextIO.write().to(String.format(
          "%s_docs", options.getOutputPath())));

    // Calculates aggregates and writes to file.
    docs.apply(WithTimestamps.of((Doc doc) -> new Instant(doc.getEpoch())))
        .apply(Window
          .into(SlidingWindows
            .of(Duration.standardDays(options.getWindowDuration()))
            .every(Duration.standardDays(options.getWindowPeriod()))))
        .apply(ParDo.of(new ExtractSentimentValuesFn()))
        // Calculates aggregate.
        .apply(Mean.perKey())
        // Converts to String.
        .apply(ParDo.of(new AggregatesToStringFn()))
        // Writes to file.
        .apply(TextIO.write().to(String.format(
          "%s_aggregates", options.getOutputPath())));

    p.run().waitUntilFinish();
  }


  public static void main(String[] args) {
    SentimentAnalysisOptions options =
        PipelineOptionsFactory.fromArgs(args).withValidation().as(
          SentimentAnalysisOptions.class);

    runSentimentAnalysis(options);
  }
}
