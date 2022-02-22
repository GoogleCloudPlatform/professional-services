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

import com.google.api.services.bigquery.model.TableRow;
import com.google.cloud.demo.iot.nirvana.common.FormatException;
import com.google.cloud.demo.iot.nirvana.common.Message;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.List;
import java.util.TimeZone;
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

/** Unit tests for {@link MessageToTableRow}. */
@RunWith(JUnit4.class)
public final class MessageToTableRowTest {

  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  private static final Message MESSAGE_TIRANA =
      fromJsonSafe(
          "{\"id\":\"8762723AE028CAA144CBF8B7069003C3\",\"temperature\":\"18\",\"timestamp\":1523994520123,"
              + "\"city\":\"Albania-Tirana\",\"lat\":\"41.3275459\",\"lng\":\"19.81869819999997\"}");
  private static final Message MESSAGE_ORANJESTAD =
      fromJsonSafe(
          "{\"id\":\"083D1BC8CDCA4F57AE94B26D83A7D63A\",\"temperature\":\"31\",\"timestamp\":1523999305000,"
              + "\"city\":\"Aruba-Oranjestad\",\"lat\":\"12.5092044\",\"lng\":\"-70.0086306\"}");

  private static final String PARIS_TIME_ZONE = "Europe/Paris";
  private static final String DATE_FORMAT_PATTERN = "YYYY-MM-dd'T'HH:mm:ss.SSS";

  private TableRow rowTirana;
  private TableRow rowOranjestad;

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
  public void createTestData() {

    SimpleDateFormat dateFormat = new SimpleDateFormat(DATE_FORMAT_PATTERN);
    dateFormat.setTimeZone(TimeZone.getTimeZone(PARIS_TIME_ZONE));

    rowTirana =
        new TableRow()
            .set("Id", "8762723AE028CAA144CBF8B7069003C3")
            .set("City", "Albania-Tirana")
            .set("Lat", "41.3275459")
            .set("Lng", "19.81869819999997")
            .set("Temperature", String.valueOf((double) 18))
            .set("Time", dateFormat.format(1523994520123L))
            .set("Year", "2018")
            .set("Month", "04")
            .set("Day", "17")
            .set("Hour", "21")
            .set("Minute", "48")
            .set("Second", "40")
            .set("Frame", "123");
    rowOranjestad =
        new TableRow()
            .set("Id", "083D1BC8CDCA4F57AE94B26D83A7D63A")
            .set("City", "Aruba-Oranjestad")
            .set("Lat", "12.5092044")
            .set("Lng", "-70.0086306")
            .set("Temperature", String.valueOf((double) 31))
            .set("Time", dateFormat.format(1523999305000L))
            .set("Year", "2018")
            .set("Month", "04")
            .set("Day", "17")
            .set("Hour", "23")
            .set("Minute", "08")
            .set("Second", "25")
            .set("Frame", "000");
  }

  /** Test {@link MessageToTableRow.processElement} with a single temperature message. */
  @Test
  @Category(NeedsRunner.class)
  public void process_singleTemperature() throws Exception {
    // Create test data
    List<Message> inputMessages = Arrays.asList(MESSAGE_TIRANA);
    List<TableRow> expectedResult = Arrays.asList(rowTirana);

    // Run the test
    PCollection<TableRow> results =
        pipeline
            .apply("Create", Create.of(inputMessages))
            .apply("JsonToTableRow", ParDo.of(new MessageToTableRow(PARIS_TIME_ZONE)));

    // Check the results
    PAssert.that(results).containsInAnyOrder(expectedResult);
    pipeline.run();
  }

  /** Test {@link MessageToTableRow.processElement} with multiple temperature messages. */
  @Test
  @Category(NeedsRunner.class)
  public void process_multipleTemperatures() throws Exception {
    // Create test data
    List<Message> inputMessages = Arrays.asList(MESSAGE_TIRANA, MESSAGE_ORANJESTAD);
    List<TableRow> expectedResult = Arrays.asList(rowTirana, rowOranjestad);

    // Run the test
    PCollection<TableRow> results =
        pipeline
            .apply("Create", Create.of(inputMessages))
            .apply("JsonToTableRow", ParDo.of(new MessageToTableRow(PARIS_TIME_ZONE)));

    // Check the results
    PAssert.that(results).containsInAnyOrder(expectedResult);
    pipeline.run();
  }
}
