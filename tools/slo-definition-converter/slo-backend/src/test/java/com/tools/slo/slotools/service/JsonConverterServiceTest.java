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

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tools.slo.slotools.exception.BadJsonRequestException;
import java.io.IOException;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class JsonConverterServiceTest {

  @InjectMocks private JsonConverterService jsonConverterService;

  @Mock private PlaceholderReplacementService placeholderReplacementService;

  private ObjectMapper objectMapper;

  @BeforeEach
  public void setup() {
    objectMapper = new ObjectMapper();
    MockitoAnnotations.openMocks(this);
  }

  @Test
  public void testConvertToTF_InvalidSLOJsonFormat() throws Exception {
    // Arrange
    String jsonInput = "{ \"invalid\": \"json\" }";
    JsonNode jsonNode = objectMapper.readTree(jsonInput);

    // Act & Assert
    assertThrows(
        BadJsonRequestException.class,
        () -> {
          jsonConverterService.convertToTF(jsonNode);
        });
  }

  @Test
  public void testConvertToTF_IOException() throws Exception {
    // Arrange
    String jsonInput =
        "{\"displayName\": \"45% - Windowed Distribution Cut - Calendar week\",\"goal\":"
            + " 0.45,\"calendarPeriod\": \"WEEK\",\"serviceLevelIndicator\": {\"windowsBased\":"
            + " {\"windowPeriod\": \"300s\",\"goodTotalRatioThreshold\": {\"performance\":"
            + " {\"distributionCut\": {\"distributionFilter\":"
            + " \"metric.type=\\\"serviceruntime.googleapis.com/api/request_latencies\\\""
            + " resource.type=\\\"consumed_api\\\"\",\"range\": {\"min\":"
            + " -9007199254740991,\"max\": 45}}},\"threshold\": 0.45}}}}";
    JsonNode jsonNode = objectMapper.readTree(jsonInput);

    when(placeholderReplacementService.replacePlaceholders(any(Map.class), any(String.class)))
        .thenThrow(IOException.class);

    // Act & Assert
    assertThrows(
        IOException.class,
        () -> {
          jsonConverterService.convertToTF(jsonNode);
        });
  }
}
