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

import com.google.auto.value.AutoValue;
import com.google.example.csvio.ContextualCSVRecordToRow.ContextualCSVRecordToRowResult;
import com.google.gson.Gson;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.Nullable;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.schemas.Schema;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionRowTuple;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.PInput;
import org.apache.beam.sdk.values.POutput;
import org.apache.beam.sdk.values.PValue;
import org.apache.beam.sdk.values.Row;
import org.apache.beam.sdk.values.TupleTag;
import org.apache.beam.sdk.values.TupleTagList;
import org.apache.commons.csv.CSVFormat;

/**
 * PTransform that converts a {@link ContextualCSVRecord} {@link PCollection} to a {@link
 * ContextualCSVRecordToRowResult}.
 *
 * <p>For each header {@link Schema} pair, the resulting {@link PCollectionRowTuple} contains a
 * {@link Row} {@link PCollection} tagged with the header.
 */
@AutoValue
public abstract class ContextualCSVRecordToRow
    extends PTransform<PCollection<ContextualCSVRecord>, ContextualCSVRecordToRowResult> {

  public static Builder builder() {
    return new AutoValue_ContextualCSVRecordToRow.Builder();
  }

  private static final String TAG_BASE = ContextualCSVRecordToRow.class.getSimpleName();

  static final TupleTag<Row> FAILURE = new TupleTag<>() {};
  static final String HEADER_ERROR_FORMAT = "header not found in schema registry: %s";

  private static final Gson GSON = new Gson();

  private Map<String, TupleTag<Row>> tupleTags;
  private TupleTagList tupleTagList;

  /** The mapping of a header to its expected {@link Schema}. */
  public abstract Map<String, Schema> getHeaderSchemaRegistry();

  /**
   * The expected {@link CSVFormat} of the CSV records and header.
   *
   * <p>Defaults to {@link CSVFormat#DEFAULT}.
   */
  @Nullable
  public abstract CSVFormat getCSVFormat();

  private CSVFormat getOrDefaultCSVFormat() {
    if (getCSVFormat() != null) {
      return getCSVFormat();
    }
    return CSVFormat.DEFAULT;
  }

  private Map<String, TupleTag<Row>> getOrCreateTupleTags() {
    if (tupleTags == null) {
      tupleTags = new HashMap<>();
      for (String header : getHeaderSchemaRegistry().keySet()) {
        tupleTags.put(header, new TupleTag<>(header));
      }
    }
    return tupleTags;
  }

  private TupleTagList getOrCreateTupleTagList() {
    if (tupleTagList == null) {
      tupleTagList = TupleTagList.empty();
      for (TupleTag<Row> tag : getOrCreateTupleTags().values()) {
        tupleTagList = tupleTagList.and(tag);
      }
    }
    return tupleTagList;
  }

  @Override
  public ContextualCSVRecordToRowResult expand(PCollection<ContextualCSVRecord> input) {
    TupleTagList tupleTagList = getOrCreateTupleTagList();
    PCollectionTuple pct =
        input.apply(
            TAG_BASE + "/" + ContextualCSVRecordToRowFn.class.getSimpleName(),
            ParDo.of(new ContextualCSVRecordToRowFn(this)).withOutputTags(FAILURE, tupleTagList));

    PCollectionRowTuple success = PCollectionRowTuple.empty(input.getPipeline());
    for (TupleTag<Row> tag : getOrCreateTupleTags().values()) {
      Schema schema = getHeaderSchemaRegistry().get(tag.getId());
      success = success.and(tag.getId(), pct.get(tag).setRowSchema(schema));
    }

    return new ContextualCSVRecordToRowResult(
        input.getPipeline(), pct.get(FAILURE).setRowSchema(CSVIO.ERROR_SCHEMA), success);
  }

  /**
   * The {@link DoFn} responsible for converting a {@link ContextualCSVRecord} into a {@link Row}.
   */
  static class ContextualCSVRecordToRowFn extends DoFn<ContextualCSVRecord, Row> {

    private final ContextualCSVRecordToRow spec;

    ContextualCSVRecordToRowFn(ContextualCSVRecordToRow spec) {
      this.spec = spec;
    }

    @ProcessElement
    public void process(@Element ContextualCSVRecord input, MultiOutputReceiver receiver) {

      try {
        String header = input.getHeader();
        if (spec.getHeaderSchemaRegistry().containsKey(header)) {
          TupleTag<Row> tag = spec.getOrCreateTupleTags().get(header);

          Row row =
              CSVRowUtils.csvLineToRow(
                  spec.getOrDefaultCSVFormat(),
                  input.getHeader(),
                  input.getRecord(),
                  spec.getHeaderSchemaRegistry().get(header));

          receiver.get(tag).output(row);
          return;
        }

        throw new IllegalArgumentException(String.format(HEADER_ERROR_FORMAT, header));

      } catch (IllegalArgumentException e) {
        receiver
            .get(FAILURE)
            .output(
                Row.withSchema(CSVIO.ERROR_SCHEMA)
                    .withFieldValue(CSVIO.ERROR_FIELD.getName(), e.getMessage())
                    .withFieldValue(CSVIO.REFERENCE_FIELD.getName(), GSON.toJson(input))
                    .build());
      }
    }
  }

  @AutoValue.Builder
  public abstract static class Builder {

    public abstract Builder setHeaderSchemaRegistry(Map<String, Schema> value);

    public abstract Builder setCSVFormat(CSVFormat value);

    public abstract ContextualCSVRecordToRow build();
  }

  /** The result of processing CSV records into a schema aware {@link Row} {@link PCollection}. */
  public static class ContextualCSVRecordToRowResult implements POutput {

    private final Pipeline pipeline;
    private final PCollection<Row> failure;
    private final PCollectionRowTuple success;

    ContextualCSVRecordToRowResult(
        Pipeline pipeline, PCollection<Row> failure, PCollectionRowTuple success) {
      this.pipeline = pipeline;
      this.failure = failure;
      this.success = success;
    }

    @Override
    public Pipeline getPipeline() {
      return this.pipeline;
    }

    public PCollection<Row> getFailure() {
      return this.failure;
    }

    public PCollectionRowTuple getSuccess() {
      return this.success;
    }

    @Override
    public Map<TupleTag<?>, PValue> expand() {
      return success.and(FAILURE.getId(), getFailure()).expand();
    }

    @Override
    public void finishSpecifyingOutput(
        String transformName, PInput input, PTransform<?, ?> transform) {}
  }
}
