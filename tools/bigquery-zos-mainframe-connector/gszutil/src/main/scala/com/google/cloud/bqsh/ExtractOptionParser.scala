/*
 * Copyright 2022 Google LLC All Rights Reserved
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

import scopt.OptionParser

object ExtractOptionParser
  extends OptionParser[ExtractConfig]("extract")
  with ArgParser[ExtractConfig] {
  override def parse(args: Seq[String], env: Map[String,String]): Option[ExtractConfig] =
    parse(args, ExtractConfig())

  head("extract", Bqsh.UserAgent)

  help("help")
    .text("prints this usage text")

  // z/OS Options
  opt[String]("destinationUri")
    .text("Cloud Storage location to write extracted data")
    .action((x, c) => c.copy(destinationUri = x))

  opt[String]("query_dsn")
    .text("(optional) DSN to read query from in format HLQ.MEMBER or HLQ.PDS(MEMBER). When provided, takes precedence over QUERY DD.")
    .action((x,c) => c.copy(queryDSN = x))

  opt[String]("sql")
    .text("(optional) SQL query to be extracted. When provided, takes precedence over QUERY DD.")
    .action((x,c) => c.copy(sql = x))

  opt[String]("sourceTable")
    .text("(optional) Tablespec to extract from. When provided, table will be extracted directly and SQL query job will not be submitted.")
    .action((x,c) => c.copy(sourceTable = x))

  opt[String]("format")
    .text("(optional) Format to extract to. Default is CSV.")
    .action((x,c) => c.copy(format = x))

  opt[String]("field_delimiter")
    .text("(optional) For CSV exports, specifies the character that marks the boundary between columns in the output file. The delimiter can be any ISO-8859-1 single-byte character. You can use \\t or tab to specify tab delimiters.")
    .action((x,c) => c.copy(delimiter = x))

  opt[Int]("timeOutMinutes")
    .action{(x,c) => c.copy(timeoutMinutes = x)}
    .text("(optional) Timeout in minutes for extract job. (default: 90 minutes)")

  // Standard Options
  opt[Unit]("allow_large_results")
    .text("(optional) When specified, enables large destination table sizes for legacy SQL queries.")
    .action((x,c) => c.copy(allowLargeResults = true))

  opt[Unit]("use_legacy_sql")
    .text("(optional) When specified, uses legacy SQL. The default value is false (uses Standard SQL).")
    .action((x,c) => c.copy(useLegacySql = true))

  opt[String]("destination_table")
    .text("(optional) The name of the destination table for writing query results. The default value is ''")
    .action((x,c) => c.copy(destinationTable = x))

  opt[Boolean]("use_cache")
    .text("(optional) When specified, caches the query results. The default value is true.")
    .action((x,c) => c.copy(useCache = x))

  opt[Unit]("batch")
    .text("(optional) When specified, run the query in batch mode. The default value is false.")
    .action((_,c) => c.copy(batch = true))

  opt[Unit]("dry_run")
    .text("(optional) When specified, the query is validated but not run.")
    .action((_,c) => c.copy(dryRun = true))

  opt[Long]("maximum_bytes_billed")
    .text("(optional) An integer that limits the bytes billed for the query. If the query goes beyond the limit, it fails (without incurring a charge). If not specified, the bytes billed is set to the project default.")
    .action((x,c) => c.copy(maximumBytesBilled = x))

  opt[Boolean]("use_cache")
    .text("(optional) When specified, caches the query results. The default value is true.")
    .action((x,c) => c.copy(useCache = x))

  // Global options
  opt[String]("dataset_id")
    .text(GlobalConfig.datasetIdText)
    .action((x,c) => c.copy(datasetId = x))

  opt[Unit]("debug_mode")
    .text(GlobalConfig.debugModeText)
    .action((x,c) => c.copy(debugMode = true))

  opt[String]("job_id")
    .text(GlobalConfig.jobIdText)
    .action((x,c) => c.copy(jobId = x))

  opt[String]("location")
    .required()
    .text(GlobalConfig.locationText)
    .action((x,c) => c.copy(location = x))

  opt[String]("project_id")
    .required()
    .text(GlobalConfig.projectIdText)
    .action((x,c) => c.copy(projectId = x))

  opt[Boolean]("synchronous_mode")
    .text(GlobalConfig.synchronousModeText)
    .action((x,c) => c.copy(sync = x))

  opt[Boolean]("sync")
    .text(GlobalConfig.syncText)
    .action((x,c) => c.copy(sync = x))

  // Custom Options
  opt[String]("stats_table")
    .optional()
    .text("(optional) tablespec of table to insert stats")
    .action((x,c) => c.copy(statsTable = x))
}
