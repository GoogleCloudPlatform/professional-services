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

/** Unit tests for {@link City}. */
@RunWith(JUnit4.class)
public final class CityTest {

  private static final City CITY_TIRANA_1 =
      City.fromJson(
          "{\"city\":\"Albania-Tirana\",\"avgTemperature\":\"18\",\"lat\":41.3275459,\"lng\":19.81869819999997}");
  private static final City CITY_TIRANA_2 =
      City.fromJson(
          "{\"city\":\"Albania-Tirana\",\"avgTemperature\":\"18\",\"lat\":41.3275459,\"lng\":19.81869819999997}");
  private static final City CITY_ORANJESTAD =
      City.fromJson(
          "{\"city\":\"Aruba-Oranjestad\",\"avgTemperature\":\"31\",\"lat\":12.5092044,\"lng\":-70.0086306}");;
  private static final City CITY_NO_NAME_1 =
      City.fromJson("{\"avgTemperature\":\"22\",\"lat\":12.5092044,\"lng\":-70.0086306}");
  private static final City CITY_NO_NAME_2 =
      City.fromJson("{\"avgTemperature\":\"22\",\"lat\":12.5092044,\"lng\":-70.0086306}");

  /** Test that {@link City.equals} returns False when applied to null. */
  @Test
  public void equals_null() throws Exception {
    assertFalse(CITY_TIRANA_1.equals(null));
  }

  /**
   * Test that {@link City.equals} returns False when applied to an object of different class than
   * CityTemperature.
   */
  @Test
  public void equals_differentClass() throws Exception {
    assertFalse(CITY_TIRANA_1.equals(""));
  }

  /** Test that {@link City.equals} returns True when applied to self. */
  @Test
  public void equals_self() throws Exception {
    assertTrue(CITY_TIRANA_1.equals(CITY_TIRANA_1));
  }

  /**
   * Test that {@link City.equals} returns True when applied to an object of class CityTemperature
   * with identical attribute values.
   */
  @Test
  public void equals_identical() throws Exception {
    assertTrue(CITY_TIRANA_1.equals(CITY_TIRANA_2));
  }

  /**
   * Test that {@link City.equals} returns False when applied to an object of class CityTemperature
   * with different attribute values.
   */
  @Test
  public void equals_different() throws Exception {
    assertFalse(CITY_TIRANA_1.equals(CITY_ORANJESTAD));
  }

  /**
   * Test that {@link City.equals} returns True when comparing two CityTemperature objects with null
   * name and other attributes identical.
   */
  @Test
  public void equals_betweenNoName() throws Exception {
    assertTrue(CITY_NO_NAME_1.equals(CITY_NO_NAME_2));
  }

  /**
   * Test that {@link City.equals} returns False when applied to an object of class CityTemperature
   * with null name.
   */
  @Test
  public void equals_withNoName() throws Exception {
    assertFalse(CITY_NO_NAME_1.equals(CITY_TIRANA_2));
  }
}
