package com.google.cloud.bqsh

import java.net.URI

import scopt.OptionParser

import scala.util.{Failure, Success, Try}

object SdsfUtilOptionParser
  extends OptionParser[SdsfUtilConfig]("sdsfutil") with ArgParser[SdsfUtilConfig] {
  override def parse(args: Seq[String], env: Map[String,String]): Option[SdsfUtilConfig] = parse(args, SdsfUtilConfig())

  head("sdsfutil", Bqsh.UserAgent)

  help("help").text("prints this usage text")

  opt[String]("jobPrefix")
    .text("job prefix (default '*')")
    .validate{x =>
      if (x.length > 8) failure("max length 8")
      else if (x.forall{c => c.isLetterOrDigit || c == '*'})
        failure("invalid character in job name")
      else success
    }
    .action((x,c) => c.copy(jobPrefix = x))

  opt[String]("owner")
    .text("owner (default '*')")
    .validate{x =>
      if (x.length > 8) failure("max length 8")
      else if (x.forall{c => c.isLetterOrDigit || c == '*'})
        failure("invalid character in owner")
      else success
    }
    .action((x,c) => c.copy(owner = x))

  opt[String]("bucket")
    .text("GCS bucket where logs will be exported")
    .action((x,c) => c.copy(bucket = x))

  opt[String]("objPrefix")
    .text("Object prefix where logs will be exported")
    .action((x,c) => c.copy(objPrefix = x))

  arg[String]("gcsUri")
    .optional()
    .text("URI to export example: gs://bucket/prefix")
    .validate{x =>
      Try(new URI(x)) match {
        case Success(uri) if uri.getScheme == "gs" =>
          success
        case Failure(_) =>
          failure(s"invalid URI '$x'")
      }
    }
    .action{(x,c) =>
      val uri = new URI(x)
      c.copy(bucket = uri.getAuthority, objPrefix = uri.getPath.stripPrefix("/"))
    }
}
