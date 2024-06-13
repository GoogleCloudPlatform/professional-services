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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

/**
 * Service responsible for replacing placeholders in template files.
 *
 * <p>This service loads template files from the classpath, replaces placeholder values with data
 * provided in a map, and returns the resulting string.
 */
@Service
public class PlaceholderReplacementService {

  private final ResourceLoader resourceLoader;

  @Autowired
  public PlaceholderReplacementService(ResourceLoader resourceLoader) {
    this.resourceLoader = resourceLoader;
  }

  /**
   * Replaces placeholders in the specified template file with values from the provided map.
   *
   * <p>Placeholders in the template are expected to be enclosed in curly braces (e.g.,
   * `{placeholder}`). The method searches for matching keys in the `replacements` map and replaces
   * the placeholders with their corresponding values.
   *
   * @param replacements A map containing key-value pairs where the keys are placeholders and the
   *     values are the strings to replace them with.
   * @param replacementFileName The name of the template file (without the ".txt" extension) located
   *     in the "classpath:templates/" directory.
   * @return A string with the placeholders replaced.
   * @throws IOException If the template file cannot be found or an error occurs while reading it.
   */
  public String replacePlaceholders(Map<String, String> replacements, String replacementFileName)
      throws IOException {
    String resourcePath = "classpath:templates/" + replacementFileName + ".txt";

    // Load the resource
    Resource resource = resourceLoader.getResource(resourcePath);
    String content = null;
    try (InputStream inputStream = resource.getInputStream();
        BufferedReader reader =
            new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
      content = reader.lines().collect(Collectors.joining(System.lineSeparator()));
    }

    // Perform the replacements, adding curly braces around the replacement values
    for (Map.Entry<String, String> entry : replacements.entrySet()) {
      content = content.replace("{" + entry.getKey() + "}", entry.getValue());
    }

    return content;
  }
}
