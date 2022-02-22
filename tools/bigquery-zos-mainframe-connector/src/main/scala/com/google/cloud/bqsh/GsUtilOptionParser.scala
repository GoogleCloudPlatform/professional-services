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

import scopt.OptionParser


object GsUtilOptionParser extends OptionParser[GsUtilConfig]("gsutil") with ArgParser[GsUtilConfig] {
  def parse(args: Seq[String]): Option[GsUtilConfig] =
    parse(args, GsUtilConfig())

  head("gsutil", Bqsh.UserAgent)

  help("help").text("prints this usage text")

  cmd("cp")
    .text("Upload Binary MVS Dataset to GCS")
    .action((_,c) => c.copy(mode = "cp"))
    .children(
      opt[Unit]("replace")
        .optional()
        .action{(_,c) => c.copy(replace = true, recursive = true)}
        .text("delete before uploading"),

      opt[Int]("partSizeMB")
        .optional()
        .action{(x,c) => c.copy(partSizeMB = x)}
        .text("target part size in megabytes (default: 256)"),

      opt[Int]("batchSize")
        .optional()
        .action{(x,c) => c.copy(blocksPerBatch = x)}
        .text("blocks per batch (default: 1000)"),

      opt[Unit]('m', "parallel")
        .optional()
        .action{(_,c) => c.copy(parallelism = 4)}
        .text("number of concurrent writers (default: 4)"),

      opt[Int]('p', "parallelism")
        .optional()
        .action{(x,c) => c.copy(parallelism = x)}
        .text("number of concurrent writers (default: 4)"),

      opt[Int]("timeOutMinutes")
        .optional()
        .action{(x,c) => c.copy(timeOutMinutes = x)}
        .text("timeout in minutes (default: 60)")
    )

  cmd("rm")
    .action((_,c) => c.copy(mode = "rm"))
    .text("Delete objects in GCS")
    .children(
      opt[Unit]('r',"recursive")
        .optional()
        .action{(_,c) => c.copy(recursive = true)}
        .text("delete directory"),

      opt[Unit]('f',"force")
        .optional()
        .text("delete without use interaction (always true)")
    )

  arg[String]("destinationUri")
    .required()
    .text("Destination URI (gs://bucket/path)")
    .validate{x =>
      val uri = new URI(x)
      if (uri.getScheme != "gs" || uri.getAuthority.isEmpty)
        failure("invalid GCS URI")
      else
        success
    }
    .action((x, c) => c.copy(destinationUri = x))

  // Global Options from BigQuery
  opt[String]("dataset_id")
    .text(GlobalConfig.datasetIdText)
    .action((x,c) => c.copy(datasetId = x))

  opt[String]("location")
    .text(GlobalConfig.locationText)
    .action((x,c) => c.copy(location = x))

  opt[String]("project_id")
    .text(GlobalConfig.projectIdText)
    .action((x,c) => c.copy(projectId = x))

  // Custom Options
  opt[Unit]("allow_non_ascii")
    .text("allow non ascii characters")
    .action((_,c) => c.copy(allowNonAscii = true))

  opt[String]("stats_table")
    .optional()
    .text("tablespec of table to insert stats")
    .action((x,c) => c.copy(statsTable = x))

  opt[Double]("max_error_pct")
    .optional()
    .text("job failure threshold for row decoding errors (default: 0.0")
    .action((x,c) => c.copy(maxErrorPct = x))
}
