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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.contextualtextio.ContextualTextIO;
import org.apache.beam.sdk.io.contextualtextio.RecordWithMetadata;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.Filter;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.SimpleFunction;
import org.apache.beam.sdk.transforms.Values;
import org.apache.beam.sdk.transforms.View;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.PCollectionView;
import org.apache.beam.sdk.values.Row;
import org.apache.beam.sdk.values.TupleTagList;
import org.junit.jupiter.api.Test;

class SortContextualHeadersAndRowsTest {

  private static final String EMPTY_SPACE_BEFORE_HEADER = "emptyspacebeforeheader.csv";
  private static final String HEADER_AT_FIRST_POSITION = "headeratfirstposition.csv";
  private static final String HEADER_AT_NON_ZERO_POSITION = "headeratnonzeroposition.csv";
  private static final String SPACE_BETWEEN_ROWS = "spacebetweenrows.csv";

  private static final Map<String, Long> EXPECT_HEADER_POSITION = new HashMap<>() {{
    this.put(absolutePath(EMPTY_SPACE_BEFORE_HEADER), 3L);
    this.put(absolutePath(HEADER_AT_FIRST_POSITION), 0L);
    this.put(absolutePath(HEADER_AT_NON_ZERO_POSITION), 3L);
    this.put(absolutePath(SPACE_BETWEEN_ROWS), 0L);
  }};

  private static final String EXPECT_HEADER = "ID,NAME,ACTIVE";
  private static final List<String> EXPECT_ROWS = Arrays.asList(
      "1,foo,true",
      "2,bar,false",
      "4,baz,true"
  );

  private static final List<TestCase> CASES = Arrays.asList(
      testCase(CSVIOReadConfiguration.builder(), EMPTY_SPACE_BEFORE_HEADER)
          .withExpectedRawRowOffsets(Arrays.asList(0L, 1L, 2L, 3L, 4L, 5L, 6L))
          .withExpectedNonEmptyRowOffsets(Arrays.asList(3L, 4L, 5L, 6L)),
      testCase(CSVIOReadConfiguration.builder(), HEADER_AT_FIRST_POSITION)
          .withExpectedRawRowOffsets(Arrays.asList(0L, 1L, 2L, 3L))
          .withExpectedNonEmptyRowOffsets(Arrays.asList(0L, 1L, 2L, 3L)),
      testCase(CSVIOReadConfiguration.builder(), HEADER_AT_NON_ZERO_POSITION)
          .withExpectedRawRowOffsets(Arrays.asList(0L, 1L, 2L, 3L, 4L, 5L, 6L))
          .withExpectedNonEmptyRowOffsets(Arrays.asList(0L, 1L, 2L, 3L, 4L, 5L, 6L)),
      testCase(CSVIOReadConfiguration.builder(), SPACE_BETWEEN_ROWS)
          .withExpectedRawRowOffsets(Arrays.asList(0L, 1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L))
          .withExpectedNonEmptyRowOffsets(Arrays.asList(0L, 1L, 6L, 10L))
  );

  @Test
  void testSortContextualHeadersAndRows() {
    for (Map.Entry<String, Long> entry : EXPECT_HEADER_POSITION.entrySet()) {
      Pipeline p = Pipeline.create();
      PCollection<Row> input = readCSV(p, entry.getKey());
      Long expectedHeaderPosition = entry.getValue();
      CSVIOReadConfiguration configuration = CSVIOReadConfiguration.builder()
          .setFilePattern(entry.getKey())
          .setHeaderPosition(expectedHeaderPosition)
          .build();

      SortContextualHeadersAndRows.Result result = input.apply(
          SortContextualHeadersAndRows.builder()
              .setConfiguration(configuration)
              .build()
      );

      PCollection<String> actualHeader = headers(result);
      PAssert.that(entry.getKey(), actualHeader).containsInAnyOrder(EXPECT_HEADER);
      PCollection<String> actualRows = rows(result);
      PAssert.that(entry.getKey(), actualRows).containsInAnyOrder(EXPECT_ROWS);

      p.run().waitUntilFinish();
    }
  }

  @Test
  void testSortFixedHeaderAndRows() {
    for (TestCase caze : CASES) {
      Pipeline p = Pipeline.create();
      PCollection<Row> input = readCSV(p, caze.getResourceNameAbsolutePath());
      String resourceId = caze.getResourceNameAbsolutePath();
      Long expectedHeaderPosition = EXPECT_HEADER_POSITION.get(resourceId);

      CSVIOReadConfiguration configuration = caze.configuration
          .setHeaderPosition(expectedHeaderPosition)
          .build();

      SortContextualHeadersAndRows.Result result = input.apply(
          new SortContextualHeadersAndRows.SortFixedHeaderAndRows(configuration)
      );

      PCollection<String> actualHeader = headers(result);
      PAssert.that(caze.resourceName, actualHeader).containsInAnyOrder(EXPECT_HEADER);
      PCollection<String> actualRows = rows(result).apply(Filter.by((value) -> !value.isEmpty()));
      PAssert.that(caze.resourceName, actualRows).containsInAnyOrder(EXPECT_ROWS);

      p.run().waitUntilFinish();
    }
  }

