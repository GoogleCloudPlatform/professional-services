/**
 * Copyright 2024 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>https://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.tools.slo.slotools.utility;

import static org.junit.jupiter.api.Assertions.*;

import com.tools.slo.slotools.constant.ReplaceConstants;
import java.util.Map;
import org.junit.jupiter.api.Test;

public class ReplacementMapBuilderUtilityTest {

  @Test
  public void testBuildReqGTRMap() {
    // Arrange
    String sloName = "SLO Name";
    String type1 = "Type 1";
    String type2 = "Type 2";
    String type1Filter = "filter1";
    String type2Filter = "filter2";
    Double goal = 0.95;
    String period = "WEEK";

    // Act
    Map<String, String> replacements =
        ReplacementMapBuilderUtility.buildReqGTRMap(
            sloName, type1, type2, type1Filter, type2Filter, goal, period);

    // Assert
    assertEquals(sloName, replacements.get(ReplaceConstants.SLO_NAME));
    assertEquals(type1, replacements.get(ReplaceConstants.TYPE_1));
    assertEquals(type2, replacements.get(ReplaceConstants.TYPE_2));
    assertEquals(
        TextUtility.convertToJoinFormat(type1Filter),
        replacements.get(ReplaceConstants.TYPE1_SERVICE_FILTER));
    assertEquals(
        TextUtility.convertToJoinFormat(type2Filter),
        replacements.get(ReplaceConstants.TYPE2_SERVICE_FILTER));
    assertEquals(String.valueOf(goal), replacements.get(ReplaceConstants.GOAL));
    assertEquals(
        "calendar_period= \"WEEK\"", replacements.get(ReplaceConstants.ROLLING_OR_CALENDAR));
  }

  @Test
  public void testBuildWinGtrtMap() {
    // Arrange
    String displayName = "Display Name";
    String dcFilter = "dcFilter";
    Long max = 100L;
    Long min = 10L;
    Double goal = 0.95;
    String rollingOrCalendarPeriodVal = "WEEK";
    String windowPeriod = "60s";
    Double threshold = 0.90;

    // Act
    Map<String, String> replacements =
        ReplacementMapBuilderUtility.buildWinGtrtMap(
            displayName,
            dcFilter,
            max,
            min,
            goal,
            rollingOrCalendarPeriodVal,
            windowPeriod,
            threshold);

    // Assert
    assertEquals(displayName, replacements.get(ReplaceConstants.SLO_NAME));
    assertEquals(
        TextUtility.convertToJoinFormat(dcFilter), replacements.get(ReplaceConstants.DC_FILTER));
    assertEquals(String.valueOf(max), replacements.get(ReplaceConstants.MAXIMA));
    assertEquals(String.valueOf(min), replacements.get(ReplaceConstants.MINIMA));
    assertEquals(String.valueOf(goal), replacements.get(ReplaceConstants.GOAL));
    assertEquals(windowPeriod, replacements.get(ReplaceConstants.WINDOW_PERIOD));
    assertEquals(
        "calendar_period= \"WEEK\"", replacements.get(ReplaceConstants.ROLLING_OR_CALENDAR));
    assertEquals(String.valueOf(threshold), replacements.get(ReplaceConstants.THRESHOLD));
  }
}
