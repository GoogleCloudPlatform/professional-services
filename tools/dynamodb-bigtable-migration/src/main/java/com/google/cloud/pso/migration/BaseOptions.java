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

import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;

/** Defines common options for pipeline execution. */
public interface BaseOptions extends PipelineOptions {
  @Description("Input File path for loading data from cloud storage. E.g: gs://bucket/files/*.avro")
  String getInputFilePath();

  void setInputFilePath(String value);

  @Description("BigTable Project Id.")
  String getBigtableProjectId();

  void setBigtableProjectId(String value);

  @Description("BigTable Instance Id.")
  String getBigtableInstanceId();

  void setBigtableInstanceId(String value);

  @Description("BigTable Table Id.")
  String getBigtableTableId();

  void setBigtableTableId(String value);
}
