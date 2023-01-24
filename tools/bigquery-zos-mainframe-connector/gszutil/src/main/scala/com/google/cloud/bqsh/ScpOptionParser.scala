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

  arg[String]("input")
    .optional()
    .text("DD or DSN to be uploaded")
    .action {(x, c) =>
      if (x.contains(".")) c.copy(inDsn = x)
      else c.copy(inDD = x)
    }

  arg[String]("output")
    .optional()
    .text("URI of output in form gs://[BUCKET]/[PREFIX]")
    .action((x, c) => c.copy(gcsOutUri = x))

  opt[Long]('n', "count")
    .text("(optional) number of records to copy (default: unlimited)")
    .action((x,c) => c.copy(limit = x))

  opt[Unit]("compress")
    .text("(optional) compress output with gzip (default: disabled)")
    .action((_,c) => c.copy(compress = true))

  opt[String]("inDD")
    .text("DD to be uploaded (INFILE will be used if not provided)")
    .action((x,c) => c.copy(inDD = x))

  opt[String]("inDsn")
    .text("DSN to be uploaded")
    .action((x,c) => c.copy(inDsn = x))

  opt[String]("gcsOutUri")
    .text("GCS URI of dataset copy")
    .action((x,c) => c.copy(gcsOutUri = x))

  opt[String]("encoding")
    .text("(optional) input character encoding. default: CP1037")
    .action((x,c) => c.copy(encoding = x, convert = true))

  opt[Unit]("noConvert")
    .text("(optional) disable conversion of character input to ASCII. default: enabled")
    .action((x,c) => c.copy(convert = false))

  checkConfig{x =>
    if (x.inDD.nonEmpty && x.inDsn.nonEmpty) {
      failure("only one of --inDD or --inDsn may be specified")
    } else success
  }
}
