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

import static com.google.common.truth.Truth.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.google.api.services.bigquery.model.TableRow;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.LegacySQLTypeName;
import com.google.cloud.bigquery.Schema;
import com.google.common.base.Strings;
import org.apache.beam.sdk.testing.NeedsRunner;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.values.PCollection;
import org.junit.Rule;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link PivotSchemaExtract}. */
@RunWith(JUnit4.class)
public class PivotSchemaExtractTest {

  private static final Schema PIVOT_FIELDS_SCHEMA =
      Schema.of(Field.newBuilder("CLASS", LegacySQLTypeName.STRING).build());

  private static final Schema PIVOT_VALUES_SCHEMA =
      Schema.of(
          Field.newBuilder("SALES", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("COUNT", LegacySQLTypeName.INTEGER).build());

  private static final Schema EXPECTED_SCHEMA =
      Schema.of(
          Field.newBuilder("GENERATORS_COUNT", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("GENERATORS_SALES", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("HVAC_COUNT", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("HVAC_SALES", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("TRANSFORMERS_COUNT", LegacySQLTypeName.INTEGER).build(),
          Field.newBuilder("TRANSFORMERS_SALES", LegacySQLTypeName.INTEGER).build());

  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  /** Test extraction of the pivot schema from {@link TableRow} records. */
  @Test
  @Category(NeedsRunner.class)
  public void testSchemaTransform() {
    PCollection<Schema> actual =
        pipeline
            .apply(
                "Create TableRows",
                Create.of(
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
                    new TableRow()
                        .set("ID", 12345)
                        .set("CLASS", "HVAC")
                        .set("SALES", 329)
                        .set("COUNT", 500),
                    new TableRow()
                        .set("ID", 23456)
                        .set("CLASS", "HVAC")
                        .set("SALES", 410)
                        .set("COUNT", 6000),
                    new TableRow()
                        .set("ID", 23456)
                        .set("CLASS", "TRANSFORMERS")
                        .set("SALES", 5000)
                        .set("COUNT", 4000)))
            .apply(
                "Extract pivot schema",
                PivotSchemaExtract.newBuilder()
                    .withPivotFieldsSchema(PIVOT_FIELDS_SCHEMA)
                    .withPivotValuesSchema(PIVOT_VALUES_SCHEMA)
                    .build());

    PAssert.thatSingleton(actual).isEqualTo(EXPECTED_SCHEMA);
    pipeline.run();
  }

  /** Test null fieldname is dissallowed. */
  @Test
  public void testNullFieldName() {
    Exception thrown =
        assertThrows(
            IllegalArgumentException.class, () -> PivotSchemaExtract.validateFieldName(null));

    assertThat(thrown).hasMessageThat().contains("fieldName cannot be null");
  }

  /** Test blank fieldname is dissallowed. */
  @Test
  public void testEmptyFieldName() {
    Exception thrown =
        assertThrows(
            IllegalArgumentException.class, () -> PivotSchemaExtract.validateFieldName(""));

    assertThat(thrown).hasMessageThat().contains("fieldName cannot be blank");
  }

  /** Test fieldname exceeding 128 characters is dissallowed. */
  @Test
  public void testFieldNameExceedingLimit() {
    Exception thrown =
        assertThrows(
            IllegalArgumentException.class,
            () -> PivotSchemaExtract.validateFieldName(Strings.repeat("A", 150)));

    assertThat(thrown).hasMessageThat().contains("cannot exceed 128 characters.");
  }

  /** Test fieldname containing dissallowed character. */
  @Test
  public void testFieldNameWithInvalidCharacter() {
    Exception thrown =
        assertThrows(
            IllegalArgumentException.class, () -> PivotSchemaExtract.validateFieldName("abc12$3"));

    assertThat(thrown).hasMessageThat().contains("Invalid field name:");
  }

  /** Test fieldname starting with a number. */
  @Test
  public void testFieldNameStartingWithNumber() {
    Exception thrown =
        assertThrows(
            IllegalArgumentException.class, () -> PivotSchemaExtract.validateFieldName("9_abcd3"));

    assertThat(thrown).hasMessageThat().contains("Invalid field name:");
  }

  /** Test fieldname starting with a dissallowed prefix. */
  @Test
  public void testFieldNameStartingWithBadPrefix() {
    Exception thrown =
        assertThrows(
            IllegalArgumentException.class,
            () -> PivotSchemaExtract.validateFieldName("_TABLE_abcd3"));

    assertThat(thrown).hasMessageThat().contains("Invalid field name prefix:");
  }

  /** Test fieldname starting with a letter is allowed. */
  @Test
  public void testFieldNameStartingWithLetter() {
    PivotSchemaExtract.validateFieldName("AbcD12Ad");
  }

  /** Test fieldname starting with a _ is allowed. */
  @Test
  public void testFieldNameStartingWithUnderscore() {
    PivotSchemaExtract.validateFieldName("_AbcD12Ad");
  }
}
