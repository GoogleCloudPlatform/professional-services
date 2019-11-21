/*
 * Copyright 2019 Google LLC All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.bqsh

import java.net.URI

case class MkConfig (
  // Standard options
  clusteringFields: Seq[String] = Seq.empty,
  dataset: Boolean = false,
  defaultPartitionExpiration: Int = -1,
  defaultTableExpiration: Int = -1,
  description: String = "",
  destinationKmsKey: String = "",
  expiration: Long = -1,
  externalTableDefinition: String = "",
  externalTableUri: Seq[URI] = Seq.empty,
  force: Boolean = false,
  label: Seq[String] = Seq.empty,
  requirePartitionFilter: Boolean = true,
  schema: Seq[String] = Seq.empty,
  table: Boolean = false,
  timePartitioningExpiration: Long = -1,
  timePartitioningField: String = "",
  timePartitioningType: String = "DAY",
  useLegacySql: Boolean = false,
  view: Boolean = false,
  tablespec: String = "",

  // Global Options
  datasetId: String = "",
  debugMode: Boolean = false,
  jobId: String = "",
  jobProperties: Map[String,String] = Map.empty,
  location: String = "US",
  projectId: String = "",
  synchronousMode: Boolean = true,
  sync: Boolean = true,

  statsTable: String = ""
)