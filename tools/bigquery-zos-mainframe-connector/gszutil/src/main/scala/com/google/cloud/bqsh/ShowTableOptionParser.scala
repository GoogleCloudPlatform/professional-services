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

object ShowTableOptionParser
  extends OptionParser[ShowTableConfig]("show")
  with ArgParser[ShowTableConfig] {
  override def parse(args: Seq[String], env: Map[String,String]): Option[ShowTableConfig] = parse(args, ShowTableConfig())

  head("show", Bqsh.UserAgent)

  help("help")
    .text("prints this usage text")

  // Custom Options
  arg[Unit]("quiet")
    .optional
    .text("(optional) don't print output")
    .action{(_,c) => c.copy(quiet = true)}

  // Standard Options
  arg[String]("tablespec")
    .required
    .text("[PROJECT_ID]:[DATASET].[TABLE]")
    .action{(x,c) => c.copy(tablespec = x)}

  // Global options
  opt[String]("dataset_id")
    .optional
    .text(GlobalConfig.datasetIdText)
    .action((x,c) => c.copy(datasetId = x))

  opt[String]("location")
    .optional
    .text(GlobalConfig.locationText)
    .action((x,c) => c.copy(location = x))

  opt[String]("project_id")
    .optional
    .text(GlobalConfig.projectIdText)
    .action((x,c) => c.copy(projectId = x))
}
