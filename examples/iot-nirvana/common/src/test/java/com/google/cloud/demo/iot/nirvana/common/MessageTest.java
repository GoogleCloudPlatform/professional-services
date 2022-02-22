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

package com.google.cloud.demo.iot.nirvana.common;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link Message}. */
@RunWith(JUnit4.class)
public final class MessageTest {

  private static final Message MESSAGE_TIRANA_1 =
      fromJsonSafe(
          "{\"id\":\"8762723AE028CAA144CBF8B7069003C3\",\"temperature\":\"18\",\"timestamp\":1523994520000}");
  private static final Message MESSAGE_TIRANA_2 =
      fromJsonSafe(
          "{\"id\":\"8762723AE028CAA144CBF8B7069003C3\",\"temperature\":\"18\",\"timestamp\":1523994520000}");
  private static final Message MESSAGE_ORANJESTAD =
      fromJsonSafe(
          "{\"id\":\"083D1BC8CDCA4F57AE94B26D83A7D63A\",\"temperature\":\"31\",\"timestamp\":1523999305000}");
  private static final Message MESSAGE_NO_ID_1 =
      fromJsonSafe("{\"temperature\":\"31\",\"timestamp\":1523999305000}");
  private static final Message MESSAGE_NO_ID_2 =
      fromJsonSafe("{\"temperature\":\"31\",\"timestamp\":1523999305000}");

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

  /** Test that {@link Message.equals} returns False when applied to null. */
  @Test
  public void equals_null() throws Exception {
    assertFalse(MESSAGE_TIRANA_1.equals(null));
  }

  /**
   * Test that {@link Message.equals} returns False when applied to an object of different class
   * than Message.
   */
  @Test
  public void equals_differentClass() throws Exception {
    assertFalse(MESSAGE_TIRANA_1.equals(""));
  }

  /** Test that {@link Message.equals} returns True when applied to self. */
  @Test
  public void equals_self() throws Exception {
    assertTrue(MESSAGE_TIRANA_1.equals(MESSAGE_TIRANA_1));
  }

  /**
   * Test that {@link Message.equals} returns True when applied to an object of class Message with
   * identical attribute values.
   */
  @Test
  public void equals_identical() throws Exception {
    assertTrue(MESSAGE_TIRANA_1.equals(MESSAGE_TIRANA_2));
  }

  /**
   * Test that {@link Message.equals} returns False when applied to an object of class Message with
   * different attribute values.
   */
  @Test
  public void equals_different() throws Exception {
    assertFalse(MESSAGE_TIRANA_1.equals(MESSAGE_ORANJESTAD));
  }

  /**
   * Test that {@link Message.equals} returns True when comparing two Message objects with null id
   * and other attributes identical.
   */
  @Test
  public void equals_betweenNoId() throws Exception {
    assertTrue(MESSAGE_NO_ID_1.equals(MESSAGE_NO_ID_2));
  }

  /**
   * Test that {@link Message.equals} returns False when applied to an object of class Message with
   * null name.
   */
  @Test
  public void equals_withNoId() throws Exception {
    assertFalse(MESSAGE_NO_ID_1.equals(MESSAGE_TIRANA_1));
  }
}
