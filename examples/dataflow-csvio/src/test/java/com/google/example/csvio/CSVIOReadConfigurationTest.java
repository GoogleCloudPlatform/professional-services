/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.google.example.csvio;

import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

class CSVIOReadConfigurationTest {

  private static final List<TestCase> cases = Arrays.asList(
      testCase(
          "default configuration should be valid",
          CSVIOReadConfiguration.builder().setFilePattern("source")
      ),
      testCase(
          "fixed header >= 0 should be valid",
          CSVIOReadConfiguration.builder().setFilePattern("source")
              .setHeaderPosition(0L)
      ),
      testCase(
          "setting header regex match only should be valid",
          CSVIOReadConfiguration.builder().setFilePattern("source")
              .setHeaderMatchRegex("id,name,active")
      ),
      testCase(
          "setting both header position and header regex should be invalid",
          CSVIOReadConfiguration.builder().setFilePattern("source")
              .setHeaderMatchRegex("^matchme.*$")
              .setHeaderPosition(1L)
      ).inValidExpected(),
      testCase(
          "setting header position < 0 should be invalid",
          CSVIOReadConfiguration.builder().setFilePattern("source")
              .setHeaderPosition(-1L)
      ).inValidExpected(),
      testCase(
          "setting empty regex match should be invalid",
          CSVIOReadConfiguration.builder().setFilePattern("source")
              .setHeaderMatchRegex("")
      ).inValidExpected()
  );

  @Test
  void validate() {
    for (TestCase caze : cases) {
      CSVIOReadConfiguration configuration = caze.input.build();
      if (!caze.expectValid) {
        assertThrows(IllegalArgumentException.class, configuration::validate, caze.name);
      }
    }
  }

  private static TestCase testCase(String name, CSVIOReadConfiguration.Builder input) {
    return new TestCase(name, input);
  }

  private static class TestCase {

    private final String name;
    private final CSVIOReadConfiguration.Builder input;
    private boolean expectValid = true;

    TestCase(String name, CSVIOReadConfiguration.Builder input) {
      this.name = name;
      this.input = input;
    }

    TestCase inValidExpected() {
      this.expectValid = false;
      return this;
    }
  }
}