  @Test
  void testSortMatchedHeaderAndRows() {
    for (TestCase caze : CASES) {
      Pipeline p = Pipeline.create();
      PCollection<Row> input = readCSV(p, caze.getResourceNameAbsolutePath());
      CSVIOReadConfiguration configuration = caze.configuration
          .setHeaderMatchRegex(EXPECT_HEADER)
          .build();

      SortContextualHeadersAndRows.Result result = input.apply(
          new SortContextualHeadersAndRows.SortMatchedHeaderAndRows(configuration)
      );
      PCollection<String> actualHeader = headers(result);
      PAssert.that(caze.resourceName, actualHeader).containsInAnyOrder(EXPECT_HEADER);
      PCollection<String> actualRows = rows(result).apply(Filter.by((value) -> !value.isEmpty()));
      PAssert.that(caze.resourceName, actualRows).containsInAnyOrder(EXPECT_ROWS);

      p.run().waitUntilFinish();
    }
  }

  @Test
  void testSortMinimumHeaderAndRows() {
    Pipeline p = Pipeline.create();
    TestCase caze = testCase(CSVIOReadConfiguration.builder(), EMPTY_SPACE_BEFORE_HEADER);
    PCollection<Row> input = readCSV(p, caze.getResourceNameAbsolutePath());
    SortContextualHeadersAndRows.Result result = input
        .apply(new SortContextualHeadersAndRows.SortMinimumHeaderAndRows());
    PCollection<String> actualHeader = headers(result);
    PAssert.that(caze.resourceName, actualHeader).containsInAnyOrder(EXPECT_HEADER);
    PCollection<String> actualRows = rows(result);
    PAssert.that(caze.resourceName, actualRows).containsInAnyOrder(EXPECT_ROWS);

    p.run().waitUntilFinish();
  }

  @Test
  void testSortFixedPositionHeadersAndRowsFn() {
    for (TestCase caze : CASES) {
      Pipeline p = Pipeline.create();
      String resourceId = caze.getResourceNameAbsolutePath();
      Long expectedHeaderPosition = EXPECT_HEADER_POSITION.get(resourceId);
      PCollectionView<Long> headerPositionView = p
          .apply(Create.of(expectedHeaderPosition))
          .apply(View.asSingleton());
      PCollection<Row> input = readCSV(p, caze.getResourceNameAbsolutePath());
      PCollectionTuple pct = input.apply(ParDo.of(
          new SortContextualHeadersAndRows.SortFixedPositionHeadersAndRowsFn(headerPositionView)
      ).withSideInput("", headerPositionView).withOutputTags(
          SortContextualHeadersAndRows.HEADERS,
          TupleTagList.of(SortContextualHeadersAndRows.ROWS)));

      SortContextualHeadersAndRows.Result result = new SortContextualHeadersAndRows.Result(pct);
      PCollection<String> actualHeader = headers(result);
      PAssert.that(caze.resourceName, actualHeader).containsInAnyOrder(EXPECT_HEADER);
      PCollection<String> actualRows = rows(result).apply(Filter.by((value) -> !value.isEmpty()));
      PAssert.that(caze.resourceName, actualRows).containsInAnyOrder(EXPECT_ROWS);

      p.run().waitUntilFinish();
    }
  }

  @Test
  void testFindMatchedHeaderFn() {
    for (TestCase caze : CASES) {
      Pipeline p = Pipeline.create();
      PCollection<Row> input = readCSV(p, caze.getResourceNameAbsolutePath());
      PCollectionView<String> headerMatchRegexView = p.apply(Create.of(EXPECT_HEADER))
          .apply(View.asSingleton());
      String resourceId = caze.getResourceNameAbsolutePath();
      Long expectedHeaderPosition = EXPECT_HEADER_POSITION.get(resourceId);
      List<KV<String, Long>> expected = Collections.singletonList(
          KV.of(resourceId, expectedHeaderPosition));

      PCollection<KV<String, Long>> actual = input
          .apply(ParDo.of(
              new SortContextualHeadersAndRows.FindMatchedHeaderFn(headerMatchRegexView)
          ).withSideInput("", headerMatchRegexView));

      PAssert.that(caze.resourceName, actual).containsInAnyOrder(expected);

      p.run().waitUntilFinish();
    }
  }

