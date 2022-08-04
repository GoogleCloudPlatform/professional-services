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
import com.google.example.csvio.SortContextualHeadersAndRows.SortContextualHeadersAndRowsResult;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.contextualtextio.RecordWithMetadata;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.Row;
import org.junit.jupiter.api.Test;

class JoinContextualHeadersAndRowsTest {

  private static final String FILE_NAME1 = "some/path/to/foo.csv";

  private static final String FILE_NAME2 = "some/path/to/bar.csv";

  private static final String FILE_NAME3 = "some/path/to/baz.csv";

  private static final String HEADER = "ID,NAME,ACTIVE";

  private static final List<Row> INPUT_HEADERS =
      Arrays.asList(
          TestHelpers.rowFrom(FILE_NAME1, HEADER, 0L),
          TestHelpers.rowFrom(FILE_NAME2, HEADER, 0L),
          TestHelpers.rowFrom(FILE_NAME3, HEADER, 0L));

  private static final List<Row> INPUT_ROWS =
      Arrays.asList(
          TestHelpers.rowFrom(FILE_NAME1, "1,a,true", 1L),
          TestHelpers.rowFrom(FILE_NAME2, "2,b,false", 1L),
          TestHelpers.rowFrom(FILE_NAME3, "3,c,true", 1L),
          TestHelpers.rowFrom(FILE_NAME1, "4,d,true", 2L),
          TestHelpers.rowFrom(FILE_NAME2, "5,e,false", 2L),
          TestHelpers.rowFrom(FILE_NAME3, "6,f,true", 2L));

  private static final List<ContextualCSVRecord> EXPECTED_SUCCESS =
      Arrays.asList(
          TestHelpers.contextualCSVRecordFrom(FILE_NAME1, 1L, HEADER, "1,a,true"),
          TestHelpers.contextualCSVRecordFrom(FILE_NAME2, 1L, HEADER, "2,b,false"),
          TestHelpers.contextualCSVRecordFrom(FILE_NAME3, 1L, HEADER, "3,c,true"),
          TestHelpers.contextualCSVRecordFrom(FILE_NAME1, 2L, HEADER, "4,d,true"),
          TestHelpers.contextualCSVRecordFrom(FILE_NAME2, 2L, HEADER, "5,e,false"),
          TestHelpers.contextualCSVRecordFrom(FILE_NAME3, 2L, HEADER, "6,f,true"));

  private static final List<Row> EXPECTED_FAILURE =
      Arrays.asList(
          TestHelpers.errorFrom(
              TestHelpers.contextualCSVRecordFrom(FILE_NAME1, 1L, "", "1,a,true"),
              JoinContextualHeadersAndRows.NULL_HEADER_MESSAGE),
          TestHelpers.errorFrom(
              TestHelpers.contextualCSVRecordFrom(FILE_NAME2, 1L, "", "2,b,false"),
              JoinContextualHeadersAndRows.NULL_HEADER_MESSAGE),
          TestHelpers.errorFrom(
              TestHelpers.contextualCSVRecordFrom(FILE_NAME3, 1L, "", "3,c,true"),
              JoinContextualHeadersAndRows.NULL_HEADER_MESSAGE),
          TestHelpers.errorFrom(
              TestHelpers.contextualCSVRecordFrom(FILE_NAME1, 2L, "", "4,d,true"),
              JoinContextualHeadersAndRows.NULL_HEADER_MESSAGE),
          TestHelpers.errorFrom(
              TestHelpers.contextualCSVRecordFrom(FILE_NAME2, 2L, "", "5,e,false"),
              JoinContextualHeadersAndRows.NULL_HEADER_MESSAGE),
          TestHelpers.errorFrom(
              TestHelpers.contextualCSVRecordFrom(FILE_NAME3, 2L, "", "6,f,true"),
              JoinContextualHeadersAndRows.NULL_HEADER_MESSAGE));

  private static final List<TestCase> CASES =
      Arrays.asList(
          testCase(
              "headers with rows should populate success PCollection",
              INPUT_HEADERS,
              EXPECTED_SUCCESS,
              Collections.emptyList()),
          testCase(
              "rows only PCollections should populate failure PCollection",
              Collections.emptyList(),
              Collections.emptyList(),
              EXPECTED_FAILURE));

  @Test
  void testJoinContextualHeadersAndRows() {
    for (TestCase caze : CASES) {
      Pipeline p = caze.getPipeline();
      CSVIOReadResult actual = caze.input.apply(new JoinContextualHeadersAndRows());
      PAssert.that(caze.name, actual.getSuccess()).containsInAnyOrder(caze.expectedSuccess);
      PAssert.that(caze.name, actual.getFailure()).containsInAnyOrder(caze.expectedFailure);

      p.run().waitUntilFinish();
    }
  }

  private static TestCase testCase(
      String name,
      List<Row> headers,
      List<ContextualCSVRecord> expectedSuccess,
      List<Row> expectedFailure) {
    return new TestCase(
        name,
        headers,
        JoinContextualHeadersAndRowsTest.INPUT_ROWS,
        expectedSuccess,
        expectedFailure);
  }

  private static class TestCase {

    private final Pipeline p = TestHelpers.createTestPipeline();
    private final String name;
    private final SortContextualHeadersAndRowsResult input;
    private final List<ContextualCSVRecord> expectedSuccess;
    private final List<Row> expectedFailure;

    private TestCase(
        String name,
        List<Row> headers,
        List<Row> rows,
        List<ContextualCSVRecord> expectedSuccess,
        List<Row> expectedFailure) {
      this.name = name;
      PCollectionTuple input =
          PCollectionTuple.of(
                  SortContextualHeadersAndRows.HEADERS,
                  p.apply(Create.of(headers).withRowSchema(RecordWithMetadata.getSchema())))
              .and(
                  SortContextualHeadersAndRows.ROWS,
                  p.apply(Create.of(rows).withRowSchema(RecordWithMetadata.getSchema())));
      this.input = new SortContextualHeadersAndRowsResult(input);
      this.expectedSuccess = expectedSuccess;
      this.expectedFailure = expectedFailure;
    }

    private Pipeline getPipeline() {
      return p;
    }
  }
}
