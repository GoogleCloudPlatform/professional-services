/*
 * Copyright 2022 Google LLC All Rights Reserved.
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

package com.google.cloud.imf.util.stats

import com.google.api.services.bigquery.model.Job
import com.google.cloud.bqsh.BQ
import com.google.cloud.bqsh.BQ.SchemaRowBuilder

import scala.jdk.CollectionConverters.ListHasAsScala

object LoadStats {
  def forJob(j: Job): Option[LoadStats] = {
    if (j.getConfiguration == null ||
        j.getConfiguration.getLoad == null ||
        j.getStatistics == null ||
        j.getStatistics.getLoad == null ||
        j.getStatistics.getLoad.getOutputRows == null) return None
    val c = j.getConfiguration.getLoad
    val s = j.getStatistics.getLoad

    val source: String =
      if (c.getSourceUris != null)
        c.getSourceUris.asScala.mkString(",")
      else ""
    val destination: String =
      if (c.getDestinationTable != null)
        BQ.tableSpec(c.getDestinationTable)
      else ""
    val rowsLoaded: Long =
      if (s.getOutputRows != null) s.getOutputRows else -1

    Option(LoadStats(source = source,
      destination = destination,
      rowsLoaded = rowsLoaded
    ))
  }

  def put(s: LoadStats, row: SchemaRowBuilder): Unit = {
    row
      .put("source", s.source)
      .put("destination", s.destination)
      .put("rows_loaded", s.rowsLoaded)
      .put("rows_written", s.rowsLoaded)
      .put("rows_read", s.rowsLoaded)
  }

  def report(s: LoadStats): String =
    s"""source: ${s.source}
       |destination: ${s.destination}
       |rows loaded: ${s.rowsLoaded}
       |""".stripMargin
}

case class LoadStats(source: String,
                     destination: String,
                     rowsLoaded: Long)
