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

import static com.tools.slo.slotools.constant.ReplaceConstants.DC_FILTER;
import static com.tools.slo.slotools.constant.ReplaceConstants.GOAL;
import static com.tools.slo.slotools.constant.ReplaceConstants.MAXIMA;
import static com.tools.slo.slotools.constant.ReplaceConstants.MINIMA;
import static com.tools.slo.slotools.constant.ReplaceConstants.ROLLING_OR_CALENDAR;
import static com.tools.slo.slotools.constant.ReplaceConstants.SLO_NAME;
import static com.tools.slo.slotools.constant.ReplaceConstants.THRESHOLD;
import static com.tools.slo.slotools.constant.ReplaceConstants.TS_FILTER;
import static com.tools.slo.slotools.constant.ReplaceConstants.TYPE1_SERVICE_FILTER;
import static com.tools.slo.slotools.constant.ReplaceConstants.TYPE2_SERVICE_FILTER;
import static com.tools.slo.slotools.constant.ReplaceConstants.TYPE_1;
import static com.tools.slo.slotools.constant.ReplaceConstants.TYPE_2;
import static com.tools.slo.slotools.constant.ReplaceConstants.WINDOW_PERIOD;

import com.tools.slo.slotools.model.TimePeriod;
import com.tools.slo.slotools.service.PlaceholderReplacementService;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for building maps of replacement values used in Terraform templates.
 *
 * <p>This class provides static methods to create maps that associate placeholder keys with their
 * corresponding values, extracted from Service Level Objective (SLO) definition data. These maps
 * are then used by the {@link PlaceholderReplacementService} to populate Terraform configuration
 * templates.
 */
public class ReplacementMapBuilderUtility {

  /**
   * Builds a map of replacement values for request-based SLOs with Good Total Ratio (GTR)
   * indicators.
   *
   * @param sloName The display name of the SLO.
   * @param type1 The type of the first metric (e.g., "good_service").
   * @param type2 The type of the second metric (e.g., "total_service").
   * @param type1Filter The filter expression for the first metric.
   * @param type2Filter The filter expression for the second metric.
   * @param goal The SLO goal as a decimal value.
   * @param period The rolling period in seconds or calendar period as a string (e.g., "3600s" or
   *     "DAY").
   * @return A map containing key-value pairs for replacement in the Terraform template.
   */
  public static Map<String, String> buildReqGTRMap(
      String sloName,
      String type1,
      String type2,
      String type1Filter,
      String type2Filter,
      Double goal,
      String period) {

    //        String
    // Define the replacement values without placeholders
    Map<String, String> replacements = new HashMap<>();
    replacements.put(SLO_NAME, sloName);
    replacements.put(TYPE_1, type1);
    replacements.put(TYPE_2, type2);
    replacements.put(TYPE1_SERVICE_FILTER, TextUtility.convertToJoinFormat(type1Filter));
    replacements.put(TYPE2_SERVICE_FILTER, TextUtility.convertToJoinFormat(type2Filter));
    replacements.put(GOAL, "" + goal);
    replacements.put(ROLLING_OR_CALENDAR, getRollingOrCalendar(period));
    return replacements;
  }

  /**
   * Builds a map of replacement values for request-based SLOs with Distribution Cut (DC)
   * indicators.
   *
   * @param sloName The display name of the SLO.
   * @param dcFilter The filter expression for the distribution cut.
   * @param maxima The maximum value for the distribution cut range.
   * @param minima The minimum value for the distribution cut range.
   * @param goal The SLO goal as a decimal value.
   * @param period The rolling period in seconds or calendar period as a string (e.g., "3600s" or
   *     "DAY").
   * @return A map containing key-value pairs for replacement in the Terraform template.
   */
  public static Map<String, String> buildReqDCMap(
      String sloName, String dcFilter, Long maxima, Long minima, Double goal, String period) {

    //        String
    // Define the replacement values without placeholders
    Map<String, String> replacements = new HashMap<>();
    replacements.put(SLO_NAME, sloName);
    replacements.put(DC_FILTER, TextUtility.convertToJoinFormat(dcFilter));
    replacements.put(MAXIMA, "" + maxima);
    replacements.put(MINIMA, "" + minima);
    replacements.put(GOAL, "" + goal);
    replacements.put(ROLLING_OR_CALENDAR, getRollingOrCalendar(period));
    return replacements;
  }

