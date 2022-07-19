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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.google.example.csvio.CSVRecordToRow.Result;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.schemas.Schema;
import org.apache.beam.sdk.schemas.Schema.FieldType;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.transforms.Count;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.Row;
import org.junit.jupiter.api.Test;

class CSVRecordToRowTest {

  private static final String RESOURCE_ID1 = "notrealfile1.csv";

  private static final String RESOURCE_ID2 = "notrealfile2.csv";

  private static final String REGISTERED_HEADER1 = "ID,NAME,VALUE";

  private static final String REGISTERED_HEADER2 = "ID,NAME,ACTIVE";

  private static final String UNREGISTERED_HEADER = "ID,NAME";

  private static final String UNREGISTERED_HEADER_ERROR = String.format(
      CSVRecordToRow.HEADER_ERROR_FORMAT, UNREGISTERED_HEADER);

  private static final Schema.Field ACTIVE_FIELD = Schema.Field.of("ACTIVE", FieldType.BOOLEAN);

  private static final Schema.Field ID_FIELD = Schema.Field.of("ID", FieldType.INT64);

  private static final Schema.Field NAME_FIELD = Schema.Field.of("NAME", FieldType.STRING);

  private static final Schema.Field VALUE_FIELD = Schema.Field.of("VALUE", FieldType.DOUBLE);

  private static final Schema SCHEMA1 = Schema.of(ID_FIELD, NAME_FIELD, VALUE_FIELD);
  private static final Schema SCHEMA2 = Schema.of(ID_FIELD, NAME_FIELD, ACTIVE_FIELD);

  private static final Map<String, Schema> HEADER_REGISTRY = new HashMap<>() {{
    this.put(REGISTERED_HEADER1, SCHEMA1);
    this.put(REGISTERED_HEADER2, SCHEMA2);
  }};

  private static final List<CSVRecord> REGISTERED_RECORDS = Arrays.asList(
      TestHelpers.recordFrom(RESOURCE_ID1, 1L, REGISTERED_HEADER1, "1,a,1.5"),
      TestHelpers.recordFrom(RESOURCE_ID1, 2L, REGISTERED_HEADER1, "2,b,2.5"),
      TestHelpers.recordFrom(RESOURCE_ID1, 3L, REGISTERED_HEADER1, "3,c,3.5"),
      TestHelpers.recordFrom(RESOURCE_ID2, 1L, REGISTERED_HEADER2, "1,a,true"),
      TestHelpers.recordFrom(RESOURCE_ID2, 2L, REGISTERED_HEADER2, "2,b,false"),
      TestHelpers.recordFrom(RESOURCE_ID2, 3L, REGISTERED_HEADER2, "3,c,true")
  );

  private static final List<CSVRecord> UNREGISTERED_RECORDS = Arrays.asList(
      TestHelpers.recordFrom(RESOURCE_ID1, 1L, UNREGISTERED_HEADER, "1,a"),
      TestHelpers.recordFrom(RESOURCE_ID1, 2L, UNREGISTERED_HEADER, "2,b"),
      TestHelpers.recordFrom(RESOURCE_ID1, 3L, UNREGISTERED_HEADER, "3,c")
  );

  private static final Map<String, List<Row>> EXPECTED_REGISTERED_ROWS = new HashMap<>() {{
    this.put(REGISTERED_HEADER1, Arrays.asList(
        Row.withSchema(SCHEMA1)
            .withFieldValue(ID_FIELD.getName(), 1L)
            .withFieldValue(NAME_FIELD.getName(), "a")
            .withFieldValue(VALUE_FIELD.getName(), 1.5)
            .build(),
        Row.withSchema(SCHEMA1)
            .withFieldValue(ID_FIELD.getName(), 2L)
            .withFieldValue(NAME_FIELD.getName(), "b")
            .withFieldValue(VALUE_FIELD.getName(), 2.5)
            .build(),
        Row.withSchema(SCHEMA1)
            .withFieldValue(ID_FIELD.getName(), 3L)
            .withFieldValue(NAME_FIELD.getName(), "c")
            .withFieldValue(VALUE_FIELD.getName(), 3.5)
            .build()
    ));
    this.put(REGISTERED_HEADER2, Arrays.asList(
        Row.withSchema(SCHEMA2)
            .withFieldValue(ID_FIELD.getName(), 1L)
            .withFieldValue(NAME_FIELD.getName(), "a")
            .withFieldValue(ACTIVE_FIELD.getName(), true)
            .build(),
        Row.withSchema(SCHEMA2)
            .withFieldValue(ID_FIELD.getName(), 2L)
            .withFieldValue(NAME_FIELD.getName(), "b")
            .withFieldValue(ACTIVE_FIELD.getName(), false)
            .build(),
        Row.withSchema(SCHEMA2)
            .withFieldValue(ID_FIELD.getName(), 3L)
            .withFieldValue(NAME_FIELD.getName(), "c")
            .withFieldValue(ACTIVE_FIELD.getName(), true)
            .build()
    ));
  }};

