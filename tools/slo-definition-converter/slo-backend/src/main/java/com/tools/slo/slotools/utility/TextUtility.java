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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/** Utility class for various text manipulation operations. */
public class TextUtility {

  /**
   * Converts an input string into a format suitable for use in a "join" operation within Terraform
   * configuration.
   *
   * <p>This method performs the following steps:
   *
   * <ol>
   *   <li>Splits the input string into individual key-value pairs (e.g., "metric.type=\"...\"
   *       resource.type=\"...\"").
   *   <li>Wraps each key-value pair in double quotes.
   *   <li>Escapes double quotes within each pair with a single backslash.
   *   <li>Constructs a string using the "join" function with "AND" as the delimiter and the
   *       modified key-value pairs as the elements to join.
   * </ol>
   *
   * @param input The input string containing key-value pairs.
   * @return A formatted string suitable for use in a Terraform "join" operation.
   */
  public static String convertToJoinFormat(String input) {
    // Split the input string by space to get individual key-value pairs
    List<String> keyValuePairs = new ArrayList<>(Arrays.asList(input.split(" ")));
    keyValuePairs.removeAll(Arrays.asList("AND"));
    // Wrap each key-value pair in double quotes and add a single backslash to escape the quotes
    List<String> quotedKeyValuePairs =
        keyValuePairs.stream()
            .map(pair -> "\"" + pair.replace("\"", "\\\"") + "\"")
            .collect(Collectors.toList());

    // Create the formatted string with single backslashes as escape characters
    String result = "join(\" AND \", [" + String.join(", ", quotedKeyValuePairs) + "])";

    return result;
  }
}
