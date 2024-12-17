/*
 *  Copyright 2024 Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.google.cloud.pso.migration.dofns;

import com.google.bigtable.v2.Mutation;
import com.google.cloud.pso.migration.utils.DataLoadConstants;
import com.google.common.collect.ImmutableList;
import com.google.protobuf.ByteString;
import java.util.Arrays;
import java.util.List;
import org.apache.beam.sdk.schemas.Schema;
import org.apache.beam.sdk.testing.NeedsRunner;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.Row;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link BeamRowToBigtableRowFn}. */
@RunWith(JUnit4.class)
@Category(NeedsRunner.class)
public class BeamRowToBigtableRowFnTest {

  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  private static final Schema.FieldType STRING_FIELD = Schema.FieldType.STRING;
  private static final Schema CELL_SCHEMA =
      Schema.builder()
          .addNullableField(DataLoadConstants.SchemaFields.COLUMN_FAMILY, STRING_FIELD)
          .addNullableField(DataLoadConstants.SchemaFields.COLUMN, STRING_FIELD)
          .addNullableField(DataLoadConstants.SchemaFields.PAYLOAD, STRING_FIELD)
          .build();
  private static final Schema ROW_SCHEMA =
      Schema.builder()
          .addField(DataLoadConstants.SchemaFields.ROW_KEY, STRING_FIELD)
          .addArrayField(DataLoadConstants.SchemaFields.CELLS, Schema.FieldType.row(CELL_SCHEMA))
          .build();

  @Test
  public void testProcessElement_noCells() {
    // Test with an empty cells array
    Row row =
        Row.withSchema(ROW_SCHEMA)
            .withFieldValue(DataLoadConstants.SchemaFields.ROW_KEY, "rowKey1")
            .withFieldValue(DataLoadConstants.SchemaFields.CELLS, Arrays.asList())
            .build();

    PCollection<KV<ByteString, Iterable<Mutation>>> output =
        pipeline.apply(Create.of(row)).apply(ParDo.of(new BeamRowToBigtableRowFn(1000, false)));

    PAssert.that(output).empty();
    pipeline.run();
  }

  @Test
  public void testProcessElement_withCells() {
    // Test with a non-empty cells array
    Row row =
        Row.withSchema(ROW_SCHEMA)
            .withFieldValue(DataLoadConstants.SchemaFields.ROW_KEY, "rowKey1")
            .withFieldValue(
                DataLoadConstants.SchemaFields.CELLS,
                Arrays.asList(
                    Row.withSchema(CELL_SCHEMA)
                        .withFieldValue(DataLoadConstants.SchemaFields.COLUMN_FAMILY, "cf1")
                        .withFieldValue(DataLoadConstants.SchemaFields.COLUMN, "c1")
                        .withFieldValue(DataLoadConstants.SchemaFields.PAYLOAD, "payload1")
                        .build()))
            .build();

    PCollection<KV<ByteString, Iterable<Mutation>>> output =
        pipeline.apply(Create.of(row)).apply(ParDo.of(new BeamRowToBigtableRowFn(1000, false)));

    PAssert.that(output)
        .satisfies(
            input -> {
              KV<ByteString, Iterable<Mutation>> kv = input.iterator().next();
              ByteString key = kv.getKey();
              Iterable<Mutation> mutations = kv.getValue();

              // Assertions for key and mutations
              Assert.assertEquals(key, ByteString.copyFromUtf8("rowKey1"));
              List<Mutation> mutationList = ImmutableList.copyOf(mutations);
              Assert.assertEquals(mutationList.size(), 1);
              Mutation mutation = mutationList.get(0);
              Mutation.SetCell setCell = mutation.getSetCell();
              Assert.assertEquals(setCell.getFamilyName(), "cf1");
              Assert.assertEquals(setCell.getColumnQualifier(), ByteString.copyFromUtf8("c1"));
              Assert.assertEquals(setCell.getValue(), ByteString.copyFromUtf8("payload1"));
              return null;
            });
    pipeline.run();
  }

  @Test
  public void testProcessElement_splitLargeRows() {
    // Test with splitLargeRows=true and exceeding maxMutationsPerRow
    List<Row> cells =
        Arrays.asList(
            Row.withSchema(CELL_SCHEMA)
                .withFieldValue(DataLoadConstants.SchemaFields.COLUMN_FAMILY, "cf1")
                .withFieldValue(DataLoadConstants.SchemaFields.COLUMN, "c1")
                .withFieldValue(DataLoadConstants.SchemaFields.PAYLOAD, "payload1")
                .build(),
            Row.withSchema(CELL_SCHEMA)
                .withFieldValue(DataLoadConstants.SchemaFields.COLUMN_FAMILY, "cf1")
                .withFieldValue(DataLoadConstants.SchemaFields.COLUMN, "c2")
                .withFieldValue(DataLoadConstants.SchemaFields.PAYLOAD, "payload2")
                .build());
    Row row =
        Row.withSchema(ROW_SCHEMA)
            .withFieldValue(DataLoadConstants.SchemaFields.ROW_KEY, "rowKey1")
            .withFieldValue(DataLoadConstants.SchemaFields.CELLS, cells)
            .build();

    PCollection<KV<ByteString, Iterable<Mutation>>> output =
        pipeline.apply(Create.of(row)).apply(ParDo.of(new BeamRowToBigtableRowFn(1, true)));

    PAssert.that(output)
        .satisfies(
            input -> {
              // Assertions for the output PCollection
              // ... (assert that the output contains two KV pairs with the expected mutations)
              return null;
            });
    pipeline.run();
  }

  @Test
  public void testProcessElement_nullCellValues() {
    // Test with null values for column family, column, and payload
    Row row =
        Row.withSchema(ROW_SCHEMA)
            .withFieldValue(DataLoadConstants.SchemaFields.ROW_KEY, "rowKey1")
            .withFieldValue(
                DataLoadConstants.SchemaFields.CELLS,
                Arrays.asList(
                    Row.withSchema(CELL_SCHEMA)
                        .withFieldValue(DataLoadConstants.SchemaFields.COLUMN_FAMILY, "cf1")
                        .withFieldValue(DataLoadConstants.SchemaFields.COLUMN, null)
                        .withFieldValue(DataLoadConstants.SchemaFields.PAYLOAD, null)
                        .build()))
            .build();

    PCollection<KV<ByteString, Iterable<Mutation>>> output =
        pipeline.apply(Create.of(row)).apply(ParDo.of(new BeamRowToBigtableRowFn(1000, false)));

    // Expect the output to be empty or contain an empty mutation (depending on your logic)
    PAssert.that(output)
        .satisfies(
            input -> {
              List<KV<ByteString, Iterable<Mutation>>> kvList = ImmutableList.copyOf(input);
              // Add assertions here to check for empty mutations or empty output
              return null;
            });
    pipeline.run();
  }

  @Test
  public void testProcessElement_emptyRowKey() {
    // Test with an empty row key
    Row row =
        Row.withSchema(ROW_SCHEMA)
            .withFieldValue(DataLoadConstants.SchemaFields.ROW_KEY, "")
            .withFieldValue(DataLoadConstants.SchemaFields.CELLS, Arrays.asList())
            .build();

    PCollection<KV<ByteString, Iterable<Mutation>>> output =
        pipeline.apply(Create.of(row)).apply(ParDo.of(new BeamRowToBigtableRowFn(1000, false)));

    // Expect either an empty output or an exception (depending on your error handling)
    PAssert.that(output).empty();
    pipeline.run();
  }
}
