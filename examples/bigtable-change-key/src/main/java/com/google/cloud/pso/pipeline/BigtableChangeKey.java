/**
 * Copyright 2020 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.pso.pipeline;

import com.google.bigtable.v2.Mutation;
import com.google.bigtable.v2.Row;
import com.google.cloud.pso.dofns.UpdateKey;
import com.google.cloud.pso.options.BigtablePipelineOptions;
import com.google.protobuf.ByteString;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.gcp.bigtable.BigtableIO;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.commons.lang3.StringUtils;

public class BigtableChangeKey {

  /**
   * Return a new key for a given key and record in the existing table.
   *
   * <p>The purpose of this method is to test different key strategies over the same data in
   * Bigtable.
   *
   * @param key The existing key in the table
   * @param record The full record, in case it is needed to choose the new key
   * @return The new key for the same record
   */
  public static String transformKey(String key, Row record) {
    /**
     * TODO: Change the existing key here, by a new key
     *
     * <p>Here we just reverse the key, as a demo. Ideally, you should test different strategies,
     * test the performance obtained with each key transform strategy, and then decide how you need
     * to change the keys.
     */
    return StringUtils.reverse(key);
  }

  /**
   * The main function for this Beam pipeline.
   *
   * @param args The command line arguments that are passed when the pipeline is triggered.
   */
  public static void main(String[] args) {
    // Read options
    BigtablePipelineOptions options =
        PipelineOptionsFactory.fromArgs(args).withValidation().as(BigtablePipelineOptions.class);

    runPipeline(options);
  }

  /**
   * Run the pipeline with the provided set of {@link BigtablePipelineOptions}
   *
   * @param options The options for the pipeline.
   */
  private static void runPipeline(BigtablePipelineOptions options) {
    Pipeline p = Pipeline.create(options);

    // Read existing records from the table. Row is the class used to represent a record in a
    // Bigtable.
    PCollection<Row> bigtableRows =
        p.apply(
            "Read from BigTable",
            BigtableIO.read()
                .withProjectId(options.getProject())
                .withInstanceId(options.getBigtableInstance())
                .withTableId(options.getInputTable()));

    // Here we transform the row by changing the key.
    // We maintain the same structure (cf, column, cells), but with a different key.
    // Please note that we do not need to know the schema to apply this change, so this code can be
    // applied to any table
    PCollection<KV<ByteString, Iterable<Mutation>>> transformedRows =
        bigtableRows.apply(
            "Transform the key of each record",
            ParDo.of(new UpdateKey(BigtableChangeKey::transformKey)));

    transformedRows.apply(
        "Write to new table in BigTable",
        BigtableIO.write()
            .withProjectId(options.getProject())
            .withInstanceId(options.getBigtableInstance())
            .withTableId(options.getOutputTable()));

    p.run();
  }
}
