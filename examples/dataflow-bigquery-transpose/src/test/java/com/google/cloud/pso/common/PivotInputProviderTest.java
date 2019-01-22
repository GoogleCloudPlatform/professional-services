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

import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.LegacySQLTypeName;
import com.google.cloud.bigquery.Schema;
import com.google.common.collect.ImmutableList;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link PivotInputProvider}. */
@RunWith(JUnit4.class)
public class PivotInputProviderTest {
  private static final Field ID = Field.of("ID", LegacySQLTypeName.INTEGER);
  private static final Field CLASS = Field.of("CLASS", LegacySQLTypeName.STRING);
  private static final Field SALES = Field.of("SALES", LegacySQLTypeName.FLOAT);
  private static final Field COUNT = Field.of("COUNT", LegacySQLTypeName.INTEGER);

  private static final Field ATTRS =
      Field.newBuilder("ATTRS", LegacySQLTypeName.STRING).setMode(Field.Mode.REPEATED).build();

  private static final Field LOCATION =
      Field.newBuilder(
              "LOCATION",
              LegacySQLTypeName.RECORD,
              Field.of("CITY", LegacySQLTypeName.STRING),
              Field.of("STATE", LegacySQLTypeName.STRING))
          .build();

  private static final Schema COMPLEX_SCHEMA = Schema.of(ID, CLASS, SALES, COUNT, ATTRS, LOCATION);

  /** Test {@link PivotInputProvider} validates and provides the correct {@link Schema} objects. */
  @Test
  public void testPivotInputProvider() {
    PivotInputProvider provider =
        PivotInputProvider.newBuilder()
            .withInputTableSchema(COMPLEX_SCHEMA)
            .withKeyFieldNames(ImmutableList.of("ID"))
            .withPivotFieldNames(ImmutableList.of("CLASS"))
            .withValueFieldNames(ImmutableList.of("SALES", "COUNT", "LOCATION"))
            .build();

    assertThat(provider.keyFieldSchema()).isEqualTo(Schema.of(ID));
    assertThat(provider.pivotFieldSchema()).isEqualTo(Schema.of(CLASS));
    assertThat(provider.valueFieldSchema()).isEqualTo(Schema.of(SALES, COUNT, LOCATION));
    assertThat(provider.nonKeySchema()).isEqualTo(Schema.of(CLASS, SALES, COUNT, ATTRS, LOCATION));
  }

  /** Test {@link PivotInputProvider} throws an exception for incorrect key field name. */
  @Test
  public void testIncorrectKeyFieldName() {

    Exception thrown =
        assertThrows(
            IllegalArgumentException.class,
            () ->
                PivotInputProvider.newBuilder()
                    .withInputTableSchema(COMPLEX_SCHEMA)
                    .withKeyFieldNames(ImmutableList.of("NA"))
                    .withPivotFieldNames(ImmutableList.of("CLASS"))
                    .withValueFieldNames(ImmutableList.of("SALES", "COUNT", "LOCATION"))
                    .build());

    assertThat(thrown).hasMessageThat().contains("Invalid field name: NA");
  }

  /** Test {@link PivotInputProvider} throws an exception for incorrect pivot field name. */
  @Test
  public void testIncorrectPivotFieldName() {

    Exception thrown =
        assertThrows(
            IllegalArgumentException.class,
            () ->
                PivotInputProvider.newBuilder()
                    .withInputTableSchema(COMPLEX_SCHEMA)
                    .withKeyFieldNames(ImmutableList.of("ID"))
                    .withPivotFieldNames(ImmutableList.of("NA"))
                    .withValueFieldNames(ImmutableList.of("SALES", "COUNT", "LOCATION"))
                    .build());

    assertThat(thrown).hasMessageThat().contains("Invalid field name: NA");
  }

