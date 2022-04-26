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
