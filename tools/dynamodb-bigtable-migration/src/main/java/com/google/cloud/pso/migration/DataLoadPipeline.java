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
package com.google.cloud.pso.migration;

import com.google.cloud.pso.migration.model.InputFormat;
import com.google.cloud.pso.migration.transforms.ReadFromGCS;
import com.google.cloud.pso.migration.transforms.WriteToBigtable;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.extensions.gcp.options.GcsOptions;
import org.apache.beam.sdk.io.FileSystems;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.Row;

/**
 * This class defines the DataLoad pipeline options and the main entry point for the data loading
 * process.
 *
 * <p>The pipeline can read data from either Cloud Storage (GCS) on configuration options. It then
 * converts the data to Beam Rows and writes them to Bigtable.
 */
public class DataLoadPipeline {

  public interface DataLoadOptions extends BaseOptions {

    @Description(
        "The flag for enabling splitting of large rows into multiple MutateRows requests. Note that"
            + " when a large row is split between multiple API calls, the updates to the row are"
            + " not atomic.")
    @Default.Boolean(true)
    boolean getBigtableSplitLargeRows();

    void setBigtableSplitLargeRows(boolean value);

    @Description("The row key field name to use from DynamoDB data")
    String getBigtableRowKey();

    void setBigtableRowKey(String value);

    @Description("The column family name in Bigtable table")
    String getBigtableColumnFamily();

    void setBigtableColumnFamily(String value);

    @Description("Maximum mutations per row.")
    @Default.Integer(100000)
    int getBigtableMaxMutationsPerRow();

    void setBigtableMaxMutationsPerRow(int value);
  }

  /**
   * The main entry point for the data validation pipeline.
   *
   * @param args command-line arguments for the pipeline.
   */
  public static void main(String[] args) {

    DataLoadOptions options =
        PipelineOptionsFactory.fromArgs(args).withValidation().as(DataLoadOptions.class);

    DataLoadOptionsValidator.validateOptions(options);

    Pipeline pipeline = Pipeline.create(options);

    FileSystems.setDefaultPipelineOptions(options.as(GcsOptions.class));

    PCollection<Row> inputData = null;
    if (options.getInputFilePath() != null) {
      inputData =
          pipeline.apply(
              "Read from Cloud Storage",
              new ReadFromGCS(
                  options.getInputFilePath(),
                  InputFormat.DYNAMO,
                  options.getBigtableRowKey(),
                  options.getBigtableColumnFamily()));
    }

    assert inputData != null;

    if (options.getBigtableInstanceId() != null) {
      inputData.apply(
          "Write To Bigtable", new WriteToBigtable(options.getBigtableMaxMutationsPerRow()));
    }

    pipeline.run();
  }
}