  /** Test {@link PivotInputProvider} throws an exception for incorrect value field name. */
  @Test
  public void testIncorrectValueFieldName() {

    Exception thrown =
        assertThrows(
            IllegalArgumentException.class,
            () ->
                PivotInputProvider.newBuilder()
                    .withInputTableSchema(COMPLEX_SCHEMA)
                    .withKeyFieldNames(ImmutableList.of("ID"))
                    .withPivotFieldNames(ImmutableList.of("CLASS"))
                    .withValueFieldNames(ImmutableList.of("SALES", "COUNT", "LOCATION", "NA"))
                    .build());

    assertThat(thrown).hasMessageThat().contains("Invalid field name: NA");
  }

  /** Test {@link PivotInputProvider} throws an exception for missing key field name. */
  @Test
  public void testMissingKeyFieldNames() {

    Exception thrown =
        assertThrows(
            IllegalStateException.class,
            () ->
                PivotInputProvider.newBuilder()
                    .withInputTableSchema(COMPLEX_SCHEMA)
                    .withPivotFieldNames(ImmutableList.of("CLASS"))
                    .withValueFieldNames(ImmutableList.of("SALES", "COUNT", "LOCATION"))
                    .build());

    assertThat(thrown).hasMessageThat().contains("Property \"keyFieldNames\" has not been set");
  }

  /** Test {@link PivotInputProvider} throws an exception for missing pivot field name. */
  @Test
  public void testMissingPivotFieldNames() {

    Exception thrown =
        assertThrows(
            IllegalStateException.class,
            () ->
                PivotInputProvider.newBuilder()
                    .withInputTableSchema(COMPLEX_SCHEMA)
                    .withKeyFieldNames(ImmutableList.of("ID"))
                    .withValueFieldNames(ImmutableList.of("SALES", "COUNT", "LOCATION"))
                    .build());

    assertThat(thrown).hasMessageThat().contains("Property \"pivotFieldNames\" has not been set");
  }

  /** Test {@link PivotInputProvider} throws an exception for missing value field name. */
  @Test
  public void testMissingValueFieldNames() {

    Exception thrown =
        assertThrows(
            IllegalStateException.class,
            () ->
                PivotInputProvider.newBuilder()
                    .withInputTableSchema(COMPLEX_SCHEMA)
                    .withKeyFieldNames(ImmutableList.of("ID"))
                    .withPivotFieldNames(ImmutableList.of("CLASS"))
                    .build());

    assertThat(thrown).hasMessageThat().contains("Property \"valueFieldNames\" has not been set");
  }

  /** Test {@link PivotInputProvider} throws an exception for STRUCT pivot field type. */
  @Test
  public void testIncorrectStructPivotFieldType() {

    Exception thrown =
        assertThrows(
            IllegalArgumentException.class,
            () ->
                PivotInputProvider.newBuilder()
                    .withInputTableSchema(COMPLEX_SCHEMA)
                    .withKeyFieldNames(ImmutableList.of("ID"))
                    .withPivotFieldNames(ImmutableList.of("LOCATION"))
                    .withValueFieldNames(ImmutableList.of("SALES", "COUNT", "ATTRS"))
                    .build());

    assertThat(thrown)
        .hasMessageThat()
        .contains("Unsupported pivot type: STRUCT for field: LOCATION");
  }

  /** Test {@link PivotInputProvider} throws an exception for REPEATED pivot field type. */
  @Test
  public void testIncorrectRepeatedPivotFieldtype() {

    Exception thrown =
        assertThrows(
            IllegalArgumentException.class,
            () ->
                PivotInputProvider.newBuilder()
                    .withInputTableSchema(COMPLEX_SCHEMA)
                    .withKeyFieldNames(ImmutableList.of("ID"))
                    .withPivotFieldNames(ImmutableList.of("ATTRS"))
                    .withValueFieldNames(ImmutableList.of("SALES", "COUNT", "LOCATION"))
                    .build());

    assertThat(thrown)
        .hasMessageThat()
        .contains("Unsupported pivot mode: REPEATED for field: ATTRS");
  }
}
