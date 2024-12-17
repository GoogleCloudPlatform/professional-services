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

import com.google.cloud.pso.migration.DataLoadPipeline;
import com.google.cloud.pso.migration.dofns.BeamRowToBigtableRowFn;
import org.apache.beam.sdk.io.gcp.bigtable.BigtableIO;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PDone;
import org.apache.beam.sdk.values.Row;

/**
 * A PTransform {@link org.apache.beam.sdk.transforms.PTransform} that writes Beam Rows to Google
 * Cloud Bigtable.
 *
 * <p>This transform converts Beam Rows into Bigtable Mutations and writes them to the specified
 * Bigtable table. It supports splitting large rows into multiple mutations if configured.
 */
public class WriteToBigtable extends PTransform<PCollection<Row>, PDone> {
  private final int maxMutationsPerRow;

  /**
   * Constructs a WriteToBigtable PTransform with the specified maximum number of mutations per row.
   *
   * @param maxMutationsPerRow The maximum number of mutations to include in a single Bigtable row.
   */
  public WriteToBigtable(int maxMutationsPerRow) {
    this.maxMutationsPerRow = maxMutationsPerRow;
  }

  @Override
  public PDone expand(PCollection<Row> avroBigtableRows) {
    DataLoadPipeline.DataLoadOptions options =
        avroBigtableRows.getPipeline().getOptions().as(DataLoadPipeline.DataLoadOptions.class);

    BigtableIO.Write bigtableWriter =
        BigtableIO.write()
            .withProjectId(options.getBigtableProjectId())
            .withInstanceId(options.getBigtableInstanceId())
            .withTableId(options.getBigtableTableId());

    return avroBigtableRows
        .apply(
            "Convert To BigTableRow",
            ParDo.of(
                new BeamRowToBigtableRowFn(
                    this.maxMutationsPerRow, options.getBigtableSplitLargeRows())))
        .apply("Write To Bigtable", bigtableWriter);
  }
}
