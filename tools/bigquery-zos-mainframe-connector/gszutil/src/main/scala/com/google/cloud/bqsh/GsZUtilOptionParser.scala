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

package com.google.cloud.bqsh

import scopt.OptionParser

object GsZUtilOptionParser extends OptionParser[GsZUtilConfig]("gszutil")
with ArgParser[GsZUtilConfig]{
  override def parse(args: Seq[String], env: Map[String,String]): Option[GsZUtilConfig] = {
    val envCfg = GsZUtilConfig(
      gcsOutUri = env.getOrElse("GCSOUTURI", ""),
      remoteHost = env.getOrElse("SRVHOSTNAME",""),
      remotePort = env.getOrElse("SRVPORT","51770").toInt,
    )
    parse(args, envCfg)
  }

  head("gszutil", Bqsh.UserAgent)

  help("help").text("prints this usage text")

  opt[String]("cobDsn")
    .optional
    .text("DSN of copybook")
    .action((x,c) => c.copy(cobDsn = x))

  opt[String]("inDsn")
    .optional
    .text("DSN of data set to be transcoded to ORC")
    .action((x,c) => c.copy(inDsn = x))

  opt[String]("gcsOutUri")
    .optional
    .text("Cloud Storage prefix for output ORC files (format: gs://BUCKET/PREFIX)")
    .action((x,c) => c.copy(gcsOutUri = x))

  opt[String]("remoteHost")
    .optional
    .text("hostname or IP address of GRecv transcoding service (default: obtained from " +
      "SRVHOSTNAME environment variable)")
    .action((x,c) => c.copy(remoteHost = x))

  opt[String]("remotePort")
    .optional
    .text("port of GRecv transcoding service (default: 51770 or SRVPORT environment variable)")
    .action((x,c) => c.copy(remoteHost = x))

  opt[String]("pic_t_charset")
    .optional()
    .text("(optional) charset used for encoding and decoding international strings, used with PIC T copybook type, default is EBCDIC")
    .action((x,c) => c.copy(picTCharset = Option(x)))

  opt[Int]("timeOutMinutes")
    .optional()
    .action{(x,c) => c.copy(timeOutMinutes = Option(x))}
    .text("(optional) Timeout in minutes for GRecvGrpc call. (default for GCS: 90 minutes, for Mainframe: 50 minutes)")

  opt[Int]("keepAliveTimeInSeconds")
    .optional()
    .action{(x,c) => c.copy(keepAliveTimeInSeconds = Option(x))}
    .text("(optional) keep alive timeout in seconds for http channel. (default: 480 seconds)")

  opt[String]("stats_table")
    .optional()
    .text("tablespec of table to insert stats")
    .action((x,c) => c.copy(statsTable = x))

  opt[String]("dataset_id")
    .optional()
    .text(GlobalConfig.datasetIdText)
    .action((x,c) => c.copy(datasetId = x))

  opt[String]("location")
    .optional()
    .text(GlobalConfig.locationText)
    .action((x,c) => c.copy(location = x))

  opt[String]("project_id")
    .optional()
    .text(GlobalConfig.projectIdText)
    .action((x,c) => c.copy(projectId = x))
}
