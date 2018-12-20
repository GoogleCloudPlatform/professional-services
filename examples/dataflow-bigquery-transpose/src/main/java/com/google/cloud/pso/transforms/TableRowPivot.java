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
import static com.google.common.base.Preconditions.checkState;

import com.google.api.services.bigquery.model.TableRow;
import com.google.auto.value.AutoValue;
import com.google.cloud.bigquery.Schema;
import com.google.cloud.pso.common.PivotUtils;
import com.google.common.base.Joiner;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import org.apache.beam.sdk.io.gcp.bigquery.TableRowJsonCoder;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.GroupByKey;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionView;
import org.apache.beam.sdk.values.TypeDescriptor;
import org.apache.beam.sdk.values.TypeDescriptors;

/**
 * A {@link PTransform} that pivots a {@link PCollection<TableRow>} records based on a pivot {@link
 * Schema}.
 */
@AutoValue
public abstract class TableRowPivot
    extends PTransform<PCollection<TableRow>, PCollection<TableRow>> {

  // Max columns in a table.
  private static final Integer MAX_ALLOWED_COLUMNS = 10000;

  private static final TypeDescriptor<TableRow> TABLE_ROW_TYPE_DESCRIPTOR =
      TableRowJsonCoder.of().getEncodedTypeDescriptor();

  public static Builder newBuilder() {
    return new AutoValue_TableRowPivot.Builder();
  }

  abstract Schema keySchema();

  abstract Schema pivotFieldsSchema();

  abstract Schema pivotValuesSchema();

  abstract Schema nonKeySchema();

  abstract PCollectionView<Schema> pivotedSchema();

  @Override
  public PCollection<TableRow> expand(PCollection<TableRow> input) {

    return input
        .apply(
            "Separate key fields",
            MapElements.into(
                    TypeDescriptors.kvs(TABLE_ROW_TYPE_DESCRIPTOR, TABLE_ROW_TYPE_DESCRIPTOR))
                .via(
                    (TableRow inputTableRow) -> {
                      TableRow key = new TableRow();
                      TableRow value = new TableRow();

                      keySchema()
                          .getFields()
                          .forEach(
                              field ->
                                  key.set(field.getName(), inputTableRow.get(field.getName())));

                      nonKeySchema()
                          .getFields()
                          .forEach(
                              field ->
                                  value.set(field.getName(), inputTableRow.get(field.getName())));

                      return KV.of(key, value);
                    }))
        .apply(
            "Pivot every row",
            ParDo.of(
                    new DoFn<KV<TableRow, TableRow>, KV<Integer, KV<TableRow, TableRow>>>() {

                      @ProcessElement
                      public void processElement(ProcessContext context) {
                        TableRow key = context.element().getKey();
                        TableRow value = context.element().getValue();
                        Schema pivotedSchema = context.sideInput(pivotedSchema());

                        checkState(
                            (keySchema().getFields().size() + pivotedSchema.getFields().size()
                                <= MAX_ALLOWED_COLUMNS),
                            "A single row cannot exceed " + MAX_ALLOWED_COLUMNS + " columns.");

                        TableRow output = new TableRow();
                        pivotedSchema
                            .getFields()
                            .forEach(field -> output.set(field.getName(), null));

                        pivotFieldsSchema()
                            .getFields()
                            .forEach(
                                pivotField -> {
                                  String fieldNamePrefix =
                                      value.get(pivotField.getName()).toString();
                                  pivotValuesSchema()
                                      .getFields()
                                      .forEach(
                                          valueField -> {
                                            String fieldNameSuffix = valueField.getName();
                                            String pivotedFieldName =
                                                Joiner.on('_')
                                                    .join(fieldNamePrefix, fieldNameSuffix);
                                            output.set(
                                                pivotedFieldName, value.get(valueField.getName()));
                                          });
                                });

                        /*
                        Using an integer hash as the key as TableRow cannot be used
                        in a subsequent GroupBy since TableRow can be non-deterministic.
                         */
                        context.output(KV.of(key.hashCode(), KV.of(key, output)));
                      }
                    })
                .withSideInputs(pivotedSchema()))
        .apply("Group by key field", GroupByKey.create())
        .apply(
            "Create final row",
            ParDo.of(
                    new DoFn<KV<Integer, Iterable<KV<TableRow, TableRow>>>, TableRow>() {
                      @ProcessElement
                      public void processElement(ProcessContext context) {

                        Schema pivotSchema = context.sideInput(pivotedSchema());

                        TableRow key =
                            StreamSupport.stream(context.element().getValue().spliterator(), false)
                                .map(KV::getKey)
                                .findAny()
                                .get();

                        List<TableRow> rowsToMerge =
                            StreamSupport.stream(context.element().getValue().spliterator(), false)
                                .map(KV::getValue)
                                .collect(Collectors.toList());

                        TableRow mergedRow = PivotUtils.mergeTableRows(rowsToMerge, pivotSchema);
                        TableRow finalRow = new TableRow();

                        keySchema()
                            .getFields()
                            .forEach(
                                field -> finalRow.set(field.getName(), key.get(field.getName())));
                        pivotSchema
                            .getFields()
                            .forEach(
                                field ->
                                    finalRow.set(field.getName(), mergedRow.get(field.getName())));

                        context.output(finalRow);
                      }
                    })
                .withSideInputs(pivotedSchema()));
  }

  @AutoValue.Builder
  public abstract static class Builder {

    abstract Builder setKeySchema(Schema keySchema);

    abstract Builder setPivotFieldsSchema(Schema pivotFieldsSchema);

    abstract Builder setPivotValuesSchema(Schema pivotValuesSchema);

    abstract Builder setNonKeySchema(Schema nonKeySchema);

    abstract Builder setPivotedSchema(PCollectionView<Schema> pivotedSchema);

    public abstract TableRowPivot build();

    /**
     * Builder helper to provide {@link Schema} for key fields.
     *
     * @param keySchema schema for keyFields.
     * @return Builder.
     */
    public Builder withKeySchema(Schema keySchema) {
      checkArgument(keySchema != null, "withKeySchema(keySchema) called with null value.");
      return setKeySchema(keySchema);
    }

    /**
     * Builder helper to provide {@link Schema} for pivot fields.
     *
     * @param pivotFieldsSchema schema for pivot fields.
     * @return Builder.
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
     * @return Builder.
     */
    public Builder withPivotValuesSchema(Schema pivotValuesSchema) {
      checkArgument(
          pivotValuesSchema != null,
          "withPivotValuesSchema(pivotValuesSchema) called with null value.");
      return setPivotValuesSchema(pivotValuesSchema);
    }

    /**
     * Builder helper to provide {@link Schema} for non-key fields.
     *
     * @param nonKeySchema schema for keyFields.
     * @return Builder.
     */
    public Builder withNonKeySchema(Schema nonKeySchema) {
      checkArgument(nonKeySchema != null, "withNonKeySchema(nonKeySchema) called with null value.");
      return setNonKeySchema(nonKeySchema);
    }

    /**
     * Builder helper to provide {@link Schema} for pivoted fields.
     *
     * @param pivotedSchema schema for keyFields to be used as a sideInput.
     * @return Builder
     */
    public Builder withPivotedSchema(PCollectionView<Schema> pivotedSchema) {
      checkArgument(
          pivotedSchema != null, "withPivotedSchema(pivotedSchema) called with null value.");
      return setPivotedSchema(pivotedSchema);
    }
  }
}
