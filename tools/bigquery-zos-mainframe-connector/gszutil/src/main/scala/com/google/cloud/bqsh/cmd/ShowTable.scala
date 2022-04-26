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

package com.google.cloud.bqsh.cmd

import com.google.cloud.bigquery.Field.Mode
import com.google.cloud.bigquery.{ExternalTableDefinition, MaterializedViewDefinition, ModelTableDefinition, Schema, StandardTableDefinition, TableDefinition, ViewDefinition}
import com.google.cloud.bqsh.{ArgParser, BQ, Command, ReturnCodes, ShowTableConfig, ShowTableOptionParser}
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.util.{Logging, Services}

import scala.jdk.CollectionConverters.ListHasAsScala

object ShowTable extends Command[ShowTableConfig] with Logging {
  override val name: String = "bq show"
  override val parser: ArgParser[ShowTableConfig] = ShowTableOptionParser

  def printSchema(s: Schema): String = {
    val sb = new StringBuilder
    s.getFields.forEach{f =>
      sb.append(s"${f.getName}\t${f.getType.getStandardType}")
      if (f.getMode == Mode.REQUIRED) {
        sb.append("\t")
        sb.append("NOT NULL")
      } else if (f.getMode == Mode.REPEATED) {
        sb.append("\t")
        sb.append("REPEATED")
      }
      if (f.getDescription != null) {
        val shortDesc = f.getDescription.replaceAllLiterally("\n"," ").take(32)
        sb.append("\t'")
        sb.append(shortDesc)
        if (shortDesc.length < f.getDescription.length)
          sb.append("...")
        sb.append("'")
      }
      sb.append("\n")
    }
    sb.result
  }

  override def run(cfg: ShowTableConfig, zos: MVS, env: Map[String,String]): Result = {
    val creds = zos.getCredentialProvider().getCredentials
    val bq = Services.bigQuery(cfg.projectId, cfg.location, creds)
    val tableSpec = BQ.resolveTableSpec(cfg.tablespec, cfg.projectId, cfg.datasetId)
    val maybeTable = Option(bq.getTable(tableSpec))
    maybeTable match {
      case Some(t) =>
        t.getDefinition[TableDefinition] match {
          case x: StandardTableDefinition =>
            if (!cfg.quiet)
              logger.info(
                s"""TABLE
                   |Schema:
                   |${printSchema(x.getSchema)}""".stripMargin)

          case x: ViewDefinition =>
            if (!cfg.quiet)
              logger.info(
                s""""VIEW
                   |Schema:
                   |${printSchema(x.getSchema)}
                   |Query:
                   |${x.getQuery}""".stripMargin)

          case x: ExternalTableDefinition =>
            if (!cfg.quiet)
              logger.info(
                s"""EXTERNAL TABLE
                   |Source URIs: ${x.getSourceUris.asScala.mkString(",")}
                   |Schema:
                   |${printSchema(x.getSchema)}""".stripMargin)

          case x: ModelTableDefinition =>
            if (!cfg.quiet)
              logger.info(
                s"""MODEL
                   |Schema:
                   |${printSchema(x.getSchema)}""".stripMargin)

            x.getType
          case x: MaterializedViewDefinition =>
            val dt = (System.currentTimeMillis - x.getLastRefreshTime)/1000L
            if (!cfg.quiet)
              logger.info(
                s"""MATERIALIZED VIEW
                   |Last Refresh Time: $dt seconds ago
                   |Refresh Enabled: ${x.getEnableRefresh}
                   |Schema:
                   |${printSchema(x.getSchema)}
                   |Query:
                   |${x.getQuery}""".stripMargin)

          case x =>
            val msg = s"ShowTable ERROR Unsupported TableDefinition type: " +
              s"${x.getClass.getCanonicalName}"
            logger.error(msg)
        }
        Result.Success

      case None =>
        val msg = s"${cfg.tablespec} doesn't exist"
        if (!cfg.quiet)
          logger.info(s"show table: $msg")
        Result(exitCode = ReturnCodes.DoesNotExist, message = msg)
    }
  }
}
