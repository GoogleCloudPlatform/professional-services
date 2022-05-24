package com.google.cloud.imf.util.stats

import com.google.api.services.bigquery.model.Job
import com.google.cloud.bqsh.BQ
import com.google.cloud.bqsh.BQ.SchemaRowBuilder

object InsertStats {
  def forJob(j: Job): Option[InsertStats] = {
    if (j.getStatistics == null ||
      j.getStatistics.getQuery == null ||
      j.getStatistics.getQuery.getStatementType != "INSERT" ||
      j.getStatistics.getQuery.getDmlStats == null ||
      j.getConfiguration == null ||
      j.getConfiguration.getQuery == null ||
      j.getConfiguration.getQuery.getDestinationTable == null
    ) return None

    val stats = j.getStatistics.getQuery.getDmlStats

    Some(InsertStats(
      rowsWritten = stats.getInsertedRowCount,
      rowsInserted = stats.getInsertedRowCount,
      destination = BQ.tableSpec(j.getConfiguration.getQuery.getDestinationTable)
    ))
  }

  def put(s: InsertStats, row: SchemaRowBuilder): Unit = {
    row
      .put("rows_inserted", s.rowsWritten)
      .put("rows_written", s.rowsWritten)
      .put("destination", s.destination)
  }

  def report(s: InsertStats): String = {
    s"""Insert results:
       |Inserts ${s.rowsInserted} rows to ${s.destination}
       |""".stripMargin
  }
}

case class InsertStats(rowsInserted: Long,
                       rowsWritten: Long,
                       destination: String)