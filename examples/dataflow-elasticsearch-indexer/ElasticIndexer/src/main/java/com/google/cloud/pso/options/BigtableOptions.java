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

package com.google.cloud.pso.options;

import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.Validation;

/**
 * Options interface for specifying the inputs to the {@link com.google.cloud.pso.IndexerMain}
 * pipeline.
 */
public interface BigtableOptions extends DataflowPipelineOptions {
  @Description("Bigtable metadata instance id")
  @Validation.Required
  String getInstanceId();

  void setInstanceId(String instanceId);

  @Description("Bigtable metadata table name")
  @Validation.Required
  String getTableName();

  void setTableName(String tableName);

  @Description("Bigtable metadata table column family")
  @Validation.Required
  String getColumnFamily();

  void setColumnFamily(String columnFamily);

  @Description("Bigtable metadata table column qualifier")
  @Validation.Required
  String getColumnQualifier();

  void setColumnQualifier(String columnQualifier);
}
