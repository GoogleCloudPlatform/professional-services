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

package com.google.cloud.demo.iot.nirvana.pipeline;

import org.apache.beam.sdk.extensions.gcp.options.GcpOptions;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;

/** Configuration options of the {@link TemperaturePipeline} pipeline. */
public interface TemperaturePipelineOptions extends PipelineOptions, GcpOptions {

  @Description("Pub/Sub topic to read the input from")
  String getInputTopic();

  void setInputTopic(String value);

  @Description("BigQuery table")
  String getTable();

  void setTable(String value);

  @Description("Error file prefix on Google Cloud Storage")
  String getErrLocationPrefix();

  void setErrLocationPrefix(String value);
}
