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

package com.google.example;

import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.Validation.Required;

public interface ExampleReadOptions extends PipelineOptions {

  @Description("Source File Pattern Blob")
  @Required
  public String getSource();

  public void setSource(String value);

  @Description("Sink File Pattern Blob")
  @Required
  public String getSink();

  public void setSink(String value);

  @Description("Path to quarantine of invalid records")
  @Required
  public String getQuarantine();

  public void setQuarantine(String value);
}
