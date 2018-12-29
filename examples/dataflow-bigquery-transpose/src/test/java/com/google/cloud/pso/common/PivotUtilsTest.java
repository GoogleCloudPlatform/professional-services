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

package com.google.cloud.pso.common;

import static com.google.common.truth.Truth.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableRow;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.LegacySQLTypeName;
import com.google.cloud.bigquery.Schema;
import com.google.common.collect.ImmutableList;
import java.util.Collections;
import java.util.List;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link PivotUtils}. */
@RunWith(JUnit4.class)
public class PivotUtilsTest {

  private static final Field NAME = Field.of("name", LegacySQLTypeName.STRING);
  private static final Field GENDER = Field.of("gender", LegacySQLTypeName.STRING);
  private static final Field AGE = Field.of("age", LegacySQLTypeName.INTEGER);
  private static final Field PHONE =
      Field.newBuilder("PHONE", LegacySQLTypeName.STRING).setMode(Field.Mode.REPEATED).build();
  private static final Field ADDRESS =
      Field.newBuilder(
              "ADDRESS",
              LegacySQLTypeName.RECORD,
              Field.of("CITY", LegacySQLTypeName.STRING),
              Field.of("STATE", LegacySQLTypeName.STRING))
          .build();

  private static final Schema NAME_SCHEMA = Schema.of(NAME);
  private static final Schema GENDER_SCHEMA = Schema.of(GENDER);
  private static final Schema AGE_SCHEMA = Schema.of(AGE);

  private static final Schema VALID_SCHEMA = Schema.of(NAME, GENDER, AGE);
  private static final Schema COMPLEX_SCHEMA = Schema.of(NAME, GENDER, AGE, PHONE, ADDRESS);

  private static final List<TableRow> VALID_INPUT_TABLEROWS =
      ImmutableList.of(
          new TableRow().set("name", "john").set("gender", null).set("age", null),
          new TableRow().set("name", null).set("gender", "M").set("age", null),
          new TableRow().set("name", null).set("gender", null).set("age", 30),
          new TableRow().set("name", null).set("gender", null).set("age", null));

  private static final TableRow EXPECTED_TABLEROW =
      new TableRow().set("name", "john").set("gender", "M").set("age", 30);

  private static final TableSchema EXPECTED_TABLESCHEMA =
      new TableSchema()
          .setFields(
              ImmutableList.of(
                  new TableFieldSchema().setName("name").setType("STRING"),
                  new TableFieldSchema().setName("gender").setType("STRING"),
                  new TableFieldSchema().setName("age").setType("INT64"),
                  new TableFieldSchema().setName("PHONE").setType("STRING").setMode("REPEATED"),
                  new TableFieldSchema()
                      .setName("ADDRESS")
                      .setType("STRUCT")
                      .setFields(
                          ImmutableList.of(
                              new TableFieldSchema().setName("CITY").setType("STRING"),
                              new TableFieldSchema().setName("STATE").setType("STRING")))));

  /** Test merge {@link Schema} objects with sorting. */
  @Test
  public void mergeSchemas() {
    Schema actual =
        PivotUtils.mergeSchemas(ImmutableList.of(AGE_SCHEMA, NAME_SCHEMA, GENDER_SCHEMA));
    assertThat(actual).isEqualTo(actual);
  }

  /** Test merge {@link Schema} objects without sorting. */
  @Test
  public void mergeSchemasNoSort() {
    Schema actual =
        PivotUtils.mergeSchemasWithoutSort(
            ImmutableList.of(AGE_SCHEMA, NAME_SCHEMA, GENDER_SCHEMA));
    assertThat(actual).isEqualTo(actual);
  }

  /** Test merge {@link Schema} objects with duplicate fields. */
  @Test
  public void testDuplicateFieldsMerge() {
    Exception thrown =
        assertThrows(
            IllegalArgumentException.class,
            () -> {
              PivotUtils.mergeSchemas(ImmutableList.of(NAME_SCHEMA, AGE_SCHEMA, AGE_SCHEMA));
            });

    assertThat(thrown).hasMessageThat().contains("Duplicate fields in schema: age");
  }

  /** Test merge {@link TableRow} returns expected output {@link TableRow}. */
  @Test
  public void testMergeValidRowsAndSchema() {
    TableRow actual = PivotUtils.mergeTableRows(VALID_INPUT_TABLEROWS, VALID_SCHEMA);
    assertThat(actual).isEqualTo(EXPECTED_TABLEROW);
  }

  /** Test merge empty {@link TableRow} returns exception. */
  @Test
  public void testEmptyListOfTableRows() {
    Exception thrown =
        assertThrows(
            IllegalArgumentException.class,
            () -> PivotUtils.mergeTableRows(Collections.emptyList(), VALID_SCHEMA));

    assertThat(thrown)
        .hasMessageThat()
        .contains("mergeTableRows(tableRows, schema) called with null or empty tableRows.");
  }

  /** Test merge null {@link Schema} returns an exception. */
  @Test
  public void testNullSchema() {
    Exception thrown =
        assertThrows(
            IllegalArgumentException.class,
            () -> PivotUtils.mergeTableRows(VALID_INPUT_TABLEROWS, null));

    assertThat(thrown)
        .hasMessageThat()
        .contains("mergeTableRows(tableRows, schema) called with null schema.");
  }

  /** Test conversion from {@link Schema} to {@link TableRow}. */
  @Test
  public void testSchemaToTableSchema() {
    TableSchema actual = PivotUtils.toTableSchema(COMPLEX_SCHEMA);
    assertThat(actual).isEqualTo(EXPECTED_TABLESCHEMA);
  }
}
