/*
 * Copyright 2020 Google LLC All Rights Reserved.
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

import com.google.api.services.bigquery.model.{Job, JobStatistics2}
import com.google.cloud.bqsh.BQ
import com.google.cloud.bqsh.BQ.SchemaRowBuilder

object UpdateStats {
  def forJob(j: Job): Option[UpdateStats] = {
    if (j.getStatistics == null ||
      j.getStatistics.getQuery == null ||
      j.getStatistics.getQuery.getStatementType != "UPDATE" ||
      j.getStatistics.getQuery.getQueryPlan == null ||
      j.getConfiguration.getQuery == null
    ) return None

    val statistics: JobStatistics2 = j.getStatistics.getQuery
    val q = j.getConfiguration.getQuery

    val destTable = if (q.getDestinationTable != null) BQ.tableSpec(q.getDestinationTable) else ""
    val rowsUpdated: Long = statistics.getDmlStats.getUpdatedRowCount

    Option(UpdateStats(
      rowsUpdated = rowsUpdated,
      destination = destTable))
  }

  def put(s: UpdateStats, row: SchemaRowBuilder): Unit = {
    row
      .put("destination", s.destination)
      .put("rows_updated", s.rowsUpdated)
  }

  def report(s: UpdateStats): String = {
    s"""Update results:
       |Updated ${s.rowsUpdated} rows from ${s.destination}
       |""".stripMargin
  }
}

case class UpdateStats(destination: String, rowsUpdated: Long)
