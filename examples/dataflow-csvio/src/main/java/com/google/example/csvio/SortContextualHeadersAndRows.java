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
import java.util.HashMap;
import java.util.Map;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.contextualtextio.ContextualTextIO;
import org.apache.beam.sdk.io.contextualtextio.RecordWithMetadata;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.Filter;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.Min;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.SimpleFunction;
import org.apache.beam.sdk.transforms.View;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.PCollectionView;
import org.apache.beam.sdk.values.PInput;
import org.apache.beam.sdk.values.POutput;
import org.apache.beam.sdk.values.PValue;
import org.apache.beam.sdk.values.Row;
import org.apache.beam.sdk.values.TupleTag;
import org.apache.beam.sdk.values.TupleTagList;
import org.checkerframework.checker.nullness.qual.NonNull;
import org.checkerframework.checker.nullness.qual.Nullable;

/**
 * A {@link PTransform} responsible for bundling the raw {@link ContextualTextIO#read()} {@link Row}
 * {@link PCollection} output into the corresponding CSV headers and rows.
 */
@AutoValue
abstract class SortContextualHeadersAndRows
    extends PTransform<PCollection<Row>, SortContextualHeadersAndRows.Result> {

  private static final String TAG_BASE = SortContextualHeadersAndRows.class.getSimpleName();

  static Builder builder() {
    return new AutoValue_SortContextualHeadersAndRows.Builder();
  }

  static final TupleTag<Row> HEADERS = new TupleTag<>() {
  };
  static final TupleTag<Row> ROWS = new TupleTag<>() {
  };

  abstract CSVIOReadConfiguration getConfiguration();

  @Override
  public void validate(@Nullable PipelineOptions options) {
    getConfiguration().validate();
  }

  @Override
  public Result expand(PCollection<Row> input) {
    PCollection<Row> nonEmpty = input.apply(
        TAG_BASE + "/ExcludeEmptyLines", Filter.by(new IsNotEmptyFn())
    );
    CSVIOReadConfiguration configuration = getConfiguration();
    if (configuration.getHeaderMatchRegex() == null && configuration.getHeaderPosition() == null) {
      return nonEmpty.apply(
          TAG_BASE + "/" + SortMinimumHeaderAndRows.class.getSimpleName(),
          new SortMinimumHeaderAndRows()
      );
    }
    if (configuration.getHeaderMatchRegex() != null) {
      return nonEmpty.apply(
          TAG_BASE + "/" + SortMatchedHeaderAndRows.class.getSimpleName(),
          new SortMatchedHeaderAndRows(configuration)
      );
    }
    return nonEmpty.apply(
        TAG_BASE + "/" + SortFixedHeaderAndRows.class.getSimpleName(),
        new SortFixedHeaderAndRows(configuration)
    );
  }

  @AutoValue.Builder
  static abstract class Builder {

    public abstract Builder setConfiguration(CSVIOReadConfiguration value);

    public abstract SortContextualHeadersAndRows build();
  }

  /**
   * The result of processing the raw {@link ContextualTextIO#read()} {@link Row} {@link
   * PCollection} output into the corresponding CSV headers and rows.
   */
  static class Result implements POutput, PInput {

    private final Pipeline pipeline;
    private final PCollection<Row> headers;
    private final PCollection<Row> rows;

    Result(PCollectionTuple pct) {
      this.pipeline = pct.getPipeline();
      this.headers = pct.get(HEADERS).setRowSchema(RecordWithMetadata.getSchema());
      this.rows = pct.get(ROWS).setRowSchema(RecordWithMetadata.getSchema());
    }

    public PCollection<Row> getHeaders() {
      return headers;
    }

    public PCollection<Row> getRows() {
      return rows;
    }

    @Override
    public Pipeline getPipeline() {
      return this.pipeline;
    }

    @Override
    public Map<TupleTag<?>, PValue> expand() {
      return new HashMap<>() {{
        this.put(HEADERS, headers);
        this.put(ROWS, rows);
      }};
    }

    public CSVIO.Read.Result apply(PTransform<? super Result, CSVIO.Read.Result> t) {
      return t.expand(this);
    }

    @Override
    public void finishSpecifyingOutput(String transformName, PInput input,
        PTransform<?, ?> transform) {
    }
  }

  /**
   * A {@link PTransform} responsible for bundling the raw {@link ContextualTextIO#read()} {@link
   * Row} {@link PCollection} output into the corresponding CSV headers and rows in the setting
   * where a fixed header position is expected.
   */
  static class SortFixedHeaderAndRows extends PTransform<PCollection<Row>, Result> {

    private static final String TAG_BASE = SortContextualHeadersAndRows.TAG_BASE
        + "/" + SortFixedHeaderAndRows.class.getSimpleName();

    private final CSVIOReadConfiguration configuration;

    SortFixedHeaderAndRows(CSVIOReadConfiguration configuration) {
      this.configuration = configuration;
    }

    @Override
    public Result expand(PCollection<Row> input) {
      PCollectionView<Long> headerPositionView = input
          .getPipeline().apply(
              TAG_BASE + "/HeaderPositionView",
              Create.of(configuration.getHeaderPosition())).apply(View.asSingleton()
          );
      PCollectionTuple pct = input.apply(
          TAG_BASE + "/" + SortMappedFixedPositionHeadersAndRowsFn.class.getSimpleName(),
          ParDo.of(new SortFixedPositionHeadersAndRowsFn(headerPositionView))
              .withSideInput("", headerPositionView).withOutputTags(HEADERS, TupleTagList.of(ROWS))
      );

      return new Result(pct);
    }
  }

  /**
   * A {@link PTransform} responsible for bundling the raw {@link ContextualTextIO#read()} {@link
   * Row} {@link PCollection} output into the corresponding CSV headers and rows in the setting
   * where a regular expression header matching is expected.
   */
  static class SortMatchedHeaderAndRows extends PTransform<PCollection<Row>, Result> {

    private static final String TAG_BASE = SortContextualHeadersAndRows.TAG_BASE + "/"
        + SortMatchedHeaderAndRows.class.getSimpleName();
    private final CSVIOReadConfiguration configuration;

    SortMatchedHeaderAndRows(CSVIOReadConfiguration configuration) {
      this.configuration = configuration;
    }

    @Override
    public Result expand(PCollection<Row> input) {
      PCollectionView<String> matchHeaderRegexView = input.getPipeline()
          .apply(
              TAG_BASE + "/MatchHeaderRegexView",
              Create.of(configuration.getHeaderMatchRegex())
          )
          .apply(View.asSingleton());

      PCollection<KV<String, Long>> resourceIdHeaderPosition = input.apply(
          TAG_BASE + "/" + FindMatchedHeaderFn.class.getSimpleName(),
          ParDo.of(
              new FindMatchedHeaderFn(matchHeaderRegexView)
          ).withSideInput("", matchHeaderRegexView)
      );
      PCollectionView<Map<String, Long>> mappedHeaderPositionView = resourceIdHeaderPosition.apply(
          View.asMap());
      PCollectionTuple pct = input.apply(
          TAG_BASE + "/" + SortMappedFixedPositionHeadersAndRowsFn.class.getSimpleName(),
          ParDo.of(new SortMappedFixedPositionHeadersAndRowsFn(mappedHeaderPositionView)
              ).withSideInput("", mappedHeaderPositionView)
              .withOutputTags(HEADERS, TupleTagList.of(ROWS)));

      return new Result(pct);
    }
  }

  /**
   * A {@link PTransform} responsible for bundling the raw {@link ContextualTextIO#read()} {@link
   * Row} {@link PCollection} output into the corresponding CSV headers and rows in the setting
   * where the header is expected at the first non-empty line of the CSV file.
   */
  static class SortMinimumHeaderAndRows extends PTransform<PCollection<Row>, Result> {

    private static final String TAG_BASE = SortContextualHeadersAndRows.TAG_BASE + "/" +
        SortMinimumHeaderAndRows.class.getSimpleName();

    @Override
    public Result expand(PCollection<Row> input) {
      PCollection<KV<String, Long>> resourceIdRecordOffsetKV = input
          .apply(
              TAG_BASE + "/" + IsNotEmptyFn.class.getSimpleName(),
              Filter.by(new IsNotEmptyFn())
          )
          .apply(
              TAG_BASE + "/MapElements/" + RowKVFn.class.getSimpleName(),
              MapElements.via(new RowKVFn())
          );

      PCollection<KV<String, Long>> minimumResourceIdRecordOffsetKV = resourceIdRecordOffsetKV.apply(
          TAG_BASE + "/Min",
          Min.longsPerKey()
      );

      PCollectionView<Map<String, Long>> minimumResourceIdHeaderMapView =
          minimumResourceIdRecordOffsetKV.apply(TAG_BASE + "/Min/View", View.asMap());

      PCollectionTuple pct = input
          .apply(
              TAG_BASE + "/" + SortMappedFixedPositionHeadersAndRowsFn.class.getSimpleName(),
              ParDo.of(new SortMappedFixedPositionHeadersAndRowsFn(minimumResourceIdHeaderMapView))
                  .withSideInput("", minimumResourceIdHeaderMapView)
                  .withOutputTags(HEADERS, TupleTagList.of(ROWS))
          );

      return new Result(pct);
    }
  }

  /**
   * The {@link DoFn} responsible for sorting a fixed header position with the subsequent CSV
   * records.
   */
  static class SortFixedPositionHeadersAndRowsFn extends DoFn<Row, Row> {

    private final PCollectionView<Long> headerPositionView;

    SortFixedPositionHeadersAndRowsFn(PCollectionView<Long> headerPositionView) {
      this.headerPositionView = headerPositionView;
    }

    @ProcessElement
    public void process(ProcessContext ctx) {
      Long headerPosition = ctx.sideInput(this.headerPositionView);
      Row input = ctx.element();
      RecordWithMetadataHelper record = RecordWithMetadataHelper.of(input);
      Long recordNum = record.getRecordNum();
      if (recordNum < headerPosition) {
        return;
      }
      if (recordNum.equals(headerPosition)) {
        ctx.output(HEADERS, input);
      } else {
        ctx.output(ROWS, input);
      }
    }
  }

  static class FindMatchedHeaderFn extends DoFn<Row, KV<String, Long>> {

    private final PCollectionView<String> headerMatchRegexView;

    FindMatchedHeaderFn(PCollectionView<String> headerMatchRegexView) {
      this.headerMatchRegexView = headerMatchRegexView;
    }

    @ProcessElement
    public void process(ProcessContext ctx) {
      Row input = ctx.element();
      RecordWithMetadataHelper record = RecordWithMetadataHelper.of(input);
      String headerMatchRegex = ctx.sideInput(headerMatchRegexView);
      if (record.getValue() != null && record.getValue().equals(headerMatchRegex)) {
        ctx.output(KV.of(
            record.getResourceId(),
            record.getRecordNum()
        ));
      }
    }
  }

  /**
   * The {@link DoFn} responsible for sorting a fixed header position given a with the subsequent
   * CSV records.  The header is mapped to the exact position expected.
   */
  static class SortMappedFixedPositionHeadersAndRowsFn extends DoFn<Row, Row> {

    private final PCollectionView<Map<String, Long>> mappedResourceIdHeaderPositionView;

    SortMappedFixedPositionHeadersAndRowsFn(
        PCollectionView<Map<String, Long>> mappedResourceIdHeaderPositionView) {
      this.mappedResourceIdHeaderPositionView = mappedResourceIdHeaderPositionView;
    }

    @ProcessElement
    public void process(ProcessContext ctx) {
      Row input = ctx.element();
      RecordWithMetadataHelper record = RecordWithMetadataHelper.of(input);
      String resourceId = record.getResourceId();
      Long recordOffset = record.getRecordNum();

      Map<String, Long> resourceIdHeaderPosition = ctx.sideInput(
          this.mappedResourceIdHeaderPositionView);
      if (!resourceIdHeaderPosition.containsKey(resourceId)) {
        ctx.output(ROWS, input);
        return;
      }

      Long headerPosition = resourceIdHeaderPosition.get(resourceId);
      if (recordOffset < headerPosition) {
        return;
      }
      if (recordOffset.equals(headerPosition)) {
        ctx.output(HEADERS, input);
      } else {
        ctx.output(ROWS, input);
      }
    }
  }

  /**
   * Determines whether the CSV record {@link ContextualTextIO#read()} output is a non-empty line.
   */
  static class IsNotEmptyFn extends SimpleFunction<Row, Boolean> {

    @Override
    public Boolean apply(Row input) {
      if (input == null) {
        return false;
      }
      return !RecordWithMetadataHelper.of(input).getValue().isEmpty();
    }
  }

  /**
   * Converts the CSV record {@link ContextualTextIO#read()} output to a {@link KV} pairing the
   * {@link RecordWithMetadata#RECORD_NUM} with the {@link RecordWithMetadata#RESOURCE_ID}.
   */
  static class RowKVFn extends SimpleFunction<Row, KV<String, Long>> {

    @Override
    public KV<String, Long> apply(Row input) {
      RecordWithMetadataHelper helper = RecordWithMetadataHelper.of(input);
      return KV.of(helper.getResourceId(), helper.getRecordNum());
    }
  }

  /**
   * A convenience wrapper for the {@link Row} with the expected {@link
   * RecordWithMetadata#getSchema()}.
   */
  public static class RecordWithMetadataHelper {

    public static RecordWithMetadataHelper of(Row row) {
      return new RecordWithMetadataHelper(row);
    }

    private final Row row;

    private RecordWithMetadataHelper(@NonNull Row row) {
      if (!row.getSchema().assignableTo(RecordWithMetadata.getSchema())) {
        throw new IllegalArgumentException("row is not assignable to expected schema");
      }
      this.row = row;
    }

    String getResourceId() {
      Object value = row.getValue(RecordWithMetadata.RESOURCE_ID);
      if (value == null) {
        throw new IllegalArgumentException(
            String.format("%s is null for row", RecordWithMetadata.RESOURCE_ID)
        );
      }
      return value.toString();
    }

    String getValue() {
      String value = row.getString(RecordWithMetadata.VALUE);
      if (value == null) {
        throw new IllegalArgumentException(
            String.format("%s is null for row", RecordWithMetadata.VALUE)
        );
      }
      return value;
    }

    Long getRecordNum() {
      Long value = row.getInt64(RecordWithMetadata.RECORD_NUM);
      if (value == null) {
        throw new IllegalArgumentException(
            String.format("%s is null for row", RecordWithMetadata.RECORD_NUM)
        );
      }
      return value;
    }
  }
}
