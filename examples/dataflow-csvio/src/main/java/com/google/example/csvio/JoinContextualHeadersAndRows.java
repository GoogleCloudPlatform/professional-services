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

import com.google.gson.Gson;
import java.util.Objects;
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
 * A {@link PTransform} that converts a {@link SortContextualHeadersAndRows.Result} into a
 * {@link CSVIO.Read.Result}.
 */
class JoinContextualHeadersAndRows
        extends PTransform<SortContextualHeadersAndRows.Result, CSVIO.Read.Result> {

    private static final String TAG_BASE = JoinContextualHeadersAndRows.class.getSimpleName();

    static final String NULL_HEADER_MESSAGE = "header is null for resource";

    private static final Gson GSON = new Gson();

    @Override
    public CSVIO.Read.Result expand(SortContextualHeadersAndRows.Result input) {
        String resourceIdFieldName = RecordWithMetadata.RESOURCE_ID;
        PCollection<Row> headers = input.getHeaders();
        PCollection<Row> rows = input.getRows();

        PCollection<Row> joined = rows.apply(
            TAG_BASE + "/LeftOuterJoin",
            Join.<Row, Row>leftOuterJoin(headers).using(resourceIdFieldName)
        );

        PCollectionTuple pct = joined.apply(
                TAG_BASE + "/" + ParseJoinedHeadersAndRowsFn.class.getSimpleName(),
                ParDo.of(new ParseJoinedHeadersAndRowsFn())
                        .withOutputTags(SUCCESS, TupleTagList.of(FAILURE))
        );

        return new CSVIO.Read.Result(pct);
    }

    /**
     * A {@link DoFn} responsible for processing the result of a {@link Join} of header and rows
     * from a {@link ContextualTextIO#read()}.
     */
    static class ParseJoinedHeadersAndRowsFn extends DoFn<Row, CSVRecord> {
        @ProcessElement
        public void process(ProcessContext ctx) {
            Row input = Objects.requireNonNull(ctx.element());
            SortContextualHeadersAndRows.RecordWithMetadataHelper row =
                    SortContextualHeadersAndRows.RecordWithMetadataHelper.of(input.getRow(Join.LHS_TAG));
            CSVRecord.Builder builder = CSVRecord.builder()
                    .setLineNumber(row.getRecordNum())
                    .setRecord(row.getValue())
                    .setResourceId(row.getResourceId());

            if (input.getRow(Join.RHS_TAG) == null) {
                CSVRecord record = builder.setHeader("").build();
                String reference = GSON.toJson(record);
                Row error = Row.withSchema(ERROR_SCHEMA)
                        .withFieldValue(ERROR_FIELD.getName(), NULL_HEADER_MESSAGE)
                        .withFieldValue(REFERENCE_FIELD.getName(), reference)
                        .build();
                ctx.output(FAILURE, error);
                return;
            }

            SortContextualHeadersAndRows.RecordWithMetadataHelper header =
                    SortContextualHeadersAndRows.RecordWithMetadataHelper.of(input.getRow(Join.RHS_TAG));
            CSVRecord record = builder.setHeader(header.getValue()).build();

            ctx.output(SUCCESS, record);
        }
    }
}
