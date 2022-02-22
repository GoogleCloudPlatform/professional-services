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
import java.io.Serializable;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.apache.beam.sdk.testing.NeedsRunner;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.PCollectionView;
import org.apache.beam.sdk.values.TupleTag;
import org.apache.beam.sdk.values.TupleTagList;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link FilterMessages}. */
@RunWith(JUnit4.class)
public final class FilterMessagesTest implements Serializable {

  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  private static final TupleTag<Message> GOOD_TAG = new TupleTag<Message>() {};;
  private static final TupleTag<String> ERROR_TAG = new TupleTag<String>() {};
  private static final String INVALID_MESSAGE =
      "{\"id\":\"invalid id\",\"temperature\":\"18\",\"timestamp\":1523994520000}";
  private static final String INVALID_MESSAGE_RESULT =
      "Invalid message, cause: Invalid id.\nOriginal message: {\"id\":\"invalid id\","
          + "\"temperature\":\"18\",\"timestamp\":1523994520000}\n";
  private static final String INCOMPLETE_MESSAGE =
      "{\"id\":\"8762723AE028CAA144CBF8B7069003C3\",\"timestamp\":1523994520000}";
  private static final String INCOMPLETE_MESSAGE_RESULT =
      "Invalid message, cause: Cannot create message from JSON. Cause: Missing required "
          + "properties: temperature.\nOriginal message: {\"id\":\"8762723AE028CAA144CBF8B7069003C3\","
          + "\"timestamp\":1523994520000}\n";
  private static final String MALFORMED_MESSAGE =
      "\"id\":\"8762723AE028CAA144CBF8B7069003C3\",\"timestamp\":1523994520000}";
  private static final String MALFORMED_MESSAGE_RESULT =
      "Invalid message, cause: Cannot create message from JSON. Cause: java.lang.IllegalStateException: "
          + "Expected BEGIN_OBJECT but was STRING at line 1 column 2 path $.\nOriginal message: "
          + "\"id\":\"8762723AE028CAA144CBF8B7069003C3\",\"timestamp\":1523994520000}\n";
  private static final City CITY_TIRANA =
      City.fromJson(
          "{\"city\":\"Albania-Tirana\",\"avgTemperature\":\"18\",\"lat\":41.3275459,\"lng\":19.81869819999997}");
  private static final City CITY_ORANJESTAD =
      City.fromJson(
          "{\"city\":\"Aruba-Oranjestad\",\"avgTemperature\":\"31\",\"lat\":12.5092044,\"lng\":-70.0086306}");
  private static final String VALID_MESSAGE_TIRANA_STR =
      "{\"id\":\"8762723AE028CAA144CBF8B7069003C3\",\"temperature\":\"18\",\"timestamp\":1523994520000}";
  private static final String VALID_MESSAGE_ORANJESTAD_STR =
      "{\"id\":\"083D1BC8CDCA4F57AE94B26D83A7D63A\",\"temperature\":\"31\",\"timestamp\":1523999305000}";
  private static final Message VALID_MESSAGE_TIRANA =
      fromJsonSafe(
          "{\"id\":\"8762723AE028CAA144CBF8B7069003C3\",\"temperature\":\"18\",\"timestamp\":1523994520000,"
              + "\"city\":\"Albania-Tirana\",\"lat\":\"41.3275459\",\"lng\":\"19.81869819999997\"}");
  private static final Message VALID_MESSAGE_ORANJESTAD =
      fromJsonSafe(
          "{\"id\":\"083D1BC8CDCA4F57AE94B26D83A7D63A\",\"temperature\":\"31\",\"timestamp\":1523999305000,"
              + "\"city\":\"Aruba-Oranjestad\",\"lat\":\"12.5092044\",\"lng\":\"-70.0086306\"}");

  private PCollectionView<Map<String, City>> cities;

  /**
   * Safe JSON deserialization of a Message object, will be called only with valid messages for test
   * purposes.
   *
   * @param json
   * @return
   */
  private static Message fromJsonSafe(String json) {
    Message message = null;
    try {
      message = Message.fromJson(json);
    } catch (FormatException e) {
      // Nothing to do here, method will only be called with valid messages
    }
    return message;
  }

