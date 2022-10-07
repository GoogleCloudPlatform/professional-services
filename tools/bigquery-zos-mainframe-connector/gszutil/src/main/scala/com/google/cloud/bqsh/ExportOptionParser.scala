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

object ExportOptionParser
  extends OptionParser[ExportConfig]("export")
  with ArgParser[ExportConfig] {
  override def parse(args: Seq[String], env: Map[String,String]): Option[ExportConfig] =
    parse(args, ExportConfig())

  head("export", Bqsh.UserAgent)

  help("help")
    .text("prints this usage text")

  // z/OS Options
  opt[String]("query_dsn")
    .optional
    .text("(optional) DSN to read query from in format HLQ.MEMBER or HLQ.PDS(MEMBER)")
    .action((x,c) => c.copy(queryDSN = x))

  opt[String]("sql")
    .optional
    .text("(optional) SQL BQ query")
    .action((x,c) => c.copy(sql = x))

  opt[String]("outDD")
    .optional
    .text("(optional) DD to write output records to (default: OUTFILE)")
    .action((x,c) => c.copy(outDD = x))

  opt[String]("cobDsn")
    .optional
    .text("(optional) DSN to read copybook from. If not provided, copybook will be read from " +
      "DD:COPYBOOK")
    .action((x,c) => c.copy(cobDsn = x))

  opt[Unit]("vartext")
    .text("When specified, write pipe-delimited string output.")
    .action((x,c) => c.copy(vartext = true))

  opt[String]("pic_t_charset")
    .optional()
    .text("(optional) charset used for encoding and decoding international strings, used with PIC T copybook type, default is EBCDIC")
    .action((x,c) => c.copy(picTCharset = Option(x)))

  opt[String]("bucket")
    .optional()
    .text("(optional) GCS bucket where to write")
    .action((x,c) => c.copy(bucket = x))

  opt[String]("remoteHost")
    .optional()
    .action{(x,c) => c.copy(remoteHost = x)}
    .text("remote host or ip address")

  opt[Int]("remotePort")
    .optional()
    .action{(x,c) => c.copy(remotePort = x)}
    .text("remote port (default: 52701)")

  opt[Int]("timeOutMinutes")
    .optional()
    .action{(x,c) => c.copy(timeoutMinutes = x)}
    .text("(optional) Timeout in minutes for GRecvExportGrpc call. (default for GCS: 90 minutes)")

  opt[Int]("keepAliveTimeInSeconds")
    .optional()
    .action{(x,c) => c.copy(keepAliveTimeInSeconds = x)}
    .text("(optional) keep alive timeout in seconds for http channel. (default: 480 seconds)")

  opt[String]("run_mode")
    .optional
    .text("(optional) Switches between export implementations, currently supported: parallel, single thread exports. Possible values single, parallel, default is parallel")
    .action((x,c) => c.copy(runMode = x))

  // Standard Options

  opt[Unit]("allow_large_results")
    .text("When specified, enables large destination table sizes for legacy SQL queries.")
    .action((x,c) => c.copy(allowLargeResults = true))

  opt[Unit]("use_legacy_sql")
    .text("When set to false, runs a standard SQL query. The default value is false (uses Standard SQL).")
    .action((x,c) => c.copy(useLegacySql = true))

  opt[String]("destination_table")
    .text("The name of the destination table for writing query results. The default value is ''")
    .action((x,c) => c.copy(destinationTable = x))

  opt[Boolean]("use_cache")
    .text("When specified, caches the query results. The default value is true.")
    .action((x,c) => c.copy(useCache = x))

  opt[Unit]("batch")
    .text("When specified, run the query in batch mode. The default value is false.")
    .action((_,c) => c.copy(batch = true))

  opt[Unit]("dry_run")
    .text("When specified, the query is validated but not run.")
    .action((_,c) => c.copy(dryRun = true))

  opt[Long]("maximum_bytes_billed")
    .text("An integer that limits the bytes billed for the query. If the query goes beyond the limit, it fails (without incurring a charge). If not specified, the bytes billed is set to the project default.")
    .action((x,c) => c.copy(maximumBytesBilled = x))

  opt[Unit]("require_cache")
    .text("If specified, run the query only if results can be retrieved from the cache.")
    .action((_,c) => c.copy(requireCache = true))

  opt[Boolean]("require_partition_filter")
    .text("If specified, a partition filter is required for queries over the supplied table. This flag can only be used with a partitioned table.")
    .action((x,c) => c.copy(requirePartitionFilter = x))

  opt[Boolean]("use_cache")
    .text("When specified, caches the query results. The default value is true.")
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
    .text(GlobalConfig.locationText)
    .action((x,c) => c.copy(location = x))

  opt[String]("project_id")
    .text(GlobalConfig.projectIdText)
    .action((x,c) => c.copy(projectId = x))

  opt[Boolean]("synchronous_mode")
    .text(GlobalConfig.synchronousModeText)
    .action((x,c) => c.copy(sync = x))

  opt[Boolean]("sync")
    .text(GlobalConfig.syncText)
    .action((x,c) => c.copy(sync = x))

  // Custom Options
  opt[String]("encoding")
    .optional()
    .text("(optional) charset used for encoding and decoding character fields. Overrides default set by ENCODING environment variable.")
    .action((x, c) => c.copy(encoding = Option(x)))

  opt[String]("stats_table")
    .optional()
    .text("tablespec of table to insert stats")
    .action((x,c) => c.copy(statsTable = x))
}
