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

import com.google.api.services.bigquery.model.{Job, JobStatistics2, TableReference}
import com.google.cloud.bqsh.BQ
import com.google.cloud.bqsh.BQ.SchemaRowBuilder

import scala.jdk.CollectionConverters.ListHasAsScala

object MergeStats {
  def forJob(job: Job): Option[MergeStats] = {
    if (job.getStatistics == null ||
      job.getStatistics.getQuery == null ||
      job.getStatistics.getQuery.getDmlStats == null ||
      job.getStatistics.getQuery.getStatementType != "MERGE" ||
      job.getStatistics.getQuery.getReferencedTables == null ||
      job.getConfiguration == null ||
      job.getConfiguration.getQuery == null ||
      job.getConfiguration.getQuery.getDestinationTable == null)
      return None
    val configurationQuery = job.getConfiguration.getQuery

    val statistics: JobStatistics2 = job.getStatistics.getQuery

    val destinationTable: TableReference = configurationQuery.getDestinationTable
    val sourceTable: Option[TableReference] = statistics.getReferencedTables.asScala.find { t =>
      t.getTableId != destinationTable.getTableId ||
        t.getDatasetId != destinationTable.getDatasetId ||
        t.getProjectId != destinationTable.getProjectId
    }

    val rowsInserted: Long = statistics.getDmlStats.getInsertedRowCount
    val rowsDeleted: Long = statistics.getDmlStats.getDeletedRowCount
    val rowsUpdated: Long = statistics.getDmlStats.getUpdatedRowCount

    Option(MergeStats(
      fromTable = sourceTable.map(BQ.tableSpec).getOrElse(""),
      intoTable = BQ.tableSpec(destinationTable),
      rowsInserted = rowsInserted,
      rowsDeleted = rowsDeleted,
      rowsUpdated = rowsUpdated,
    ))
  }

  def put(s: MergeStats, row: SchemaRowBuilder): Unit = {
    row
      .put("destination", s.intoTable)
      .put("source", s.fromTable)
      .put("rows_updated", s.rowsUpdated)
      .put("rows_inserted", s.rowsInserted)
      .put("rows_deleted", s.rowsDeleted)
  }

  def report(s: MergeStats): String = {
    s"""Merge query stats:
       |${s.rowsInserted} rows inserted
       |${s.rowsDeleted} rows deleted
       |${s.rowsUpdated} rows updated
       |""".stripMargin
  }
}

case class MergeStats(fromTable: String,
                      intoTable: String,
                      rowsInserted: Long,
                      rowsDeleted: Long,
                      rowsUpdated: Long)