  private static final List<Row> ERRORS = Arrays.asList(
      TestHelpers.errorFrom(TestHelpers.recordFrom(RESOURCE_ID1, 1L, UNREGISTERED_HEADER, "1,a"),
          UNREGISTERED_HEADER_ERROR),
      TestHelpers.errorFrom(TestHelpers.recordFrom(RESOURCE_ID1, 2L, UNREGISTERED_HEADER, "2,b"),
          UNREGISTERED_HEADER_ERROR),
      TestHelpers.errorFrom(TestHelpers.recordFrom(RESOURCE_ID1, 3L, UNREGISTERED_HEADER, "3,c"),
          UNREGISTERED_HEADER_ERROR)
  );

  private static final List<TestCase> CASES = Arrays.asList(
      testCase(
          "records matching registered headers should populate success PCollection",
          REGISTERED_RECORDS,
          EXPECTED_REGISTERED_ROWS,
          Collections.emptyList()
      ),
      testCase(
          "records matching unregistered headers should populate failure PCollection",
          UNREGISTERED_RECORDS,
          new HashMap<>() {{
            this.put(REGISTERED_HEADER1, Collections.emptyList());
          }},
          ERRORS
      )
  );

  @Test
  void testRouteCSVRecordsToMatchingHeaderRegistry() {
    for (TestCase caze : CASES) {
      Pipeline p = Pipeline.create();
      PCollection<CSVRecord> input = p.apply(Create.of(caze.input));
      Result result = input.apply(CSVRecordToRow.builder()
          .setHeaderSchemaRegistry(HEADER_REGISTRY)
          .build());

      PAssert.that(caze.name, result.getFailure()).containsInAnyOrder(caze.expectedFailure);
      for (Entry<String, PCollection<Row>> actualSuccess : result.getSuccess().getAll()
          .entrySet()) {
        List<Row> expected = Collections.emptyList();
        if (caze.expectedSuccess.containsKey(actualSuccess.getKey())) {
          expected = caze.expectedSuccess.get(actualSuccess.getKey());
        }

        String name = String.format("%s/%s", caze.name, actualSuccess.getKey());
        PCollection<Row> actual = actualSuccess.getValue();

        long expectedSize = expected.size();
        PCollection<Long> actualSize = actual.apply(Count.globally());
        PAssert.that(name, actualSize).containsInAnyOrder(expectedSize);

        if (expectedSize == 0) {
          PAssert.that(name, actual).empty();
          return;
        }

        assertTrue(HEADER_REGISTRY.containsKey(actualSuccess.getKey()), name);
        Schema expectedSchema = HEADER_REGISTRY.get(actualSuccess.getKey());
        Schema actualSchema = actual.getSchema();
        assertEquals(expectedSchema, actualSchema, name);

        PAssert.that(name, actual).containsInAnyOrder(expected);
      }

      p.run().waitUntilFinish();
    }
  }

  private static TestCase testCase(String name, List<CSVRecord> input,
      Map<String, List<Row>> expectedSuccess, List<Row> expectedFailure) {
    return new TestCase(name, input, expectedSuccess, expectedFailure);
  }

  private static class TestCase {

    private final String name;
    private final List<CSVRecord> input;
    private final Map<String, List<Row>> expectedSuccess;
    private final List<Row> expectedFailure;

    private TestCase(String name, List<CSVRecord> input,
        Map<String, List<Row>> expectedSuccess, List<Row> expectedFailure) {
      this.name = name;
      this.input = input;
      this.expectedSuccess = expectedSuccess;
      this.expectedFailure = expectedFailure;
    }
  }
}