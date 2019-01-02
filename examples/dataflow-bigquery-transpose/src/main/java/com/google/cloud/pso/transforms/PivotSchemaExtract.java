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

import static com.google.common.base.Preconditions.checkArgument;

import com.google.api.services.bigquery.model.TableRow;
import com.google.auto.value.AutoValue;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.Schema;
import com.google.cloud.pso.common.PivotUtils;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.base.Joiner;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Iterables;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import org.apache.beam.sdk.transforms.Combine;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.GroupByKey;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;

/**
 * A {@link PTransform} that processes {@link TableRow} objects and uses {@link Schema} object to
 * create a pivot {@link Schema}.
 */
@AutoValue
public abstract class PivotSchemaExtract
    extends PTransform<PCollection<TableRow>, PCollection<Schema>> {

  private static final List<String> DISSALLOWED_PREFIX =
      ImmutableList.of("_TABLE_", "_FILE_", "_PARTITION");
  private static final Integer MAX_FIELD_NAME_LENGTH = 128;

  private static final Pattern FIELD_NAME_PATTERN = Pattern.compile("^[A-Za-z_]+[A-Za-z_0-9]*$");

  public static Builder newBuilder() {
    return new AutoValue_PivotSchemaExtract.Builder();
  }

  /**
   * Validates whether a fieldName matches BigQuery Column naming convention. Field names must
   * contain only letters (a-z, A-Z), numbers (0-9), or underscores (_), and it must start with a
   * letter or underscore. The maximum column name length is 128 characters. A column name cannot
   * use any of the following prefixes: _TABLE_, _FILE_, _PARTITION
   *
   * @param fieldName Field name to validate.
   */
  @VisibleForTesting
  static void validateFieldName(String fieldName) {
    checkArgument(fieldName != null, "fieldName cannot be null.");
    checkArgument(!fieldName.isEmpty(), "fieldName cannot be blank.");

    checkArgument(
        fieldName.length() <= MAX_FIELD_NAME_LENGTH,
        "fieldName: " + fieldName + "cannot exceed " + MAX_FIELD_NAME_LENGTH + " characters.");

    checkArgument(
        !DISSALLOWED_PREFIX.stream().anyMatch(fieldName::startsWith),
        "Invalid field name prefix: " + fieldName);

    checkArgument(
        FIELD_NAME_PATTERN.matcher(fieldName).matches(), "Invalid field name:" + fieldName);
  }

  abstract Schema pivotFieldsSchema();

  abstract Schema pivotValuesSchema();

  @Override
  public PCollection<Schema> expand(PCollection<TableRow> input) {

    return input
        .apply(
            "Get pivot values",
            ParDo.of(
                new DoFn<TableRow, KV<String, String>>() {
                  @ProcessElement
                  public void processElement(ProcessContext context) {
                    TableRow row = context.element();
                    pivotFieldsSchema()
                        .getFields()
                        .forEach(
                            field ->
                                context.output(
                                    KV.of(field.getName(), row.get(field.getName()).toString())));
                  }
                }))
        .apply("Group by pivot field", GroupByKey.create())
        .apply(
            "Fold pivot values to columns",
            ParDo.of(
                new DoFn<KV<String, Iterable<String>>, Schema>() {

                  @ProcessElement
                  public void processElement(ProcessContext context) {

                    Set<String> uniques = Sets.newHashSet();
                    context.element().getValue().forEach(uniques::add);

                    List<Field> fields = Lists.newArrayList();

                    uniques.forEach(
                        prefix ->
                            pivotValuesSchema()
                                .getFields()
                                .forEach(
                                    field -> {
                                      String suffix = field.getName();
                                      String pivotedFieldName = Joiner.on('_').join(prefix, suffix);
                                      validateFieldName(pivotedFieldName);
                                      Field pivotedField =
                                          Field.newBuilder(pivotedFieldName, field.getType())
                                              .build();
                                      fields.add(pivotedField);
                                    }));
                    context.output(Schema.of(fields));
                  }
                }))
        .apply(
            "Create single non-key Schema",
            Combine.globally(
                new Combine.CombineFn<Schema, List<Schema>, Schema>() {

                  public List<Schema> createAccumulator() {
                    return Lists.newArrayList();
                  }

                  public List<Schema> addInput(List<Schema> schemas, Schema input) {
                    schemas.add(input);
                    return schemas;
                  }

                  public List<Schema> mergeAccumulators(Iterable<List<Schema>> lists) {
                    return Lists.newArrayList(Iterables.concat(lists));
                  }

                  public Schema extractOutput(List<Schema> schemas) {
                    return PivotUtils.mergeSchemas(schemas);
                  }
                }));
  }

  @AutoValue.Builder
  public abstract static class Builder {

    abstract Builder setPivotFieldsSchema(Schema pivotFieldsSchema);

    abstract Builder setPivotValuesSchema(Schema pivotValuesSchema);

    public abstract PivotSchemaExtract build();

    /**
     * Builder helper to provide {@link Schema} for pivot fields.
     *
     * @param pivotFieldsSchema schema for pivot fields.
     * @return {@link Builder} object.
     */
    public Builder withPivotFieldsSchema(Schema pivotFieldsSchema) {
      checkArgument(
          pivotFieldsSchema != null,
          "withPivotFieldsSchema(pivotFieldsSchema) called with null value.");
      return setPivotFieldsSchema(pivotFieldsSchema);
    }

    /**
     * Builder helper to provide {@link Schema} for value fields.
     *
     * @param pivotValuesSchema schema for value fields.
     * @return {@link Builder} object.
     */
    public Builder withPivotValuesSchema(Schema pivotValuesSchema) {
      checkArgument(
          pivotValuesSchema != null,
          "withPivotValuesSchema(pivotValuesSchema) called with null value.");
      return setPivotValuesSchema(pivotValuesSchema);
    }
  }
}
