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

import scopt.OptionParser

object RmOptionParser extends OptionParser[RmConfig]("rm") with ArgParser[RmConfig] {
  override def parse(args: Seq[String], env: Map[String,String]): Option[RmConfig] =
    parse(args, RmConfig())

  head("rm", Bqsh.UserAgent)

  help("help")
    .text("prints this usage text")

  checkConfig{x =>
    if (!(x.model || x.dataset || x.table))
      failure("must specify one of --dataset --table --model")
    else if (x.table && x.tablespec.isEmpty)
      failure("must specify tablespec")
    else success
  }

  arg[String]("tablespec")
    .required()
    .text("[PROJECT_ID]:[DATASET].[TABLE]")
    .action((x,c) => c.copy(tablespec = x))

  opt[Unit]('d', "dataset")
    .text("When specified, deletes a dataset. The default value is false.")
    .action((x,c) => c.copy(dataset = true))

  opt[Unit]('f', "force")
    .text("When specified, deletes a table, view, model, or dataset without prompting. The default value is false.")

  opt[Boolean]('m', "model")
    .text("When specified, deletes a BigQuery ML model.")
    .action((x,c) => c.copy(model = x))

  opt[Unit]('r', "recursive")
    .text("When specified, deletes a dataset and any tables, table data, or models in it. The default value is false.")
    .action((_,c) => c.copy(recursive = true))

  opt[Unit]('t', "table")
    .text("When specified, deletes a table. The default value is false.")
    .action((_,c) => c.copy(table = true))

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
    .action((x,c) => c.copy(synchronousMode = x))

  opt[Boolean]("sync")
    .text(GlobalConfig.syncText)
    .action((x,c) => c.copy(sync = x))
}
