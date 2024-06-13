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

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Iterator;
import java.util.Map;

/**
 * Utility class for working with JSON data structures (JsonNode).
 *
 * <p>Provides methods to recursively search for fields within JSON objects and retrieve their
 * values.
 */
public class JsonUtility {

  /**
   * Recursively searches for the specified field name within the given JSON node and returns its
   * value.
   *
   * @param node The JSON node to search within.
   * @param fieldName The name of the field to retrieve the value for.
   * @return The JsonNode representing the value of the field, or {@code null} if the field is not
   *     found.
   */
  public static boolean containsFieldRecursive(JsonNode node, String fieldName) {
    if (node.has(fieldName)) {
      return true;
    }
    Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
    while (fields.hasNext()) {
      Map.Entry<String, JsonNode> entry = fields.next();
      if (entry.getValue().isObject()) {
        if (containsFieldRecursive(entry.getValue(), fieldName)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Recursively searches a JSON tree (JsonNode) for a field with the given name.
   *
   * <p>This method traverses the JSON tree depth-first, examining each object's fields. If the
   * specified field is found, its value is returned. If the field does not exist within the tree,
   * `null` is returned.
   *
   * @param node The root JsonNode to start the search from.
   * @param fieldName The name of the field to search for.
   * @return The JsonNode representing the value of the field, if found; otherwise, `null`.
   */
  public static JsonNode getFieldValueRecursive(JsonNode node, String fieldName) {
    if (node.has(fieldName)) {
      return node.get(fieldName);
    }
    Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
    while (fields.hasNext()) {
      Map.Entry<String, JsonNode> entry = fields.next();
      if (entry.getValue().isObject()) {
        JsonNode result = getFieldValueRecursive(entry.getValue(), fieldName);
        if (result != null) {
          return result;
        }
      }
    }
    return null;
  }
}
