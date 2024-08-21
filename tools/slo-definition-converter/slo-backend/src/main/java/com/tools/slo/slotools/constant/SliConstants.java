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
package com.tools.slo.slotools.constant;

public class SliConstants {

  public static final String SLI_DISPLAY_NAME = "displayName";
  public static final String SLI_GOAL = "goal";
  public static final String SLI_ROLLING_PERIOD = "rollingPeriod";
  public static final String SLI_CALENDAR_PERIOD = "calendarPeriod";

  // Request based sli finder
  public static final String SLI_REQUEST_BASED = "requestBased";
  public static final String SLI_REQUEST_BASED_GTR = "goodTotalRatio";
  public static final String SLI_REQUEST_BASED_GTR_GOOD = "goodServiceFilter";
  public static final String SLI_REQUEST_BASED_GTR_BAD = "badServiceFilter";
  public static final String SLI_REQUEST_BASED_GTR_TOTAL = "totalServiceFilter";

  public static final String SLI_REQUEST_BASED_GTR_TOTAL_TYPE_VAL = "total";
  public static final String SLI_REQUEST_BASED_GTR_GOOD_TYPE_VAL = "good";
  public static final String SLI_REQUEST_BASED_GTR_BAD_TYPE_VAL = "bad";
  public static final String SLI_REQUEST_BASED_DC = "distributionCut";

  public static final String SLI_REQUEST_BASED_DC_DF = "distributionFilter";

  public static final String SLI_REQUEST_BASED_DC_RANGE = "range";

  public static final String SLI_REQUEST_BASED_DC_RANGE_MIN = "min";
  public static final String SLI_REQUEST_BASED_DC_RANGE_MAX = "max";

  // window based sli finder
  public static final String SLI_WINDOW_BASED = "windowsBased";
  public static final String SLI_WINDOW_BASED_MMIR = "metricMeanInRange";

  public static final String SLI_WINDOW_BASED_TIME_SERIES = "timeSeries";
  public static final String SLI_WINDOW_BASED_MSIR = "metricSumInRange";
  public static final String SLI_WINDOW_BASED_GTRT = "goodTotalRatioThreshold";
  public static final String SLI_WINDOW_PERIOD = "windowPeriod";
  public static final String THRESHOLD = "threshold";
}