  /**
   * Determines whether to use a rolling period or calendar period in the Terraform configuration.
   *
   * @param period The rolling period in seconds or calendar period as a string (e.g., "3600s" or
   *     "DAY").
   * @return A string representing either "rolling_period_days" or "calendar_period" with the
   *     corresponding value.
   */
  private static String getRollingOrCalendar(String period) {
    if (TimePeriod.getAllValues().contains(period)) {
      return "calendar_period= " + "\"" + period + "\"";
    } else {
      return "rolling_period_days= " + secondsToDays(period);
    }
  }

  /**
   * Converts a time period in seconds to the equivalent number of days.
   *
   * @param input A string representing the time period in seconds (e.g., "86400s").
   * @return The number of days equivalent to the input time period.
   * @throws IllegalArgumentException If the input does not end with 's' to indicate seconds.
   */
  private static Long secondsToDays(String input) {
    if (input.endsWith("s")) {
      long seconds = Long.parseLong(input.substring(0, input.length() - 1));
      long secondsInADay = 24 * 60 * 60;
      return seconds / secondsInADay;
    } else {
      throw new IllegalArgumentException("Input should end with 's' to indicate seconds.");
    }
  }

  /**
   * Builds a map of replacement values for window-based SLOs with the metric mean in range (MMIR)
   * indicator.
   *
   * <p>This method creates a map that associates placeholder keys (e.g., "SLO_NAME", "TS_FILTER")
   * with their corresponding values, extracted from the parameters provided. These values are
   * intended to be used to fill in a Terraform configuration template for a window-based SLO using
   * the metric mean in range indicator.
   *
   * @param displayName The display name of the SLO.
   * @param tsFilter The filter expression for the time series metric.
   * @param max The maximum value allowed for the metric.
   * @param min The minimum value allowed for the metric.
   * @param goal The SLO goal as a decimal value.
   * @param rollingOrCalendarPeriodVal The rolling period in seconds or calendar period (e.g.,
   *     "3600s" or "DAY").
   * @param windowPeriod The duration of the window used to calculate the metric mean.
   * @return A map containing key-value pairs for replacement in the Terraform template.
   */
  public static Map<String, String> buildWinMmirMap(
      String displayName,
      String tsFilter,
      Long max,
      Long min,
      Double goal,
      String rollingOrCalendarPeriodVal,
      String windowPeriod) {
    Map<String, String> replacements = new HashMap<>();
    replacements.put(SLO_NAME, displayName);
    replacements.put(TS_FILTER, TextUtility.convertToJoinFormat(tsFilter));
    replacements.put(MAXIMA, "" + max);
    replacements.put(MINIMA, "" + min);
    replacements.put(GOAL, "" + goal);
    replacements.put(WINDOW_PERIOD, windowPeriod);
    replacements.put(ROLLING_OR_CALENDAR, getRollingOrCalendar(rollingOrCalendarPeriodVal));
    return replacements;
  }

  /**
   * Builds a map of replacement values for window-based SLOs with the good total ratio threshold
   * (GTRT) indicator.
   *
   * <p>This method is similar to {@link #buildWinMmirMap}, but it specifically caters to
   * window-based SLOs that utilize a threshold for the good total ratio. It includes an additional
   * 'threshold' parameter to accommodate this requirement.
   *
   * @param displayName The display name of the SLO.
   * @param dcFilter The filter expression for the distribution cut.
   * @param max The maximum value for the distribution cut range.
   * @param min The minimum value for the distribution cut range.
   * @param goal The SLO goal as a decimal value.
   * @param rollingOrCalendarPeriodVal The rolling period in seconds or calendar period (e.g.,
   *     "3600s" or "DAY").
   * @param windowPeriod The duration of the window used to calculate the metric.
   * @param threshold The threshold value for the good total ratio.
   * @return A map containing key-value pairs for replacement in the Terraform template.
   */
  public static Map<String, String> buildWinGtrtMap(
      String displayName,
      String dcFilter,
      Long max,
      Long min,
      Double goal,
      String rollingOrCalendarPeriodVal,
      String windowPeriod,
      Double threshold) {

    Map<String, String> replacements = new HashMap<>();
    replacements.put(SLO_NAME, displayName);
    replacements.put(DC_FILTER, TextUtility.convertToJoinFormat(dcFilter));
    replacements.put(MAXIMA, "" + max);
    replacements.put(MINIMA, "" + min);
    replacements.put(GOAL, "" + goal);
    replacements.put(WINDOW_PERIOD, windowPeriod);
    replacements.put(ROLLING_OR_CALENDAR, getRollingOrCalendar(rollingOrCalendarPeriodVal));
    replacements.put(THRESHOLD, "" + threshold);
    return replacements;
  }
}
