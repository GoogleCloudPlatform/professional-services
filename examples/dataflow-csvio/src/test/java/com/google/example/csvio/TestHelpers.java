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

import com.google.example.csvio.SortContextualHeadersAndRows.RecordWithMetadataHelper;
import com.google.gson.Gson;
import java.util.Arrays;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.contextualtextio.RecordWithMetadata;
import org.apache.beam.sdk.io.fs.ResolveOptions;
import org.apache.beam.sdk.io.fs.ResourceId;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptions.CheckEnabled;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.values.Row;
import org.checkerframework.checker.nullness.qual.Nullable;

class TestHelpers {

  static Pipeline createTestPipeline() {
    PipelineOptions opts = PipelineOptionsFactory.create();
    opts.setStableUniqueNames(CheckEnabled.OFF);
    return Pipeline.create(opts);
  }

  static Row rowFrom(String resourceId, String value, Long recordNum) {
    return Row.withSchema(RecordWithMetadata.getSchema())
        .withFieldValue(RecordWithMetadata.RANGE_OFFSET, 0L)
        .withFieldValue(RecordWithMetadata.RECORD_NUM, recordNum)
        .withFieldValue(RecordWithMetadata.RECORD_OFFSET, 0L)
        .withFieldValue(RecordWithMetadata.RECORD_NUM_IN_OFFSET, 0L)
        .withFieldValue(RecordWithMetadata.RESOURCE_ID, new MockResourceId(resourceId, false))
        .withFieldValue(RecordWithMetadata.VALUE, value)
        .build();
  }

  static ContextualCSVRecord contextualCSVRecordFrom(
      String resourceId, Long recordNum, String header, String record) {
    Row row = rowFrom(resourceId, record, recordNum);
    return ContextualCSVRecord.builder()
        .setResourceId(RecordWithMetadataHelper.getResourceId(row))
        .setLineNumber(recordNum)
        .setHeader(header)
        .setRecord(record)
        .build();
  }

  static Row errorFrom(ContextualCSVRecord record, String message) {
    Gson gson = new Gson();
    return Row.withSchema(CSVIO.ERROR_SCHEMA)
        .withFieldValue(CSVIO.ERROR_FIELD.getName(), message)
        .withFieldValue(CSVIO.REFERENCE_FIELD.getName(), gson.toJson(record))
        .build();
  }

  static class MockResourceId implements ResourceId {

    private static final String PATH_DELIMITER = "/";

    private final String parent;
    private final String name;
    private final boolean isDirectory;

    private MockResourceId(String value, boolean isDirectory) {
      this.isDirectory = isDirectory;
      String[] tokens = value.split(PATH_DELIMITER);
      if (tokens.length <= 1) {
        parent = "";
        name = value;
        return;
      }
      parent = String.join(PATH_DELIMITER, Arrays.asList(tokens).subList(0, tokens.length - 1));
      name = tokens[tokens.length - 1];
    }

    @Override
    public String toString() {
      return parent + PATH_DELIMITER + name;
    }

    @Override
    public ResourceId resolve(String other, ResolveOptions resolveOptions) {
      return null;
    }

    @Override
    public ResourceId getCurrentDirectory() {
      return new MockResourceId(parent, true);
    }

    @Override
    public String getScheme() {
      return "file";
    }

    @Override
    public @Nullable String getFilename() {
      return this.name;
    }

    @Override
    public boolean isDirectory() {
      return this.isDirectory;
    }
  }
}