  /** Create test data. */
  @Before
  public void createTestData() throws FormatException {
    cities = TemperaturePipeline.loadCitiesSideInput(pipeline);
  }

  /**
   * Test {@link FilterMessages.processElement} with an invalid message, whose identifier does not
   * correspond to the coordinates of an actual city.
   */
  @Test
  @Category(NeedsRunner.class)
  public void processElement_invalidMessage() throws Exception {
    // Create test data
    List<String> inputMessages = Arrays.asList(INVALID_MESSAGE);

    // Create pipeline graph
    PCollectionTuple filteredMessages =
        pipeline
            .apply("Create", Create.of(inputMessages))
            .apply(
                "FilterMessages",
                ParDo.of(
                        FilterMessages.newBuilder()
                            .setCities(cities)
                            .setErrorTag(ERROR_TAG)
                            .build())
                    .withSideInputs(cities)
                    .withOutputTags(GOOD_TAG, TupleTagList.of(ERROR_TAG)));
    PCollection<Message> validTemperatures = filteredMessages.get(GOOD_TAG);
    PCollection<String> invalidTemperatures = filteredMessages.get(ERROR_TAG);

    // Run pipeline and evaluate results
    PAssert.that(validTemperatures).empty();
    PAssert.that(invalidTemperatures).containsInAnyOrder(INVALID_MESSAGE_RESULT);
    pipeline.run();
  }

  /**
   * Test {@link FilterMessages.processElement} with an incomplete message, which does not contain
   * temperature information.
   */
  @Test
  @Category(NeedsRunner.class)
  public void processElement_incompleteMessage() throws Exception {
    // Create test data
    List<String> inputMessages = Arrays.asList(INCOMPLETE_MESSAGE);

    // Create pipeline graph
    PCollectionTuple filteredMessages =
        pipeline
            .apply("Create", Create.of(inputMessages))
            .apply(
                "FilterMessages",
                ParDo.of(
                        FilterMessages.newBuilder()
                            .setCities(cities)
                            .setErrorTag(ERROR_TAG)
                            .build())
                    .withSideInputs(cities)
                    .withOutputTags(GOOD_TAG, TupleTagList.of(ERROR_TAG)));
    PCollection<Message> validTemperatures = filteredMessages.get(GOOD_TAG);
    PCollection<String> invalidTemperatures = filteredMessages.get(ERROR_TAG);

    // Run pipeline and evaluate results
    PAssert.that(validTemperatures).empty();
    PAssert.that(invalidTemperatures).containsInAnyOrder(INCOMPLETE_MESSAGE_RESULT);
    pipeline.run();
  }

  /**
   * Test {@link FilterMessages.processElement} with a malformed message, which does not comply to
   * JSON formalism.
   */
  @Test
  @Category(NeedsRunner.class)
  public void processElement_malformedMessage() throws Exception {
    // Create test data
    List<String> inputMessages = Arrays.asList(MALFORMED_MESSAGE);

    // Create pipeline graph
    PCollectionTuple filteredMessages =
        pipeline
            .apply("Create", Create.of(inputMessages))
            .apply(
                "FilterMessages",
                ParDo.of(
                        FilterMessages.newBuilder()
                            .setCities(cities)
                            .setErrorTag(ERROR_TAG)
                            .build())
                    .withSideInputs(cities)
                    .withOutputTags(GOOD_TAG, TupleTagList.of(ERROR_TAG)));
    PCollection<Message> validTemperatures = filteredMessages.get(GOOD_TAG);
    PCollection<String> invalidTemperatures = filteredMessages.get(ERROR_TAG);

    // Run pipeline and evaluate results
    PAssert.that(validTemperatures).empty();
    PAssert.that(invalidTemperatures).containsInAnyOrder(MALFORMED_MESSAGE_RESULT);
    pipeline.run();
  }

