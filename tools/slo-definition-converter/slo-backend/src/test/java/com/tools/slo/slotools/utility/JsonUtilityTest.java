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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

public class JsonUtilityTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  public void testContainsFieldRecursive_FieldExists() throws Exception {
    // Arrange
    String jsonInput =
        "{\"level1\": { \"level2\": { \"level3\": { \"targetField\": \"value\" } } } }";
    JsonNode jsonNode = objectMapper.readTree(jsonInput);

    // Act
    boolean result = JsonUtility.containsFieldRecursive(jsonNode, "targetField");

    // Assert
    assertTrue(result);
  }

  @Test
  public void testContainsFieldRecursive_FieldDoesNotExist() throws Exception {
    // Arrange
    String jsonInput =
        "{\"level1\": { \"level2\": { \"level3\": { \"someOtherField\": \"value\" } } } }";
    JsonNode jsonNode = objectMapper.readTree(jsonInput);

    // Act
    boolean result = JsonUtility.containsFieldRecursive(jsonNode, "targetField");

    // Assert
    assertFalse(result);
  }

  @Test
  public void testGetFieldValueRecursive_FieldExists() throws Exception {
    // Arrange
    String jsonInput =
        "{\"level1\": { \"level2\": { \"level3\": { \"targetField\": \"value\" } } } }";
    JsonNode jsonNode = objectMapper.readTree(jsonInput);

    // Act
    JsonNode result = JsonUtility.getFieldValueRecursive(jsonNode, "targetField");

    // Assert
    assertNotNull(result);
    assertEquals("value", result.asText());
  }

  @Test
  public void testGetFieldValueRecursive_FieldDoesNotExist() throws Exception {
    // Arrange
    String jsonInput =
        "{\"level1\": { \"level2\": { \"level3\": { \"someOtherField\": \"value\" } } } }";
    JsonNode jsonNode = objectMapper.readTree(jsonInput);

    // Act
    JsonNode result = JsonUtility.getFieldValueRecursive(jsonNode, "targetField");

    // Assert
    assertNull(result);
  }
}
