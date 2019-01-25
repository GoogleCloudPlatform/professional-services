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

import com.google.cloud.pso.common.Doc;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import org.apache.beam.sdk.testing.NeedsRunner;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;
import org.junit.Rule;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Test cases for the {@link SentimentAnalysis} class. */
@RunWith(JUnit4.class)
public class SentimentAnalysisTest {

  /** Creates a JSON string for a New York Times article. */
  private static String getDocJSON(
      String docId, String printPage, String pubDate, String headline) {
    String docIdSnip = String.format("\"_id\": \"%s\"", docId);
    String printPageSnip = String.format("\"print_page\": \"%s\"",
                                         printPage);
    String pubDateSnip = String.format("\"pub_date\": \"%s\"",
                                       pubDate);
    String headlineSnip = String.format("\"headline\": {\"main\": \"%s\"}",
                                        headline);
    return String.format("{%s, %s, %s, %s}",
                         docIdSnip,
                         printPageSnip,
                         pubDateSnip,
                         headlineSnip);
  }

  // Create an article.
  private static final String DOC_ID1 = "1";
  private static final String PRINT_PAGE1 = "1";
  private static final String PUB_DATE1 = "2001-02-03T11:12:13+0000";
  private static final Long EPOCH1 = 981198733000L;
  private static final String HEADLINE1 = "Great news!";
  private static final String DOC_JSON1 = getDocJSON(
      DOC_ID1, PRINT_PAGE1, PUB_DATE1, HEADLINE1);
  private static final Doc DOC1 = new Doc(
      DOC_ID1, PUB_DATE1, EPOCH1, HEADLINE1, null, null);

  // Create an article.
  private static final String DOC_ID2 = "2";
  private static final String PRINT_PAGE2 = "1";
  private static final String PUB_DATE2 = "2001-02-03T11:12:13Z";
  private static final Long EPOCH2 = 981198733000L;
  private static final String HEADLINE2 = "Sad News!";
  private static final String DOC_JSON2 = getDocJSON(
      DOC_ID2, PRINT_PAGE2, PUB_DATE2, HEADLINE2);
  private static final Doc DOC2 = new Doc(
      DOC_ID2, PUB_DATE2, EPOCH2, HEADLINE2, null, null);

  // Create an article.
  private static final String DOC_ID3 = "3";
  private static final String PRINT_PAGE3 = "1";
  private static final String PUB_DATE3 = "2001-02-03T11:12:13Z";
  private static final Long EPOCH3 = 981198733000L;
  private static final String HEADLINE3 = "Front Page 2 -- No Title";
  private static final String DOC_JSON3 = getDocJSON(
      DOC_ID3, PRINT_PAGE3, PUB_DATE3, HEADLINE3);

  private static final String INPUT_JSON = String.format(
    "{\"response\": {\"docs\": [%s, %s, %s]}}",
    DOC_JSON1, DOC_JSON2, DOC_JSON3);

  private static final String[] INPUT_JSON_ARRAY = new String[] {INPUT_JSON};

  private static final List<String> INPUT_JSON_LIST = Arrays.asList(
      INPUT_JSON_ARRAY);

  private static final Doc[] EXTRACTED_DOCS_ARRAY = new Doc[] {DOC1, DOC2};

  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  /**
   * Test {@link SentimentAnalysis.ExtractDocFn} returns the correct
   * {@link Doc} objects.
   */
  @Test
  @Category(NeedsRunner.class)
  public void testExtractDocFn() throws IOException {

    PCollection<Doc> docs =
        pipeline
            .apply("Create", Create.of(INPUT_JSON_LIST))
            .apply(
              "ApplyExtractDocFn",
              ParDo.of(new SentimentAnalysis.ExtractDocFn()));

    PAssert.that(docs).containsInAnyOrder(EXTRACTED_DOCS_ARRAY);

    pipeline.run();
  }
}
