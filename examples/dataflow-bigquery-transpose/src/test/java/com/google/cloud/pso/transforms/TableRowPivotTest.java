/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.transforms;

import com.google.api.services.bigquery.model.TableRow;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.LegacySQLTypeName;
import com.google.cloud.bigquery.Schema;
import com.google.common.collect.ImmutableList;
import java.util.List;
import org.apache.beam.sdk.testing.NeedsRunner;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.View;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionView;
import org.junit.Rule;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Units tests for {@link TableRowPivot}. */
@RunWith(JUnit4.class)
public class TableRowPivotTest {

  private static final Schema KEY_SCHEMA =
      Schema.of(Field.newBuilder("ID", LegacySQLTypeName.INTEGER).build());

  private static final Schema NON_KEY_SCHEMA =
      Schema.of(
          Field.newBuilder("CLASS", LegacySQLTypeName.STRING).build(),
          Field.newBuilder("SALES", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("COUNT", LegacySQLTypeName.INTEGER).build());

  private static final Schema PIVOT_FIELDS_SCHEMA =
      Schema.of(Field.newBuilder("CLASS", LegacySQLTypeName.STRING).build());

  private static final Schema PIVOT_VALUES_SCHEMA =
      Schema.of(
          Field.newBuilder("SALES", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("COUNT", LegacySQLTypeName.INTEGER).build());

  private static final Schema PIVOTED_SCHEMA =
      Schema.of(
          Field.newBuilder("GENERATORS_COUNT", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("GENERATORS_SALES", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("HVAC_COUNT", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("HVAC_SALES", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("TRANSFORMERS_COUNT", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("TRANSFORMERS_SALES", LegacySQLTypeName.INTEGER).build());

  private static final List<TableRow> INPUT_ROWS =
      ImmutableList.of(
          new TableRow()
              .set("ID", 23456)
              .set("CLASS", "GENERATORS")
              .set("SALES", 5234)
              .set("COUNT", 1000),
          new TableRow()
              .set("ID", 12345)
              .set("CLASS", "GENERATORS")
              .set("SALES", 4912)
              .set("COUNT", 2000),
          new TableRow().set("ID", 12345).set("CLASS", "HVAC").set("SALES", 329).set("COUNT", 500),
          new TableRow().set("ID", 23456).set("CLASS", "HVAC").set("SALES", 410).set("COUNT", 6000),
          new TableRow()
              .set("ID", 9991)
              .set("CLASS", "TRANSFORMERS")
              .set("SALES", 5000)
              .set("COUNT", 4000));

  private static final List<TableRow> EXPECTED_ROWS =
      ImmutableList.of(
          new TableRow()
              .set("ID", 12345)
              .set("GENERATORS_COUNT", 2000)
              .set("GENERATORS_SALES", 4912)
              .set("HVAC_COUNT", 500)
              .set("HVAC_SALES", 329)
              .set("TRANSFORMERS_COUNT", null)
              .set("TRANSFORMERS_SALES", null),
          new TableRow()
              .set("ID", 23456)
              .set("GENERATORS_COUNT", 1000)
              .set("GENERATORS_SALES", 5234)
              .set("HVAC_COUNT", 6000)
              .set("HVAC_SALES", 410)
              .set("TRANSFORMERS_COUNT", null)
              .set("TRANSFORMERS_SALES", null),
          new TableRow()
              .set("ID", 9991)
              .set("GENERATORS_COUNT", null)
              .set("GENERATORS_SALES", null)
              .set("HVAC_COUNT", null)
              .set("HVAC_SALES", null)
              .set("TRANSFORMERS_COUNT", 4000)
              .set("TRANSFORMERS_SALES", 5000));

  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  /** Test pivot of individual {@link TableRow} records. */
  @Test
  @Category(NeedsRunner.class)
  public void testTableRowPivot() {
    PCollectionView<Schema> pivotedSchema =
        pipeline.apply("CreateSchema", Create.of(PIVOTED_SCHEMA)).apply(View.asSingleton());

    PCollection<TableRow> actual =
        pipeline
            .apply("CreateInputRows", Create.of(INPUT_ROWS))
            .apply(
                "ApplyPivot",
                TableRowPivot.newBuilder()
                    .withKeySchema(KEY_SCHEMA)
                    .withNonKeySchema(NON_KEY_SCHEMA)
                    .withPivotFieldsSchema(PIVOT_FIELDS_SCHEMA)
                    .withPivotValuesSchema(PIVOT_VALUES_SCHEMA)
                    .withPivotedSchema(pivotedSchema)
                    .build());
    PAssert.that(actual).containsInAnyOrder(EXPECTED_ROWS);
    pipeline.run();
  }
}
