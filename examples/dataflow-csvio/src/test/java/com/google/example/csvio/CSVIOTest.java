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

import com.google.example.csvio.CSVIO.Read.CSVIOReadResult;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.transforms.Filter;
import org.apache.beam.sdk.transforms.SimpleFunction;
import org.apache.beam.sdk.values.PCollection;
import org.junit.jupiter.api.Test;

class CSVIOTest {

  private static final String DIRECTORY = "src/test/resources/com/google/example/csvio/readTest";

  private static final String FILE_PATTERN = DIRECTORY + "/*.csv";

  private static final String HEADER1 = "ID,NAME";

  private static final String HEADER2 = "ID,VALUE";

  private static final List<ContextualCSVRecord> HEADER1_EXPECTED_ROWS =
      Arrays.asList(
          TestHelpers.contextualCSVRecordFrom(resourceId(1), 1L, HEADER1, "97,a"),
          TestHelpers.contextualCSVRecordFrom(resourceId(1), 2L, HEADER1, "98,b"),
          TestHelpers.contextualCSVRecordFrom(resourceId(1), 3L, HEADER1, "99,c"),
          TestHelpers.contextualCSVRecordFrom(resourceId(2), 1L, HEADER1, "100,d"),
          TestHelpers.contextualCSVRecordFrom(resourceId(2), 2L, HEADER1, "101,e"),
          TestHelpers.contextualCSVRecordFrom(resourceId(2), 3L, HEADER1, "102,f"),
          TestHelpers.contextualCSVRecordFrom(resourceId(3), 1L, HEADER1, "103,g"),
          TestHelpers.contextualCSVRecordFrom(resourceId(3), 2L, HEADER1, "104,h"),
          TestHelpers.contextualCSVRecordFrom(resourceId(3), 3L, HEADER1, "105,i"));

  private static final List<ContextualCSVRecord> HEADER2_EXPECTED_ROWS =
      Arrays.asList(
          TestHelpers.contextualCSVRecordFrom(resourceId(4), 1L, HEADER2, "1,0.5"),
          TestHelpers.contextualCSVRecordFrom(resourceId(4), 2L, HEADER2, "2,1.0"),
          TestHelpers.contextualCSVRecordFrom(resourceId(4), 3L, HEADER2, "3,1.5"),
          TestHelpers.contextualCSVRecordFrom(resourceId(5), 1L, HEADER2, "4,2.0"),
          TestHelpers.contextualCSVRecordFrom(resourceId(5), 2L, HEADER2, "5,2.5"),
          TestHelpers.contextualCSVRecordFrom(resourceId(5), 3L, HEADER2, "6,3.0"),
          TestHelpers.contextualCSVRecordFrom(resourceId(6), 1L, HEADER2, "7,3.5"),
          TestHelpers.contextualCSVRecordFrom(resourceId(6), 2L, HEADER2, "8,4.0"),
          TestHelpers.contextualCSVRecordFrom(resourceId(6), 3L, HEADER2, "9,4.5"));

  private static final Map<String, List<ContextualCSVRecord>> EXPECTED =
      new HashMap<>() {
        {
          this.put(HEADER1, HEADER1_EXPECTED_ROWS);
          this.put(HEADER2, HEADER2_EXPECTED_ROWS);
        }
      };

  @Test
  void read() {
    Pipeline p = TestHelpers.createTestPipeline();
    CSVIOReadConfiguration configuration =
        CSVIOReadConfiguration.builder().setFilePattern(FILE_PATTERN).build();

    CSVIOReadResult CSVIOReadResult = p.apply(CSVIO.read().setConfiguration(configuration).build());

    for (Entry<String, List<ContextualCSVRecord>> expected : EXPECTED.entrySet()) {
      PCollection<ContextualCSVRecord> actual =
          CSVIOReadResult.getSuccess().apply(Filter.by(new FilterByHeader(expected.getKey())));
      PAssert.that(expected.getKey(), actual).containsInAnyOrder(expected.getValue());
    }

    p.run().waitUntilFinish();
  }

  private static class FilterByHeader extends SimpleFunction<ContextualCSVRecord, Boolean> {

    private final String header;

    private FilterByHeader(String header) {
      this.header = header;
    }

    @Override
    public Boolean apply(ContextualCSVRecord input) {
      String header = input.getHeader();
      if (header == null) {
        return false;
      }
      return header.equals(this.header);
    }
  }

  private static String resourceId(int i) {
    return String.format("%s/%d.csv", DIRECTORY, i);
  }
}
