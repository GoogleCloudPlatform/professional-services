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
package com.google.cloud.pso.options;

import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.Validation;

/** These are the command line options that are specific to this pipeline. */
public interface BigtablePipelineOptions extends DataflowPipelineOptions {
  @Description("BigTable instance")
  @Validation.Required
  String getBigtableInstance();

  void setBigtableInstance(String value);

  @Description("Input table")
  @Validation.Required
  String getInputTable();

  void setInputTable(String value);

  @Description("Output table -- will be overwritten")
  @Validation.Required
  String getOutputTable();

  void setOutputTable(String value);
}