  @Test
  void testSortMappedFixedPositionHeadersAndRowsFn() {
    for (TestCase caze : CASES) {
      Pipeline p = Pipeline.create();
      PCollection<Row> input = readCSV(p, caze.getResourceNameAbsolutePath());
      PCollectionView<Map<String, Long>> mappedResourceIdHeaderPositionView =
          expectMappedResourceIdHeaderPositionView(p);
      PCollectionTuple pct = input
          .apply(ParDo.of(
                  new SortContextualHeadersAndRows
                      .SortMappedFixedPositionHeadersAndRowsFn(mappedResourceIdHeaderPositionView)
              ).withSideInput("", mappedResourceIdHeaderPositionView).withOutputTags(
                  SortContextualHeadersAndRows.HEADERS,
                  TupleTagList.of(SortContextualHeadersAndRows.ROWS))
          );
      SortContextualHeadersAndRows.Result result = new SortContextualHeadersAndRows.Result(pct);
      PCollection<String> actualHeader = headers(result);
      PAssert.that(caze.resourceName, actualHeader).containsInAnyOrder(EXPECT_HEADER);
      PCollection<String> actualRows = rows(result).apply(Filter.by((value) -> !value.isEmpty()));
      PAssert.that(caze.resourceName, actualRows).containsInAnyOrder(EXPECT_ROWS);

      p.run().waitUntilFinish();
    }
  }

  @Test
  void testIsNotEmptyFn() {
    for (TestCase caze : CASES) {
      Pipeline p = Pipeline.create();
      PCollection<Long> actual = readCSV(p, caze.getResourceNameAbsolutePath())
          .apply(Filter.by(new SortContextualHeadersAndRows.IsNotEmptyFn()))
          .apply(MapElements.via(new SortContextualHeadersAndRows.RowKVFn()))
          .apply(Values.create());
      PAssert.that(caze.resourceName, actual).containsInAnyOrder(caze.expectNonEmptyOffsets);
      p.run().waitUntilFinish();
    }
  }

  @Test
  void testRowKVFn() {
    for (TestCase caze : CASES) {
      Pipeline p = Pipeline.create();
      PCollection<KV<String, Long>> actual = readCSV(p, caze.getResourceNameAbsolutePath())
          .apply(MapElements.via(new SortContextualHeadersAndRows.RowKVFn()));
      List<KV<String, Long>> expectOffsetKV = caze.buildExpectedRawOffsetKV();
      PAssert.that(caze.resourceName, actual).containsInAnyOrder(expectOffsetKV);
      p.run().waitUntilFinish();
    }
  }

  static PCollection<Row> readCSV(Pipeline p, String resourceName) {
    return p.apply(ContextualTextIO.read().from(resourceName).withRecordNumMetadata());
  }

  static PCollectionView<Map<String, Long>> expectMappedResourceIdHeaderPositionView(Pipeline p) {
    return p.apply(Create.of(EXPECT_HEADER_POSITION)).apply(View.asMap());
  }

  static PCollection<String> values(PCollection<Row> input) {
    return input.apply(MapElements.via(new SimpleFunction<Row, String>() {
      @Override
      public String apply(Row input) {
        return input.getString(RecordWithMetadata.VALUE);
      }
    }));
  }

  static PCollection<String> headers(SortContextualHeadersAndRows.Result result) {
    return values(result.getHeaders());
  }

  static PCollection<String> rows(SortContextualHeadersAndRows.Result result) {
    return values(result.getRows());
  }

  private static TestCase testCase(CSVIOReadConfiguration.Builder configuration,
      String resourceName) {
    return new TestCase(configuration, resourceName);
  }

  private static class TestCase {

    private final CSVIOReadConfiguration.Builder configuration;
    private final String resourceName;

    private List<Long> expectedOffsets = Collections.emptyList();

    private List<Long> expectNonEmptyOffsets = Collections.emptyList();

    private TestCase(CSVIOReadConfiguration.Builder configuration, String resourceName) {
      this.configuration = configuration.setFilePattern(resourceName);
      this.resourceName = resourceName;
    }

    private TestCase withExpectedRawRowOffsets(List<Long> value) {
      this.expectedOffsets = value;
      return this;
    }

    private TestCase withExpectedNonEmptyRowOffsets(List<Long> value) {
      this.expectNonEmptyOffsets = value;
      return this;
    }

    private String getResourceNameAbsolutePath() {
      if (resourceName == null) {
        return "";
      }
      return absolutePath(resourceName);
    }

    private List<KV<String, Long>> buildExpectedRawOffsetKV() {
      List<KV<String, Long>> result = new ArrayList<>();
      if (resourceName == null) {
        return result;
      }
      String resource = getResourceNameAbsolutePath();
      for (Long offset : expectedOffsets) {
        result.add(KV.of(resource, offset));
      }
      return result;
    }
  }

  private static String absolutePath(String resourceName) {
    return Objects.requireNonNull(SortContextualHeadersAndRowsTest.class.getResource(resourceName))
        .getFile();
  }
}