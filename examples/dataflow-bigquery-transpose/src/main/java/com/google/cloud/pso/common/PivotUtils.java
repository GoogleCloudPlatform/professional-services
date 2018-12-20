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

import static com.google.common.base.Preconditions.checkArgument;

import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableRow;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.FieldList;
import com.google.cloud.bigquery.LegacySQLTypeName;
import com.google.cloud.bigquery.Schema;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.IntStream;

/** Utility methods for {@link TableRow} and {@link Schema} objects. */
public class PivotUtils {

  /**
   * Utility method to merge a list of {@link TableRow} records by using the first non-null value
   * for every field.
   *
   * @param tableRows List of {@link TableRow} records to merge.
   * @param schema {@link Schema} corresponding to the {@link TableRow} being merged.
   * @return {@link TableRow} merged record.
   */
  public static TableRow mergeTableRows(List<TableRow> tableRows, Schema schema) {
    checkArgument(
        tableRows != null && tableRows.size() > 0,
        "mergeTableRows(tableRows, schema) called with null or empty tableRows.");

    checkArgument(schema != null, "mergeTableRows(tableRows, schema) called with null schema.");

    FieldList fieldList = schema.getFields();

    // Create TableRow with null values.
    TableRow output = new TableRow();
    fieldList.forEach(field -> output.set(field.getName(), null));

    IntStream.range(0, fieldList.size())
        .forEach(
            idx ->
                output.set(
                    fieldList.get(idx).getName(),
                    tableRows
                        .stream()
                        .map(tableRow -> tableRow.get(fieldList.get(idx).getName()))
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse(null)));

    return output;
  }

  /**
   * Helper method to merge a list of {@link Schema} objects and optionally sort them.
   *
   * @param schemas {@link Schema} objects to merge.
   * @param sort {@link Boolean} flag to sort the fields by fieldName.
   * @return merged {@link Schema} object.
   */
  private static Schema mergeSchemas(List<Schema> schemas, boolean sort) {
    checkArgument(schemas != null, "mergeSchemas(schemas) called with null input.");
    Set<String> seenFields = Sets.newHashSet();
    List<Field> fields = Lists.newLinkedList();

    schemas.forEach(
        schema ->
            schema
                .getFields()
                .forEach(
                    field -> {
                      if (seenFields.contains(field.getName())) {
                        throw new IllegalArgumentException(
                            "Duplicate fields in schema: " + field.getName());
                      }
                      seenFields.add(field.getName());
                      fields.add(field);
                    }));

    if (sort) {
      fields.sort(Comparator.comparing(Field::getName));
    }

    return Schema.of(fields);
  }

  /**
   * Merge a list of {@link Schema} to create a single merged {@link Schema} with {@link Field}
   * sorted by name.
   *
   * @param schemas {@link Schema} schemas to merge.
   * @return merged {@link Schema} object.
   */
  public static Schema mergeSchemas(List<Schema> schemas) {
    return mergeSchemas(schemas, true);
  }

  /** Same as {@link PivotUtils#mergeSchemas(List)} but without sorting {@link Field} by name. */
  public static Schema mergeSchemasWithoutSort(List<Schema> schemas) {
    return mergeSchemas(schemas, false);
  }

  /**
   * Converts a {@link FieldList} to a list of {@link TableSchema} object.
   *
   * @param fieldList {@link FieldList} to convert.
   * @return List of {@link TableSchema} objects.
   */
  private static List<TableFieldSchema> getTableFieldSchemas(FieldList fieldList) {
    checkArgument(fieldList != null, "getTableFieldSchemas(fieldList) called with null input.");
    List<TableFieldSchema> output = Lists.newArrayListWithCapacity(fieldList.size());

    fieldList.forEach(
        field -> {
          TableFieldSchema tableFieldSchema = new TableFieldSchema();
          tableFieldSchema.setName(field.getName());
          tableFieldSchema.setType(field.getType().getStandardType().name());
          if (field.getMode() != null) {
            tableFieldSchema.setMode(field.getMode().name());
          }
          if (field.getDescription() != null) {
            tableFieldSchema.setDescription(field.getDescription());
          }
          if (field.getType().equals(LegacySQLTypeName.RECORD)) {
            tableFieldSchema.setFields(getTableFieldSchemas(field.getSubFields()));
          }
          output.add(tableFieldSchema);
        });
    return output;
  }

  /**
   * Utility method to convert a {@link Schema} to a {@link TableSchema}.
   *
   * @param schema {@link Schema} describing the table.
   * @return {@link TableSchema} representation of the input {@link Schema}.
   */
  public static TableSchema toTableSchema(Schema schema) {
    checkArgument(schema != null, "toTableSchema(schema) called with null input.");
    List<TableFieldSchema> tableFieldSchemas = getTableFieldSchemas(schema.getFields());

    return new TableSchema().setFields(tableFieldSchemas);
  }
}
