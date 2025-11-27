/*
 *  Copyright 2024 Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.google.cloud.pso.migration.dofns;

import com.google.bigtable.v2.Mutation;
import com.google.cloud.pso.migration.utils.DataLoadConstants;
import com.google.gson.Gson;
import com.google.protobuf.ByteString;
import java.io.IOException;
import java.util.Collection;
import org.apache.beam.sdk.schemas.Schema;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.Row;
import org.apache.beam.vendor.guava.v32_1_2_jre.com.google.common.collect.ImmutableList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This DoFn {@link org.apache.beam.sdk.transforms.DoFn} class translates Beam Rows containing Cloud
 * Bigtable cell data into BigTable Mutations. It can split large rows exceeding a specified maximum
 * number of mutations into multiple Mutation requests.
 */
public class BeamRowToBigtableRowFn extends DoFn<Row, KV<ByteString, Iterable<Mutation>>> {
  private static final Logger LOG = LoggerFactory.getLogger(BeamRowToBigtableRowFn.class);
  private final Boolean splitLargeRows;
  private final int maxMutationsPerRow;

  /** A shared Gson instance used for converting Payloads to JSON strings. */
  private static final Gson gson = new Gson();

  private final Schema.TypeName bytesType = Schema.FieldType.BYTES.getTypeName();

  /**
   * Constructor specifying the maximum number of mutations per row and split behavior for large
   * rows.
   *
   * @param maxMutationsPerRow The maximum number of mutations allowed per Bigtable row.
   * @param splitLargeRows Flag indicating whether to split rows exceeding {@link
   *     #maxMutationsPerRow} mutations.
   */
  public BeamRowToBigtableRowFn(int maxMutationsPerRow, Boolean splitLargeRows) {
    this.maxMutationsPerRow = maxMutationsPerRow;
    this.splitLargeRows = splitLargeRows;
  }

  /**
   * This DoFn process element method translates a Beam Row representing Cloud Bigtable cell data
   * into a KeyValue (KV) pair. The key is the row key as a ByteString, and the value is an iterable
   * of Mutations.
   *
   * @param row The Beam Row containing Cloud Bigtable row data.
   * @param out The output receiver for emitting KV pairs.
   * @throws IOException If there is an error processing the row data.
   */
  @ProcessElement
  public void processElement(
      @Element Row row, OutputReceiver<KV<ByteString, Iterable<Mutation>>> out) throws IOException {
    String row_key = row.getString(DataLoadConstants.SchemaFields.ROW_KEY);
    ByteString key = toByteString(row_key);
    // BulkMutation doesn't split rows. Currently, if a single row contains more than 100,000
    // mutations, the service will fail the request.
    ImmutableList.Builder<Mutation> mutations = ImmutableList.builder();
    int cellsProcessed = 0;

    // Get the "cells" collection from the row
    Collection<Row> cells = row.getArray(DataLoadConstants.SchemaFields.CELLS);

    if (cells != null) {
      for (Row cell : cells) {
        // Build a Mutation.SetCell object for each cell

        Mutation.SetCell.Builder cellBuilder =
            Mutation.SetCell.newBuilder()
                .setFamilyName(cell.getString(DataLoadConstants.SchemaFields.COLUMN_FAMILY));

        String columnQualifier = cell.getString(DataLoadConstants.SchemaFields.COLUMN);
        String payload = cell.getString(DataLoadConstants.SchemaFields.PAYLOAD);

        if (columnQualifier != null) {
          // Set the column qualifier
          cellBuilder.setColumnQualifier(toByteString(columnQualifier));

          // Set the value only if it's not null
          if (payload != null) {
            cellBuilder.setValue(toByteString(payload));
          }
        }

        mutations.add(Mutation.newBuilder().setSetCell(cellBuilder.build()).build());
        cellsProcessed++;

        // Split large rows if enabled and threshold is reached
        if (this.splitLargeRows && cellsProcessed % maxMutationsPerRow == 0) {
          // Send a MutateRow request when we have accumulated max mutations per row.
          out.output(KV.of(key, mutations.build()));
          mutations = ImmutableList.builder();
        }
      }
    }

    // Flush any remaining mutations after processing all cells.
    ImmutableList remainingMutations = mutations.build();
    if (!remainingMutations.isEmpty()) {
      out.output(KV.of(key, remainingMutations));
    }
  }

  /**
   * Converts a String value to a ByteString using UTF-8 encoding.
   *
   * @param value The String value to convert.
   * @return A ByteString representing the UTF-8 encoded bytes of the input string.
   */
  private ByteString toByteString(String value) {

    return ByteString.copyFromUtf8(value);
  }
}
