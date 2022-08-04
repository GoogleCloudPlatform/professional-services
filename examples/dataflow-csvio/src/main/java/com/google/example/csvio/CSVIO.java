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
import org.apache.beam.sdk.schemas.Schema;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.PBegin;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.PInput;
import org.apache.beam.sdk.values.POutput;
import org.apache.beam.sdk.values.PValue;
import org.apache.beam.sdk.values.Row;
import org.apache.beam.sdk.values.TupleTag;

/** PTransforms for CSV file processing. */
public class CSVIO {

  static final Schema.Field ERROR_FIELD = Schema.Field.of("error", Schema.FieldType.STRING);
  static final Schema.Field REFERENCE_FIELD = Schema.Field.of("reference", Schema.FieldType.STRING);
  static final Schema ERROR_SCHEMA = Schema.of(ERROR_FIELD, REFERENCE_FIELD);

  private static final String TAG_BASE = CSVIO.class.getSimpleName();

  public static Read.Builder read() {
    return new AutoValue_CSVIO_Read.Builder();
  }

  /**
   * PTransform for reading CSV files based on a {@link CSVIOReadConfiguration}. Each CSV file must
   * contain a header line but need not share the same header.
   *
   * <p>The resulting {@link ContextualCSVRecord} {@link PCollection} contains the CSV file line as
   * well as its corresponding header.
   */
  @AutoValue
  public abstract static class Read extends PTransform<PBegin, CSVIOReadResult> {

    private static final String TAG_BASE = CSVIO.TAG_BASE + "/" + Read.class.getSimpleName();

    static final TupleTag<ContextualCSVRecord> SUCCESS = new TupleTag<>() {};
    static final TupleTag<Row> FAILURE = new TupleTag<>() {};

    public abstract CSVIOReadConfiguration getConfiguration();

    @Override
    public CSVIOReadResult expand(PBegin input) {
      CSVIOReadConfiguration configuration = getConfiguration();

      PCollection<Row> rawRows =
          input.apply(
              TAG_BASE + "/" + ContextualTextIO.class.getSimpleName(),
              // TODO: consider an alternative to withRecordNumMetadata()
              ContextualTextIO.read().from(configuration.getFilePattern()).withRecordNumMetadata());

      SortContextualHeadersAndRowsResult sortSortContextualHeadersAndRowsResult =
          rawRows.apply(
              TAG_BASE + "/" + SortContextualHeadersAndRows.class.getSimpleName(),
              SortContextualHeadersAndRows.builder().setConfiguration(configuration).build());

      return sortSortContextualHeadersAndRowsResult.apply(new JoinContextualHeadersAndRows());
    }

    @AutoValue.Builder
    public abstract static class Builder {

      public abstract Builder setConfiguration(CSVIOReadConfiguration value);

      public abstract Read build();
    }

    /** The result of a CSV file processing operation. */
    public static class CSVIOReadResult implements PInput, POutput {

      private final Pipeline pipeline;
      private final PCollection<ContextualCSVRecord> success;
      private final PCollection<Row> failure;

      CSVIOReadResult(PCollectionTuple pct) {
        this.pipeline = pct.getPipeline();
        this.success = pct.get(SUCCESS);
        this.failure = pct.get(FAILURE).setRowSchema(ERROR_SCHEMA);
      }

      public PCollection<ContextualCSVRecord> getSuccess() {
        return success;
      }

      public PCollection<Row> getFailure() {
        return failure;
      }

      @Override
      public Pipeline getPipeline() {
        return this.pipeline;
      }

      @Override
      public Map<TupleTag<?>, PValue> expand() {
        return new HashMap<>() {
          {
            this.put(SUCCESS, getSuccess());
            this.put(FAILURE, getFailure());
          }
        };
      }

      @Override
      public void finishSpecifyingOutput(
          String transformName, PInput input, PTransform<?, ?> transform) {}
    }
  }
}
