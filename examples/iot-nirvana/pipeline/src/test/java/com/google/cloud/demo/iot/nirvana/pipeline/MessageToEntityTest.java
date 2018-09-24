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

import static com.google.datastore.v1.client.DatastoreHelper.makeKey;
import static com.google.datastore.v1.client.DatastoreHelper.makeValue;

import com.google.cloud.demo.iot.nirvana.common.FormatException;
import com.google.cloud.demo.iot.nirvana.common.Message;
import com.google.datastore.v1.Entity;
import com.google.datastore.v1.Key;
import java.util.Arrays;
import java.util.List;
import org.apache.beam.sdk.testing.NeedsRunner;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link MessageToEntity}. */
@RunWith(JUnit4.class)
public final class MessageToEntityTest {

  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  private static final String KEY_TIRANA = "8762723AE028CAA144CBF8B7069003C3";
  private static final String KEY_ORANJESTAD = "083D1BC8CDCA4F57AE94B26D83A7D63A";
  private static final Message MESSAGE_TIRANA =
      fromJsonSafe(
          "{\"id\":\"8762723AE028CAA144CBF8B7069003C3\",\"temperature\":\"18\",\"timestamp\":1523994520000,"
              + "\"city\":\"Albania-Tirana\",\"lat\":\"41.3275459\",\"lng\":\"19.81869819999997\"}");
  private static final Message MESSAGE_ORANJESTAD =
      fromJsonSafe(
          "{\"id\":\"083D1BC8CDCA4F57AE94B26D83A7D63A\",\"temperature\":\"31\",\"timestamp\":1523999305000,"
              + "\"city\":\"Aruba-Oranjestad\",\"lat\":\"12.5092044\",\"lng\":\"-70.0086306\"}");
  private Entity entityTirana;
  private Entity entityOranjestad;

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

    String timestampTirana = String.valueOf(MESSAGE_TIRANA.getTimestamp());
    Key entityKeyTirana =
        makeKey(makeKey("CityEntity", KEY_TIRANA).build(), "CityTemperature", timestampTirana)
            .build();
    Entity.Builder entityBuilder = Entity.newBuilder();
    entityBuilder.setKey(entityKeyTirana);
    entityBuilder
        .getMutableProperties()
        .put("temperature", makeValue(MESSAGE_TIRANA.getTemperature()).build());
    entityTirana = entityBuilder.build();

    String timestampOranjestad = String.valueOf(MESSAGE_ORANJESTAD.getTimestamp());
    Key entityKeyOranjestad =
        makeKey(
                makeKey("CityEntity", KEY_ORANJESTAD).build(),
                "CityTemperature",
                timestampOranjestad)
            .build();
    entityBuilder = Entity.newBuilder();
    entityBuilder.setKey(entityKeyOranjestad);
    entityBuilder
        .getMutableProperties()
        .put("temperature", makeValue(MESSAGE_ORANJESTAD.getTemperature()).build());
    entityOranjestad = entityBuilder.build();
  }

  /** Test {@link MessageToEntity.processElement} with a single temperature message. */
  @Test
  @Category(NeedsRunner.class)
  public void process_singleTemperature() {
    // Create test data
    List<Message> inputMessages = Arrays.asList(MESSAGE_TIRANA);
    List<Entity> expectedResult = Arrays.asList(entityTirana);

    // Run the test
    PCollection<Entity> results =
        pipeline
            .apply("Create", Create.of(inputMessages))
            .apply("JsonToEntity", ParDo.of(new MessageToEntity()));

    // Check the results
    PAssert.that(results).containsInAnyOrder(expectedResult);
    pipeline.run();
  }

  /** Test {@link MessageToEntity.processElement} with multiple temperature messages. */
  @Test
  @Category(NeedsRunner.class)
  public void process_multipleTemperatures() {
    // Create test data
    List<Message> inputMessages = Arrays.asList(MESSAGE_TIRANA, MESSAGE_ORANJESTAD);
    List<Entity> expectedResult = Arrays.asList(entityTirana, entityOranjestad);

    // Run the test
    PCollection<Entity> results =
        pipeline
            .apply("Create", Create.of(inputMessages))
            .apply("JsonToEntity", ParDo.of(new MessageToEntity()));

    // Check the results
    PAssert.that(results).containsInAnyOrder(expectedResult);
    pipeline.run();
  }
}
