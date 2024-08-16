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
package com.tools.slo.slotools.service;

import static com.tools.slo.slotools.constant.FileConstants.FILE_REQ_DC;
import static com.tools.slo.slotools.constant.FileConstants.FILE_REQ_GTR;
import static com.tools.slo.slotools.constant.FileConstants.FILE_WIN_GTR;
import static com.tools.slo.slotools.constant.FileConstants.FILE_WIN_MMIR;
import static com.tools.slo.slotools.constant.FileConstants.FILE_WIN_MSIR;
import static com.tools.slo.slotools.utility.JsonUtility.containsFieldRecursive;
import static com.tools.slo.slotools.utility.JsonUtility.getFieldValueRecursive;

import com.fasterxml.jackson.databind.JsonNode;
import com.tools.slo.slotools.constant.SliConstants;
import com.tools.slo.slotools.exception.BadJsonRequestException;
import com.tools.slo.slotools.utility.ReplacementMapBuilderUtility;
import java.io.IOException;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service responsible for converting JSON-based Service Level Objective (SLO) definitions into
 * corresponding Terraform (TF) configuration blocks.
 */
@Service
public class JsonConverterService {

  private final PlaceholderReplacementService placeholderReplacementService;

  @Autowired
  public JsonConverterService(PlaceholderReplacementService placeholderReplacementService) {
    this.placeholderReplacementService = placeholderReplacementService;
  }

