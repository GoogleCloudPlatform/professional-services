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

package com.google.cloud.pso.pipeline;

import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.LegacySQLTypeName;
import com.google.cloud.bigquery.Schema;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import java.io.IOException;
import java.util.Map;
import org.apache.beam.sdk.testing.NeedsRunner;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.util.Transport;
import org.apache.beam.sdk.values.PCollection;
import org.junit.Rule;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Test cases for the {@link Pivot} class. */
@RunWith(JUnit4.class)
public class PivotTest {

  private static final Schema KEY_SCHEMA =
      Schema.of(Field.newBuilder("ID", LegacySQLTypeName.INTEGER).build());

  private static final Schema PIVOTED_SCHEMA =
      Schema.of(
          Field.newBuilder("GENERATORS_COUNT", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("GENERATORS_SALES", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("HVAC_COUNT", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("HVAC_SALES", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("TRANSFORMERS_COUNT", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("TRANSFORMERS_SALES", LegacySQLTypeName.INTEGER).build());

  private static final TableSchema EXPECTED_TABLESCHEMA =
      new TableSchema()
          .setFields(
              ImmutableList.of(
                  new TableFieldSchema().setName("ID").setType("INT64"),
                  new TableFieldSchema().setName("GENERATORS_COUNT").setType("INT64"),
                  new TableFieldSchema().setName("GENERATORS_SALES").setType("INT64"),
                  new TableFieldSchema().setName("HVAC_COUNT").setType("INT64"),
                  new TableFieldSchema().setName("HVAC_SALES").setType("INT64"),
                  new TableFieldSchema().setName("TRANSFORMERS_COUNT").setType("INT64"),
                  new TableFieldSchema().setName("TRANSFORMERS_SALES").setType("INT64")));

  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  /**
   * Test {@link Pivot.SchemaToMapFn} merges {@link Schema} objects and returns the correct
   * stringified {@link TableSchema}.
   */
  @Test
  @Category(NeedsRunner.class)
  public void testSchemaToMapFn() throws IOException {

    String outputTableSpec = "my-project:my-dataset.my_table";

    PCollection<Map<String, String>> actual =
        pipeline
            .apply("Create", Create.of(PIVOTED_SCHEMA))
            .apply(
                "Apply SchemaToMapFn",
                ParDo.of(new Pivot.SchemaToMapFn(outputTableSpec, KEY_SCHEMA)));

    PAssert.thatSingleton(actual)
        .isEqualTo(
            ImmutableMap.of(
                outputTableSpec, Transport.getJsonFactory().toString(EXPECTED_TABLESCHEMA)));

    pipeline.run();
  }
}
