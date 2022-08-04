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

import static com.google.example.csvio.CSVIO.ERROR_FIELD;
import static com.google.example.csvio.CSVIO.ERROR_SCHEMA;
import static com.google.example.csvio.CSVIO.REFERENCE_FIELD;
import static com.google.example.csvio.CSVIO.Read.FAILURE;
import static com.google.example.csvio.CSVIO.Read.SUCCESS;

import com.google.example.csvio.CSVIO.Read.CSVIOReadResult;
import com.google.example.csvio.SortContextualHeadersAndRows.RecordWithMetadataHelper;
import com.google.example.csvio.SortContextualHeadersAndRows.SortContextualHeadersAndRowsResult;
import com.google.gson.Gson;
import java.util.Objects;
import javax.annotation.Nonnull;
import org.apache.beam.sdk.io.contextualtextio.ContextualTextIO;
import org.apache.beam.sdk.io.contextualtextio.RecordWithMetadata;
import org.apache.beam.sdk.schemas.transforms.Join;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.Row;
import org.apache.beam.sdk.values.TupleTagList;

/**
 * A {@link PTransform} that converts a {@link SortContextualHeadersAndRowsResult} into a {@link
 * CSVIOReadResult}.
 */
class JoinContextualHeadersAndRows
    extends PTransform<SortContextualHeadersAndRowsResult, CSVIOReadResult> {

  private static final String TAG_BASE = JoinContextualHeadersAndRows.class.getSimpleName();

  static final String NULL_HEADER_MESSAGE = "header is null for resource";

  private static final Gson GSON = new Gson();

  @Override
  public CSVIOReadResult expand(SortContextualHeadersAndRowsResult input) {
    String resourceIdFieldName = RecordWithMetadata.RESOURCE_ID;
    PCollection<Row> headers = input.getHeaders();
    PCollection<Row> rows = input.getRows();

    PCollection<Row> joined =
        rows.apply(
            TAG_BASE + "/LeftOuterJoin",
            Join.<Row, Row>leftOuterJoin(headers).using(resourceIdFieldName));

    PCollectionTuple pct =
        joined.apply(
            TAG_BASE + "/" + ParseJoinedHeadersAndRowsFn.class.getSimpleName(),
            ParDo.of(new ParseJoinedHeadersAndRowsFn())
                .withOutputTags(SUCCESS, TupleTagList.of(FAILURE)));

    return new CSVIOReadResult(pct);
  }

  /**
   * A {@link DoFn} responsible for processing the result of a {@link Join} of header and rows from
   * a {@link ContextualTextIO#read()}.
   */
  static class ParseJoinedHeadersAndRowsFn extends DoFn<Row, ContextualCSVRecord> {

    @ProcessElement
    public void process(@Nonnull @Element Row input, MultiOutputReceiver receiver) {
      Row row = Objects.requireNonNull(input.getRow(Join.LHS_TAG));
      RecordWithMetadataHelper.validateSchema(row);
      ContextualCSVRecord.Builder builder =
          ContextualCSVRecord.builder()
              .setLineNumber(RecordWithMetadataHelper.getRecordNum(row))
              .setRecord(RecordWithMetadataHelper.getValue(row))
              .setResourceId(RecordWithMetadataHelper.getResourceId(row));

      Row header = input.getRow(Join.RHS_TAG);

      if (header == null) {
        ContextualCSVRecord record = builder.setHeader("").build();
        String reference = GSON.toJson(record);
        Row error =
            Row.withSchema(ERROR_SCHEMA)
                .withFieldValue(ERROR_FIELD.getName(), NULL_HEADER_MESSAGE)
                .withFieldValue(REFERENCE_FIELD.getName(), reference)
                .build();
        receiver.get(FAILURE).output(error);
        return;
      }

      RecordWithMetadataHelper.validateSchema(header);
      ContextualCSVRecord record =
          builder.setHeader(RecordWithMetadataHelper.getValue(header)).build();

      receiver.get(SUCCESS).output(record);
    }
  }
}
