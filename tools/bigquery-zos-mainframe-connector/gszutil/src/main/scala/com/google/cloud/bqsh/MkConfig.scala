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

import com.google.cloud.imf.util.StaticMap

import scala.jdk.CollectionConverters.SeqHasAsJava

object MkConfig {
  def create(sourceUris: String,
             tablespec: String,
             datasetId: String,
             location: String,
             projectId: String): MkConfig = {
    val externalTableUri = sourceUris.split(",")
      .map(x => new URI(x.stripSuffix("/") + "/*.orc")).toSeq
    MkConfig(externalTableUri = externalTableUri,
             tablespec = tablespec,
             datasetId = datasetId,
             location = location,
             projectId = projectId)
  }
}

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
) {
  def toMap: java.util.Map[String,Any] = {
    val m = StaticMap.builder
    m.put("type","MkConfig")
    m.put("datasetId",datasetId)
    if (jobId.nonEmpty)
      m.put("jobId",jobId)
    m.put("location",location)
    m.put("projectId",projectId)

    if (statsTable.nonEmpty)
      m.put("statsTable",statsTable)

    if (externalTableUri.nonEmpty)
      m.put("externalTableUri",externalTableUri.map(_.toString).asJava)

    if (externalTableDefinition.nonEmpty)
      m.put("externalTableDefinition",externalTableDefinition)

    if (description.nonEmpty)
      m.put("description",description)

    if (tablespec.nonEmpty)
      m.put("tablespec",tablespec)

    if (view)
      m.put("view", view)

    if (expiration > 0)
      m.put("expiration", expiration.toString)
    if (statsTable.nonEmpty)
      m.put("statsTable",statsTable)

    m.build()
  }
}

