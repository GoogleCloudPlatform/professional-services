/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.google.cloud.pso.common;

import static com.google.common.base.Preconditions.checkArgument;

import com.google.auto.value.AutoValue;
import com.google.cloud.bigtable.hbase.BigtableConfiguration;
import java.io.IOException;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.TupleTag;
import org.apache.beam.sdk.values.TupleTagList;
import org.apache.hadoop.hbase.TableName;
import org.apache.hadoop.hbase.client.Connection;
import org.apache.hadoop.hbase.client.Get;
import org.apache.hadoop.hbase.client.Result;
import org.apache.hadoop.hbase.client.Table;
import org.apache.hadoop.hbase.util.Bytes;

/**
 * This {@link PTransform} accepts a {@link PCollection} of key and payload {@link KV} and performs
 * the following steps: 1. Extracts the document key. 2. Checks the key against a Bigtable table
 * that holds metadata for each document. 3. For keys where the metadata is found, a {@link
 * PCollection} is returned with {@link KV} of the original payload and the metadata field. 4. For
 * keys where the metadata is not found, a {@link ErrorMessage} object is returned for diagnostic
 * purposes.
 */
@AutoValue
public abstract class ExtractMetadata
    extends PTransform<PCollection<KV<String, String>>, PCollectionTuple> {

  public static Builder newBuilder() {
    return new AutoValue_ExtractMetadata.Builder();
  }

  abstract TupleTag<KV<String, Boolean>> successTag();

  abstract TupleTag<ErrorMessage> failureTag();

  abstract String bigtableProjectId();

  abstract String bigtableTableName();

  abstract String columnFamily();

  abstract String columnQualifier();

  abstract String bigtableInstanceId();

  @Override
  public PCollectionTuple expand(PCollection<KV<String, String>> input) {
    return input.apply(
        "Extract Metadata",
        ParDo.of(
                new DoFn<KV<String, String>, KV<String, Boolean>>() {

                  Connection connection;
                  Table table;

                  @Setup
                  public void setup() throws IOException {
                    if (connection == null) {
                      connection =
                          BigtableConfiguration.connect(bigtableProjectId(), bigtableInstanceId());
                      table = connection.getTable(TableName.valueOf(bigtableTableName()));
                    }
                  }

                  @ProcessElement
                  public void processElement(ProcessContext context) throws IOException {
                    KV<String, String> kv = context.element();
                    String keyString = kv.getKey();
                    String payload = kv.getValue();

                    Result result = table.get(new Get(Bytes.toBytes(Long.parseLong(keyString))));
                    if (!result.isEmpty()) {
                      Boolean val =
                          Bytes.toBoolean(
                              result.getValue(
                                  Bytes.toBytes(columnFamily()), Bytes.toBytes(columnQualifier())));
                      context.output(successTag(), KV.of(payload, val));
                    } else {
                      context.output(
                          failureTag(),
                          ErrorMessage.newBuilder()
                              .withJsonPayload(payload)
                              .withErrorMessage("Missing metadata for: " + keyString)
                              .build());
                    }
                  }

                  @Teardown
                  public void teardown() {
                    try {
                      if (connection != null && !connection.isClosed()) {
                        connection.close();
                      }
                    } catch (IOException e) {
                      throw new RuntimeException(e);
                    }
                  }
                })
            .withOutputTags(successTag(), TupleTagList.of(failureTag())));
  }

  @AutoValue.Builder
  public abstract static class Builder {

    abstract Builder setSuccessTag(TupleTag<KV<String, Boolean>> successTag);

    abstract Builder setFailureTag(TupleTag<ErrorMessage> failureTag);

    abstract Builder setBigtableProjectId(String bigtableProjectId);

    abstract Builder setBigtableTableName(String bigtableTableName);

    abstract Builder setBigtableInstanceId(String bigtableInstanceId);

    abstract Builder setColumnFamily(String columnFamily);

    abstract Builder setColumnQualifier(String columnQualifier);

    public abstract ExtractMetadata build();

    public Builder withBigtableProjectId(String bigtableProjectId) {
      checkArgument(
          bigtableProjectId != null,
          "withBigtableProjectId(bigtableProjectId) called with null value.");
      return setBigtableProjectId(bigtableProjectId);
    }

    public Builder withBigtableTableName(String bigtableTableName) {
      checkArgument(
          bigtableTableName != null,
          "withBigtableTableName(bigtableTableName) called with null value.");
      return setBigtableTableName(bigtableTableName);
    }

    public Builder withBigtableInstanceId(String bigtableInstanceId) {
      checkArgument(
          bigtableInstanceId != null,
          "withBigtableInstanceId(bigtableInstanceId) called with null value.");
      return setBigtableInstanceId(bigtableInstanceId);
    }

    public Builder withColumnFamily(String columnFamily) {
      checkArgument(columnFamily != null, "withColumnFamily(columnFamily) called with null value.");
      return setColumnFamily(columnFamily);
    }

    public Builder withColumnQualifier(String columnQualifier) {
      checkArgument(
          columnQualifier != null, "withColumnQualifier(columnQualifier) called with null value.");
      return setColumnQualifier(columnQualifier);
    }

    public Builder withSuccessTag(TupleTag<KV<String, Boolean>> successTag) {
      checkArgument(successTag != null, "withSuccessTag(successTag) called with null value.");
      return setSuccessTag(successTag);
    }

    public Builder withFailureTag(TupleTag<ErrorMessage> failureTag) {
      checkArgument(failureTag != null, "withFailureTag(failureTag) called with null value.");
      return setFailureTag(failureTag);
    }
  }
}