  /**
   * Converts a JSON SLO definition into a Terraform configuration block.
   *
   * <p>This method performs the following steps:
   *
   * <ol>
   *   <li>Validates the input JSON for required fields (display name, goal, and period).
   *   <li>Identifies the SLO type (request-based or window-based).
   *   <li>Parses relevant parameters from the JSON based on the SLO type.
   *   <li>Selects the appropriate Terraform template file.
   *   <li>Populates the template with the extracted parameters using the {@code
   *       placeholderReplacementService}.
   *   <li>Returns the final Terraform configuration as a string.
   * </ol>
   *
   * @param requestJsonNode The JsonNode representing the SLO definition.
   * @return A string containing the generated Terraform configuration.
   * @throws BadJsonRequestException If the input JSON is invalid or missing required fields.
   * @throws IOException If there's an error reading template files.
   */
  public String convertToTF(JsonNode requestJsonNode) throws BadJsonRequestException, IOException {

    String displayName;
    Double goal;
    String rollingOrCalendarPeriodVal;
    if (requestJsonNode.has(SliConstants.SLI_DISPLAY_NAME)
        && requestJsonNode.has(SliConstants.SLI_GOAL)) {
      displayName = requestJsonNode.get(SliConstants.SLI_DISPLAY_NAME).asText();
      goal = requestJsonNode.get(SliConstants.SLI_GOAL).asDouble();

      if (requestJsonNode.has(SliConstants.SLI_ROLLING_PERIOD))
        rollingOrCalendarPeriodVal = requestJsonNode.get(SliConstants.SLI_ROLLING_PERIOD).asText();
      else if (requestJsonNode.has(SliConstants.SLI_CALENDAR_PERIOD))
        rollingOrCalendarPeriodVal = requestJsonNode.get(SliConstants.SLI_CALENDAR_PERIOD).asText();
      else throw new BadJsonRequestException("required SLO JSON not found in correct format");
    } else throw new BadJsonRequestException("required SLO JSON not found in correct format");
    if (containsFieldRecursive(requestJsonNode, SliConstants.SLI_REQUEST_BASED)) {
      // two cases -> Request based SLI
      // Good Total Ratio
      // Distribution cut

      if (containsFieldRecursive(requestJsonNode, SliConstants.SLI_REQUEST_BASED_GTR)) {
        JsonNode gtrNode =
            getFieldValueRecursive(requestJsonNode, SliConstants.SLI_REQUEST_BASED_GTR);

        String type1 = null;
        String type2 = null;
        String type1Filter = null;
        String type2Filter = null;
        if (gtrNode.has(SliConstants.SLI_REQUEST_BASED_GTR_GOOD)
            && gtrNode.has(SliConstants.SLI_REQUEST_BASED_GTR_TOTAL)) {
          type1 = SliConstants.SLI_REQUEST_BASED_GTR_GOOD_TYPE_VAL;
          type2 = SliConstants.SLI_REQUEST_BASED_GTR_TOTAL_TYPE_VAL;
          type1Filter =
              getFieldValueRecursive(gtrNode, SliConstants.SLI_REQUEST_BASED_GTR_GOOD).asText();
          type2Filter =
              getFieldValueRecursive(gtrNode, SliConstants.SLI_REQUEST_BASED_GTR_TOTAL).asText();
        } else if (gtrNode.has(SliConstants.SLI_REQUEST_BASED_GTR_BAD)
            && gtrNode.has(SliConstants.SLI_REQUEST_BASED_GTR_TOTAL)) {
          type1 = SliConstants.SLI_REQUEST_BASED_GTR_BAD_TYPE_VAL;
          type2 = SliConstants.SLI_REQUEST_BASED_GTR_TOTAL_TYPE_VAL;
          type1Filter =
              getFieldValueRecursive(gtrNode, SliConstants.SLI_REQUEST_BASED_GTR_BAD).asText();
          type2Filter =
              getFieldValueRecursive(gtrNode, SliConstants.SLI_REQUEST_BASED_GTR_TOTAL).asText();
        } else if (gtrNode.has(SliConstants.SLI_REQUEST_BASED_GTR_GOOD)
            && gtrNode.has(SliConstants.SLI_REQUEST_BASED_GTR_BAD)) {
          type1 = SliConstants.SLI_REQUEST_BASED_GTR_GOOD_TYPE_VAL;
          type2 = SliConstants.SLI_REQUEST_BASED_GTR_BAD_TYPE_VAL;
          type1Filter =
              getFieldValueRecursive(gtrNode, SliConstants.SLI_REQUEST_BASED_GTR_GOOD).asText();
          type2Filter =
              getFieldValueRecursive(gtrNode, SliConstants.SLI_REQUEST_BASED_GTR_BAD).asText();
        } else {
          throw new BadJsonRequestException("required SLO JSON not found in correct format");
        }

        Map<String, String> replacements =
            ReplacementMapBuilderUtility.buildReqGTRMap(
                displayName,
                type1,
                type2,
                type1Filter,
                type2Filter,
                goal,
                rollingOrCalendarPeriodVal);

        return placeholderReplacementService.replacePlaceholders(replacements, FILE_REQ_GTR);
      } else if (containsFieldRecursive(requestJsonNode, SliConstants.SLI_REQUEST_BASED_DC)) {
        JsonNode dcNode =
            getFieldValueRecursive(requestJsonNode, SliConstants.SLI_REQUEST_BASED_DC);
        Long min = 0L;
        Long max = 0L;
        if (dcNode.has(SliConstants.SLI_REQUEST_BASED_DC_DF)
            && dcNode.has(SliConstants.SLI_REQUEST_BASED_DC_RANGE)) {
          String dcFilter = dcNode.get(SliConstants.SLI_REQUEST_BASED_DC_DF).asText();
          JsonNode rangeNode = dcNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE);

          if (rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MIN).asLong() > 0)
            min = rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MIN).asLong();

          if (rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MAX).asLong() > 0)
            max = rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MAX).asLong();

          Map<String, String> replacements =
              ReplacementMapBuilderUtility.buildReqDCMap(
                  displayName, dcFilter, max, min, goal, rollingOrCalendarPeriodVal);
          return placeholderReplacementService.replacePlaceholders(replacements, FILE_REQ_DC);
        } else {
          throw new BadJsonRequestException("required SLO JSON not found in correct format");
        }
      }
    } else if (containsFieldRecursive(requestJsonNode, SliConstants.SLI_WINDOW_BASED)) {

      JsonNode windowNode = getFieldValueRecursive(requestJsonNode, SliConstants.SLI_WINDOW_BASED);
      String windowPeriod = null;
      if (windowNode.has(SliConstants.SLI_WINDOW_PERIOD))
        windowPeriod = windowNode.get(SliConstants.SLI_WINDOW_PERIOD).asText();
      else throw new BadJsonRequestException("required SLO JSON not found in correct format");

      if (windowNode.has(SliConstants.SLI_WINDOW_BASED_MMIR)) {
        JsonNode mmirNode = windowNode.get(SliConstants.SLI_WINDOW_BASED_MMIR);
        Long min = 0L;
        Long max = 0L;
        if (mmirNode.has(SliConstants.SLI_WINDOW_BASED_TIME_SERIES)
            && mmirNode.has(SliConstants.SLI_REQUEST_BASED_DC_RANGE)) {
          String tsFilter = mmirNode.get(SliConstants.SLI_WINDOW_BASED_TIME_SERIES).asText();
          JsonNode rangeNode = mmirNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE);

          if (rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MIN).asLong() > 0)
            min = rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MIN).asLong();

          if (rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MAX).asLong() > 0)
            max = rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MAX).asLong();

          Map<String, String> replacements =
              ReplacementMapBuilderUtility.buildWinMmirMap(
                  displayName, tsFilter, max, min, goal, rollingOrCalendarPeriodVal, windowPeriod);
          return placeholderReplacementService.replacePlaceholders(replacements, FILE_WIN_MMIR);
        } else {
          throw new BadJsonRequestException("required SLO JSON not found in correct format");
        }

      } else if (windowNode.has(SliConstants.SLI_WINDOW_BASED_MSIR)) {

        JsonNode msirNode = windowNode.get(SliConstants.SLI_WINDOW_BASED_MSIR);
        Long min = 0L;
        Long max = 0L;
        if (msirNode.has(SliConstants.SLI_WINDOW_BASED_TIME_SERIES)
            && msirNode.has(SliConstants.SLI_REQUEST_BASED_DC_RANGE)) {
          String tsFilter = msirNode.get(SliConstants.SLI_WINDOW_BASED_TIME_SERIES).asText();
          JsonNode rangeNode = msirNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE);

          if (rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MIN).asLong() > 0)
            min = rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MIN).asLong();

          if (rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MAX).asLong() > 0)
            max = rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MAX).asLong();

          Map<String, String> replacements =
              ReplacementMapBuilderUtility.buildWinMmirMap(
                  displayName, tsFilter, max, min, goal, rollingOrCalendarPeriodVal, windowPeriod);
          return placeholderReplacementService.replacePlaceholders(replacements, FILE_WIN_MSIR);
        } else {
          throw new BadJsonRequestException("required SLO JSON not found in correct format");
        }

      } else if (windowNode.has(SliConstants.SLI_WINDOW_BASED_GTRT)) {

        JsonNode gtrtNode = windowNode.get(SliConstants.SLI_WINDOW_BASED_GTRT);
        Double threshold = gtrtNode.get(SliConstants.THRESHOLD).asDouble();
        Long min = 0L;
        Long max = 0L;
        if (containsFieldRecursive(gtrtNode, SliConstants.SLI_REQUEST_BASED_DC)) {

          String dcFilter =
              getFieldValueRecursive(gtrtNode, SliConstants.SLI_REQUEST_BASED_DC_DF).asText();
          JsonNode rangeNode =
              getFieldValueRecursive(gtrtNode, SliConstants.SLI_REQUEST_BASED_DC_RANGE);

          if (rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MIN).asLong() > 0)
            min = rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MIN).asLong();

          if (rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MAX).asLong() > 0)
            max = rangeNode.get(SliConstants.SLI_REQUEST_BASED_DC_RANGE_MAX).asLong();

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
          return placeholderReplacementService.replacePlaceholders(replacements, FILE_WIN_GTR);
        } else {
          throw new BadJsonRequestException("required SLO JSON not found in correct format");
        }
      }

      throw new BadJsonRequestException("required SLO JSON not found in correct format");
    } else throw new BadJsonRequestException("required SLO JSON not found in correct format");
    throw new BadJsonRequestException("required SLO JSON not found in correct format");
  }
}