  /**
   * Test {@link FilterMessages.processElement} with an valid message, whose identifier corresponds
   * to the coordinates of an actual city.
   */
  @Test
  @Category(NeedsRunner.class)
  public void processElement_singleValidMessage() throws Exception {
    // Create test data
    List<String> inputMessages = Arrays.asList(VALID_MESSAGE_TIRANA_STR);

    // Create pipeline graph
    PCollectionTuple filteredMessages =
        pipeline
            .apply("Create", Create.of(inputMessages))
            .apply(
                "FilterMessages",
                ParDo.of(
                        FilterMessages.newBuilder()
                            .setCities(cities)
                            .setErrorTag(ERROR_TAG)
                            .build())
                    .withSideInputs(cities)
                    .withOutputTags(GOOD_TAG, TupleTagList.of(ERROR_TAG)));
    PCollection<Message> validTemperatures = filteredMessages.get(GOOD_TAG);
    PCollection<String> invalidTemperatures = filteredMessages.get(ERROR_TAG);

    // Run pipeline and evaluate results
    PAssert.that(validTemperatures).containsInAnyOrder(VALID_MESSAGE_TIRANA);
    PAssert.that(invalidTemperatures).empty();
    pipeline.run();
  }

  /**
   * Test {@link FilterMessages.processElement} with multiple valid messages, whose respective
   * identifiers corresponds to coordinates of an actual cities.
   */
  @Test
  @Category(NeedsRunner.class)
  public void processElement_multipleValidMessages() throws Exception {
    // Create test data
    List<String> inputMessages =
        Arrays.asList(VALID_MESSAGE_TIRANA_STR, VALID_MESSAGE_ORANJESTAD_STR);
    List<Message> expectedResult = Arrays.asList(VALID_MESSAGE_TIRANA, VALID_MESSAGE_ORANJESTAD);

    // Create pipeline graph
    PCollectionTuple filteredMessages =
        pipeline
            .apply("Create", Create.of(inputMessages))
            .apply(
                "FilterMessages",
                ParDo.of(
                        FilterMessages.newBuilder()
                            .setCities(cities)
                            .setErrorTag(ERROR_TAG)
                            .build())
                    .withSideInputs(cities)
                    .withOutputTags(GOOD_TAG, TupleTagList.of(ERROR_TAG)));
    PCollection<Message> validTemperatures = filteredMessages.get(GOOD_TAG);
    PCollection<String> invalidTemperatures = filteredMessages.get(ERROR_TAG);

    // Run pipeline and evaluate results
    PAssert.that(validTemperatures).containsInAnyOrder(expectedResult);
    PAssert.that(invalidTemperatures).empty();
    pipeline.run();
  }

  /**
   * Test {@link FilterMessages.processElement} with a mix of valid and invalid messages, whose
   * respective identifiers corresponds to coordinates of an actual cities.
   */
  @Test
  @Category(NeedsRunner.class)
  public void processElement_mixedValidInvalidMessage() throws Exception {
    // Create test data
    List<String> inputMessages =
        Arrays.asList(INVALID_MESSAGE, VALID_MESSAGE_TIRANA_STR, VALID_MESSAGE_ORANJESTAD_STR);
    List<Message> expectedValidResult =
        Arrays.asList(VALID_MESSAGE_TIRANA, VALID_MESSAGE_ORANJESTAD);

    // Create pipeline graph
    PCollectionTuple filteredMessages =
        pipeline
            .apply("Create", Create.of(inputMessages))
            .apply(
                "FilterMessages",
                ParDo.of(
                        FilterMessages.newBuilder()
                            .setCities(cities)
                            .setErrorTag(ERROR_TAG)
                            .build())
                    .withSideInputs(cities)
                    .withOutputTags(GOOD_TAG, TupleTagList.of(ERROR_TAG)));
    PCollection<Message> validTemperatures = filteredMessages.get(GOOD_TAG);
    PCollection<String> invalidTemperatures = filteredMessages.get(ERROR_TAG);

    // Run pipeline and evaluate results
    PAssert.that(validTemperatures).containsInAnyOrder(expectedValidResult);
    PAssert.that(invalidTemperatures).containsInAnyOrder(INVALID_MESSAGE_RESULT);
    pipeline.run();
  }
}
