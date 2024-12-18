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
package com.google.cloud.pso.migration.transforms;

import com.google.cloud.pso.migration.model.InputFormat;
import com.google.cloud.pso.migration.utils.BeamRowUtils;
import org.apache.beam.sdk.coders.RowCoder;
import org.apache.beam.sdk.io.Compression;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.PBegin;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.Row;
import org.apache.beam.sdk.values.TypeDescriptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A PTransform {@link org.apache.beam.sdk.transforms.PTransform} that reads data from Google Cloud
 * Storage (GCS) in a specified format and converts it into Beam Rows suitable for Bigtable data
 * loading.
 */
public class ReadFromGCS extends PTransform<PBegin, PCollection<Row>> {
  private final String inputFilePath;
  private final InputFormat inputFormat;

  private final String bigtableRowKey;

  private final String bigtableColumnFamily;

  private static final Logger LOG = LoggerFactory.getLogger(ReadFromGCS.class);

  /**
   * Constructs a ReadFromGCS PTransform with the specified input file path and format.
   *
   * @param inputFilePath The path to the data file in GCS.
   */
  public ReadFromGCS(
      String inputFilePath,
      InputFormat inputFormat,
      String bigtableRowKey,
      String bigtableColumnFamily) {
    this.inputFilePath = inputFilePath;
    this.inputFormat = inputFormat;
    this.bigtableRowKey = bigtableRowKey;
    this.bigtableColumnFamily = bigtableColumnFamily;
  }

  @Override
  public PCollection<Row> expand(PBegin input) {
    switch (this.inputFormat) {
      case DYNAMO:
        PCollection<String> rawLines =
            input
                // Read the raw gzipped content
                .apply(
                "Read GZipped Files",
                TextIO.read().from(this.inputFilePath).withCompression(Compression.AUTO));

        // Convert to Beam Row
        return rawLines
            .apply(
                "Convert to Beam Row",
                MapElements.into(TypeDescriptor.of(Row.class))
                    .via(
                        line ->
                            BeamRowUtils.jsonToBeamRow(
                                line, this.bigtableRowKey, this.bigtableColumnFamily)))
            .setCoder(RowCoder.of(BeamRowUtils.bigtableRowWithTextPayloadSchema));
    }

    throw new IllegalArgumentException("Invalid parameter passed");
  }
}
