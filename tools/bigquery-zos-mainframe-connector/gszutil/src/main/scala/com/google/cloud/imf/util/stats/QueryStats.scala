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

import com.google.api.services.bigquery.model.{ExplainQueryStage, Job, JobStatistics, JobStatistics2}
import com.google.cloud.bqsh.BQ.SchemaRowBuilder

import scala.jdk.CollectionConverters.ListHasAsScala

object QueryStats {
  def forJob(j: Job): Option[QueryStats] = {
    val s: JobStatistics = j.getStatistics
    if (s == null) return None
    val q: JobStatistics2 = j.getStatistics.getQuery
    if (q == null) return None
    if (j.getConfiguration == null) return None
    val c = j.getConfiguration.getQuery
    if (c == null) return None

    val queryPlan: Seq[ExplainQueryStage] =
      if (q.getQueryPlan != null)
        q.getQueryPlan.asScala.toSeq
      else Seq.empty

    val executionMs: Long =
      if (s.getEndTime != null && s.getStartTime != null)
        s.getEndTime - s.getStartTime
      else -1

    val queuedMs: Long =
      if (s.getStartTime != null && s.getCreationTime != null)
        s.getStartTime - s.getCreationTime
      else -1

    val slotMs: Long =
      if (j.getStatistics.getTotalSlotMs != null)
        j.getStatistics.getTotalSlotMs
      else 0

    val slotMsToTotalBytesRatio: Double =
      if (q.getTotalBytesProcessed != null && q.getTotalBytesProcessed > 0)
        slotMs.toDouble / q.getTotalBytesProcessed.toDouble
      else 0

    val slotUtilizationRate: Double =
      if (executionMs > 0)
        slotMs.toDouble / executionMs.toDouble
      else 0

    val stageSummary: String = {
      queryPlan.map{stage =>
        val tbls = stage.getSteps.asScala.flatMap{ step =>
          val last = step.getSubsteps.asScala.last
          val tbl = last.stripPrefix("FROM ")
          if (step.getKind == "READ" && last.startsWith("FROM ") && !tbl.startsWith("__")) {
            Option(tbl)
          } else None
        }
        val stepCount = if (stage.getSteps != null) stage.getSteps.size else 0
        val subStepCount = stage.getSteps.asScala.foldLeft(0){(a,b) =>
          if (b.getSubsteps != null) a + b.getSubsteps.size
          else a
        }
        val inputs = if (tbls.nonEmpty) tbls.mkString(" inputs:",",","") else ""
        s"${stage.getName} in:${stage.getRecordsRead} out:${stage.getRecordsWritten} " +
          s"steps:$stepCount subSteps:$subStepCount$inputs"
      }.mkString("\n")
    }

    val stepCount: Int =
      queryPlan.foldLeft(0){(a,b) =>
        a + b.getSteps.size
      }

    val subStepCount: Int =
      queryPlan.foldLeft(0){(a,b) =>
        if (b.getSteps != null)
          a + b.getSteps.asScala.foldLeft(0){(c,d) =>
            if (d.getSubsteps != null)
              c + d.getSubsteps.size()
            else c
          }
        else a
      }

    val bytesProcessed: Long =
      if (q.getTotalBytesProcessed != null && q.getTotalBytesProcessed > 0)
        q.getTotalBytesProcessed
      else 0

    val shuffleBytes: Long =
      queryPlan.foldLeft(0L){(a, b) =>
        if (b.getShuffleOutputBytes != null)
          a + b.getShuffleOutputBytes
        else a
      }

    val spilledBytes: Long =
      queryPlan.foldLeft(0L){(a,b) =>
        if (b.getShuffleOutputBytesSpilled != null)
          a + b.getShuffleOutputBytesSpilled
        else a
      }

    val shuffleBytesToTotalBytesRatio: Double =
      if (bytesProcessed > 0)
        shuffleBytes.toDouble / bytesProcessed.toDouble
      else 0

    val shuffleSpillToShuffleBytesRatio: Double =
      if (shuffleBytes > 0)
        spilledBytes.toDouble / shuffleBytes.toDouble
      else 0

    val shuffleSpillToTotalBytesRatio: Double =
      if (bytesProcessed > 0)
        spilledBytes.toDouble / bytesProcessed.toDouble
      else 0

    Option(QueryStats(
      query = c.getQuery,
      statementType = q.getStatementType,
      stageCount = queryPlan.size,
      stepCount = stepCount,
      subStepCount = subStepCount,
      stageSummary = stageSummary,
      bytesProcessed = bytesProcessed,
      shuffleBytes = shuffleBytes,
      shuffleSpillBytes = spilledBytes,
      slotMs = slotMs,
      slotUtilizationRate = slotUtilizationRate,
      slotMsToTotalBytesRatio = slotMsToTotalBytesRatio,
      shuffleBytesToTotalBytesRatio = shuffleBytesToTotalBytesRatio,
      shuffleSpillToShuffleBytesRatio = shuffleSpillToShuffleBytesRatio,
      shuffleSpillToTotalBytesRatio = shuffleSpillToTotalBytesRatio,
      executionMs = executionMs,
      queuedMs = queuedMs
    ))
  }

