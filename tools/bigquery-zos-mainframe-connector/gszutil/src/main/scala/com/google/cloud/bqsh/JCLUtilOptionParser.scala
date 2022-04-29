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

object JCLUtilOptionParser extends OptionParser[JCLUtilConfig]("jclutil") with ArgParser[JCLUtilConfig] {
  override def parse(args: Seq[String], env: Map[String,String]): Option[JCLUtilConfig] = parse(args, JCLUtilConfig())

  head("jclutil", Bqsh.UserAgent)

  help("help").text("prints this usage text")

  opt[String]("src")
    .text("source PDS")
    .validate{x =>
      if (x.length < 8) failure("invalid source")
      else success
    }
    .action((x,c) => c.copy(src = x))

  opt[String]("dest")
    .optional()
    .text("destination PDS")
    .validate{x =>
      if (x.length < 8) failure("invalid destination")
      else success
    }
    .action((x,c) => c.copy(dest = x))

  opt[String]("filter")
    .optional()
    .action((x,c) => c.copy(filter = x))

  opt[String]('e',"expr")
    .optional()
    .maxOccurs(1024)
    .action((x,c) => c.copy(expressions = c.expressions ++ Seq(x)))

  opt[Unit]("printSteps")
    .optional()
    .action((x,c) => c.copy(printSteps = true))
}
