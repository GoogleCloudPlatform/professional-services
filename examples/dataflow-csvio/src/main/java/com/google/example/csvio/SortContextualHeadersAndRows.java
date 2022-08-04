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
import com.google.example.csvio.CSVIO.Read.CSVIOReadResult;
import com.google.example.csvio.SortContextualHeadersAndRows.SortContextualHeadersAndRowsResult;
import java.util.HashMap;
import java.util.Map;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.contextualtextio.ContextualTextIO;
import org.apache.beam.sdk.io.contextualtextio.RecordWithMetadata;
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

/**
 * A {@link PTransform} responsible for bundling the raw {@link ContextualTextIO#read()} {@link Row}
 * {@link PCollection} output into the corresponding CSV headers and rows.
 */
@AutoValue
abstract class SortContextualHeadersAndRows
    extends PTransform<PCollection<Row>, SortContextualHeadersAndRowsResult> {

  private static final String TAG_BASE = SortContextualHeadersAndRows.class.getSimpleName();

  static Builder builder() {
    return new AutoValue_SortContextualHeadersAndRows.Builder();
  }

  static final TupleTag<Row> HEADERS = new TupleTag<>() {};
  static final TupleTag<Row> ROWS = new TupleTag<>() {};

  abstract CSVIOReadConfiguration getConfiguration();

  @Override
  public SortContextualHeadersAndRowsResult expand(PCollection<Row> input) {
    PCollection<Row> nonEmpty =
        input.apply(TAG_BASE + "/ExcludeEmptyLines", Filter.by(new IsNotEmptyFn()));
    CSVIOReadConfiguration configuration = getConfiguration();
    if (configuration.getHeaderMatchRegex() == null && configuration.getHeaderPosition() == null) {
      return nonEmpty.apply(
          TAG_BASE + "/" + SortMinimumHeaderAndRows.class.getSimpleName(),
          new SortMinimumHeaderAndRows());
    }
    if (configuration.getHeaderMatchRegex() != null) {
      return nonEmpty.apply(
          TAG_BASE + "/" + SortMatchedHeaderAndRows.class.getSimpleName(),
          new SortMatchedHeaderAndRows(configuration));
    }
    return nonEmpty.apply(
        TAG_BASE + "/" + SortFixedHeaderAndRows.class.getSimpleName(),
        new SortFixedHeaderAndRows(configuration));
  }

  @AutoValue.Builder
  abstract static class Builder {

    public abstract Builder setConfiguration(CSVIOReadConfiguration value);

    public abstract SortContextualHeadersAndRows build();
  }

  /**
   * The result of processing the raw {@link ContextualTextIO#read()} {@link Row} {@link
   * PCollection} output into the corresponding CSV headers and rows.
   */
  static class SortContextualHeadersAndRowsResult implements POutput, PInput {

    private final Pipeline pipeline;
    private final PCollection<Row> headers;
    private final PCollection<Row> rows;

    SortContextualHeadersAndRowsResult(PCollectionTuple pct) {
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
      return new HashMap<>() {
        {
          this.put(HEADERS, headers);
          this.put(ROWS, rows);
        }
      };
    }

    public CSVIOReadResult apply(
        PTransform<? super SortContextualHeadersAndRowsResult, CSVIOReadResult> t) {
      return t.expand(this);
    }

    @Override
    public void finishSpecifyingOutput(
        String transformName, PInput input, PTransform<?, ?> transform) {}
  }

  /**
   * A {@link PTransform} responsible for bundling the raw {@link ContextualTextIO#read()} {@link
   * Row} {@link PCollection} output into the corresponding CSV headers and rows in the setting
   * where a fixed header position is expected.
   */
  static class SortFixedHeaderAndRows
      extends PTransform<PCollection<Row>, SortContextualHeadersAndRowsResult> {

    private static final String TAG_BASE =
        SortContextualHeadersAndRows.TAG_BASE + "/" + SortFixedHeaderAndRows.class.getSimpleName();

    private final CSVIOReadConfiguration configuration;

    SortFixedHeaderAndRows(CSVIOReadConfiguration configuration) {
      this.configuration = configuration;
    }

    @Override
    public SortContextualHeadersAndRowsResult expand(PCollection<Row> input) {
      PCollectionTuple headerAndRowsPCollectionTuple =
          input.apply(
              TAG_BASE + "/" + SortMappedFixedPositionHeadersAndRowsFn.class.getSimpleName(),
              ParDo.of(new SortFixedPositionHeadersAndRowsFn(configuration.getHeaderPosition()))
                  .withOutputTags(HEADERS, TupleTagList.of(ROWS)));

      return new SortContextualHeadersAndRowsResult(headerAndRowsPCollectionTuple);
    }
  }

  /**
   * A {@link PTransform} responsible for bundling the raw {@link ContextualTextIO#read()} {@link
   * Row} {@link PCollection} output into the corresponding CSV headers and rows in the setting
   * where a regular expression header matching is expected.
   */
  static class SortMatchedHeaderAndRows
      extends PTransform<PCollection<Row>, SortContextualHeadersAndRowsResult> {

    private static final String TAG_BASE =
        SortContextualHeadersAndRows.TAG_BASE
            + "/"
            + SortMatchedHeaderAndRows.class.getSimpleName();
    private final CSVIOReadConfiguration configuration;

    SortMatchedHeaderAndRows(CSVIOReadConfiguration configuration) {
      this.configuration = configuration;
    }

    @Override
    public SortContextualHeadersAndRowsResult expand(PCollection<Row> input) {
      PCollection<KV<String, Long>> resourceIdHeaderPosition =
          input.apply(
              TAG_BASE + "/" + FindMatchedHeaderFn.class.getSimpleName(),
              ParDo.of(new FindMatchedHeaderFn(configuration.getHeaderMatchRegex())));

      PCollectionView<Map<String, Long>> mappedHeaderPositionView =
          resourceIdHeaderPosition.apply(View.asMap());

      PCollectionTuple headerAndRowsPCollectionTuple =
          input.apply(
              TAG_BASE + "/" + SortMappedFixedPositionHeadersAndRowsFn.class.getSimpleName(),
              ParDo.of(new SortMappedFixedPositionHeadersAndRowsFn())
                  .withSideInput(
                      SortMappedFixedPositionHeadersAndRowsFn
                          .MAPPED_RESOURCE_ID_HEADER_POSITION_VIEW_TAG,
                      mappedHeaderPositionView)
                  .withOutputTags(HEADERS, TupleTagList.of(ROWS)));

      return new SortContextualHeadersAndRowsResult(headerAndRowsPCollectionTuple);
    }
  }

  /**
   * A {@link PTransform} responsible for bundling the raw {@link ContextualTextIO#read()} {@link
   * Row} {@link PCollection} output into the corresponding CSV headers and rows in the setting
   * where the header is expected at the first non-empty line of the CSV file.
   */
  static class SortMinimumHeaderAndRows
      extends PTransform<PCollection<Row>, SortContextualHeadersAndRowsResult> {

    private static final String TAG_BASE =
        SortContextualHeadersAndRows.TAG_BASE
            + "/"
            + SortMinimumHeaderAndRows.class.getSimpleName();

    @Override
    public SortContextualHeadersAndRowsResult expand(PCollection<Row> input) {
      PCollection<KV<String, Long>> resourceIdRecordOffsetKV =
          input
              .apply(
                  TAG_BASE + "/" + IsNotEmptyFn.class.getSimpleName(),
                  Filter.by(new IsNotEmptyFn()))
              .apply(
                  TAG_BASE + "/MapElements/" + RowKVFn.class.getSimpleName(),
                  MapElements.via(new RowKVFn()));

      // TODO: need reevaluation of calculating RecordNum when withRecordNumMetadata is not used
      PCollection<KV<String, Long>> minimumResourceIdRecordOffsetKV =
          resourceIdRecordOffsetKV.apply(TAG_BASE + "/Min", Min.longsPerKey());

      PCollectionView<Map<String, Long>> minimumResourceIdHeaderMapView =
          minimumResourceIdRecordOffsetKV.apply(TAG_BASE + "/Min/View", View.asMap());

      PCollectionTuple headerAndRowsPCollectionTuple =
          input.apply(
              TAG_BASE + "/" + SortMappedFixedPositionHeadersAndRowsFn.class.getSimpleName(),
              ParDo.of(new SortMappedFixedPositionHeadersAndRowsFn())
                  .withSideInput(
                      SortMappedFixedPositionHeadersAndRowsFn
                          .MAPPED_RESOURCE_ID_HEADER_POSITION_VIEW_TAG,
                      minimumResourceIdHeaderMapView)
                  .withOutputTags(HEADERS, TupleTagList.of(ROWS)));

      return new SortContextualHeadersAndRowsResult(headerAndRowsPCollectionTuple);
    }
  }

  /**
   * The {@link DoFn} responsible for sorting a fixed header position with the subsequent CSV
   * records.
   */
  static class SortFixedPositionHeadersAndRowsFn extends DoFn<Row, Row> {

    private final Long headerPosition;

    public SortFixedPositionHeadersAndRowsFn(Long headerPosition) {
      this.headerPosition = headerPosition;
    }

    @ProcessElement
    public void process(@Element Row input, MultiOutputReceiver receiver) {
      RecordWithMetadataHelper.validateSchema(input);
      Long recordNum = RecordWithMetadataHelper.getRecordNum(input);
      if (recordNum < headerPosition) {
        return;
      }
      if (recordNum == headerPosition) {
        receiver.get(HEADERS).output(input);
      } else {
        receiver.get(ROWS).output(input);
      }
    }
  }

  static class FindMatchedHeaderFn extends DoFn<Row, KV<String, Long>> {

    private final String headerMatchRegex;

    FindMatchedHeaderFn(String headerMatchRegex) {
      this.headerMatchRegex = headerMatchRegex;
    }

    @ProcessElement
    public void process(@Element Row input, OutputReceiver<KV<String, Long>> receiver) {
      RecordWithMetadataHelper.validateSchema(input);
      String value = RecordWithMetadataHelper.getValue(input);
      if (value.equals(headerMatchRegex)) {
        String resourceId = RecordWithMetadataHelper.getResourceId(input);
        // TODO: refactor for cases not using withRecordNumMetadata
        Long recordNum = RecordWithMetadataHelper.getRecordNum(input);
        receiver.output(KV.of(resourceId, recordNum));
      }
    }
  }

  /**
   * The {@link DoFn} responsible for sorting a fixed header position given a with the subsequent
   * CSV records. The header is mapped to the exact position expected.
   */
  static class SortMappedFixedPositionHeadersAndRowsFn extends DoFn<Row, Row> {
    static final String MAPPED_RESOURCE_ID_HEADER_POSITION_VIEW_TAG =
        "mappedResourceIdHeaderPositionView";

    @ProcessElement
    public void process(
        @Element Row input,
        @SideInput(MAPPED_RESOURCE_ID_HEADER_POSITION_VIEW_TAG)
            Map<String, Long> resourceIdHeaderPosition,
        MultiOutputReceiver receiver) {
      RecordWithMetadataHelper.validateSchema(input);
      String resourceId = RecordWithMetadataHelper.getResourceId(input);
      // TODO: refactor when using alternative to withRecordNumMetadata
      Long recordOffset = RecordWithMetadataHelper.getRecordNum(input);

      if (!resourceIdHeaderPosition.containsKey(resourceId)) {
        receiver.get(ROWS).output(input);
        return;
      }

      Long headerPosition = resourceIdHeaderPosition.get(resourceId);
      if (recordOffset < headerPosition) {
        return;
      }
      if (recordOffset.equals(headerPosition)) {
        receiver.get(HEADERS).output(input);
      } else {
        receiver.get(ROWS).output(input);
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
      return !RecordWithMetadataHelper.getValue(input).isEmpty();
    }
  }

  /**
   * Converts the CSV record {@link ContextualTextIO#read()} output to a {@link KV} pairing the
   * {@link RecordWithMetadata#RECORD_NUM} with the {@link RecordWithMetadata#RESOURCE_ID}.
   */
  static class RowKVFn extends SimpleFunction<Row, KV<String, Long>> {

    @Override
    public KV<String, Long> apply(Row input) {
      return KV.of(
          RecordWithMetadataHelper.getResourceId(input),
          // TODO: refactor for cases not using withRecordNumMetadata
          RecordWithMetadataHelper.getRecordNum(input));
    }
  }

  /**
   * A convenience wrapper for the {@link Row} with the expected {@link
   * RecordWithMetadata#getSchema()}.
   */
  static class RecordWithMetadataHelper {

    static void validateSchema(Row row) {
      if (!row.getSchema().assignableTo(RecordWithMetadata.getSchema())) {
        throw new IllegalArgumentException("row is not assignable to expected schema");
      }
    }

    static String getResourceId(Row row) {
      Object value = row.getValue(RecordWithMetadata.RESOURCE_ID);
      if (value == null) {
        throw new IllegalArgumentException(
            String.format("%s is null for row", RecordWithMetadata.RESOURCE_ID));
      }
      return value.toString();
    }

    static String getValue(Row row) {
      String value = row.getString(RecordWithMetadata.VALUE);
      if (value == null) {
        throw new IllegalArgumentException(
            String.format("%s is null for row", RecordWithMetadata.VALUE));
      }
      return value;
    }

    static Long getRecordNum(Row row) {
      Long value = row.getInt64(RecordWithMetadata.RECORD_NUM);
      if (value == null) {
        throw new IllegalArgumentException(
            String.format("%s is null for row", RecordWithMetadata.RECORD_NUM));
      }
      return value;
    }
  }
}