  private val GB: Double = 1024*1024*1024
  private val Minutes: Double = 1000*60
  private val Hours: Double = Minutes*60
  private def f(x: Double): String = "%1.5f".format(x)

  def put(s: QueryStats, row: SchemaRowBuilder): Unit = {
    row
      .put("query", s.query)
      .put("statement_type", s.statementType)
      .put("bq_stage_count", s.stageCount)
      .put("bq_step_count", s.stepCount)
      .put("bq_sub_step_count", s.subStepCount)
      .put("bq_stage_summary", s.stageSummary)
      .put("bytes_processed", s.bytesProcessed)
      .put("shuffle_bytes", s.shuffleBytes)
      .put("shuffle_spill_bytes", s.shuffleSpillBytes)
      .put("slot_ms", s.slotMs)
      .put("slot_utilization_rate", s.slotUtilizationRate)
      .put("slot_ms_to_total_bytes_ratio", s.slotMsToTotalBytesRatio)
      .put("shuffle_bytes_to_total_bytes_ratio", s.shuffleBytesToTotalBytesRatio)
      .put("shuffle_spill_bytes_to_shuffle_bytes_ratio", s.shuffleSpillToShuffleBytesRatio)
      .put("shuffle_spill_bytes_to_total_bytes_ratio", s.shuffleSpillToTotalBytesRatio)
      .put("execution_ms", s.executionMs)
      .put("queued_ms", s.queuedMs)
  }

  def report(s: QueryStats): String = {
    s"""
       |${s.statementType} query stats:
       |${s.stageCount} stages
       |${s.stepCount} steps
       |${s.subStepCount} sub-steps
       |
       |Stage summary:
       |${s.stageSummary}
       |
       |Utilization:
       |${f(s.bytesProcessed.toDouble/GB)} GB processed
       |${f(s.shuffleSpillBytes/GB)} GB spilled to disk during shuffle
       |${f(s.slotMs.toDouble/Hours)} slot hours consumed
       |${f(s.slotUtilizationRate)} slots utilized on average over the duration of the query
       |${f(s.slotMsToTotalBytesRatio)} ratio of slot ms to bytes processed
       |${f(s.shuffleBytesToTotalBytesRatio)} ratio of bytes shuffled to bytes processed
       |${f(s.shuffleSpillToShuffleBytesRatio)} ratio of bytes spilled to shuffle bytes (lower is better)
       |${f(s.shuffleSpillToTotalBytesRatio)} ratio of bytes spilled to bytes processed (lower is better)
       |
       |Timing:
       |${f(s.executionMs.toDouble/Minutes)} minutes execution time
       |${f(s.queuedMs.toDouble/Minutes)} minutes waiting in queue
       |
       |""".stripMargin
  }
}

case class QueryStats(
                       query: String,
                       statementType: String,
                       stageCount: Int,
                       stepCount: Int,
                       subStepCount: Int,
                       stageSummary: String,
                       bytesProcessed: Long,
                       shuffleBytes: Long,
                       shuffleSpillBytes: Long,
                       slotMs: Long,
                       slotUtilizationRate: Double,
                       slotMsToTotalBytesRatio: Double,
                       shuffleBytesToTotalBytesRatio: Double,
                       shuffleSpillToShuffleBytesRatio: Double,
                       shuffleSpillToTotalBytesRatio: Double,
                       executionMs: Long,
                       queuedMs: Long)
