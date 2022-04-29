/*
 * Copyright 2022 Google LLC All Rights Reserved.
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

object ScpOptionParser extends OptionParser[ScpConfig]("scp") with ArgParser[ScpConfig]{
  override def parse(args: Seq[String], env: Map[String,String]): Option[ScpConfig] = parse(args, ScpConfig())

  head("scp", Bqsh.UserAgent)

  help("help").text("prints this usage text")

  opt[Long]("count")
    .optional
    .text("(optional) number of records to copy (default: unlimited)")
    .action((x,c) => c.copy(limit = x))

  opt[Unit]("noCompress")
    .optional
    .text("(optional) compress output with gzip (default: true)")
    .action((_,c) => c.copy(compress = false))

  opt[String]("inDD")
    .optional
    .text("DD to be uploaded (INFILE will be used if not provided)")
    .action((x,c) => c.copy(inDD = x))

  opt[String]("inDsn")
    .optional
    .text("DSN to be uploaded")
    .action((x,c) => c.copy(inDsn = x))

  opt[String]("gcsOutUri")
    .optional
    .text("GCS URI of dataset copy")
    .action((x,c) => c.copy(gcsOutUri = x))

  checkConfig{x =>
    if (x.inDD.nonEmpty && x.inDsn.nonEmpty) {
      failure("only one of --inDD or --inDsn may be specified")
    } else success
  }
}
