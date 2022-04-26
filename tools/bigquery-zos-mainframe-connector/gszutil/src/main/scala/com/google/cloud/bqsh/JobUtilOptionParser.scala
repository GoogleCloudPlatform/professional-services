package com.google.cloud.bqsh

import scopt.OptionParser

object JobUtilOptionParser
  extends OptionParser[JobUtilConfig]("jobutil")
  with ArgParser[JobUtilConfig] {
  override def parse(args: Seq[String], env: Map[String,String]): Option[JobUtilConfig] =
    parse(args, JobUtilConfig())

  head("jobutil", Bqsh.UserAgent)

  help("help").text("prints this usage text")

  opt[String]("src")
    .text("source PDS")
    .validate{x =>
      if (x.length < 8) failure("invalid source")
      else success
    }
    .action((x,c) => c.copy(src = x))

  opt[String]("filter")
    .optional()
    .action((x,c) => c.copy(filter = x))
}
