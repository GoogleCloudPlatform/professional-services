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

object CurlOptionParser
  extends OptionParser[CurlConfig]("curl")
  with ArgParser[CurlConfig] {
  override def parse(args: Seq[String], env: Map[String,String]): Option[CurlConfig] =
    parse(args, CurlConfig())

  head("curl", Bqsh.UserAgent)

  help("help")
    .text("prints this usage text")

  arg[String]("uri")
    .optional()
    .text("URI of HTTP request")
    .action((x, c) => c.copy(uri = x))

  opt[Boolean]("basic")
    .text("Use HTTP Basic Authentication")
    .action((x, c) => c.copy(basicAuth = x))

  opt[String]("cacert")
    .text("path to CA certificates file in PEM format to verify peer against")
    .action((x, c) => c.copy(caCert = x))

  opt[String]('E', "cert")
    .text("Client certificate file and password")
    .action { (x, c) =>
      x.split(':').toSeq match {
        case Seq(cert,pass) =>
          c.copy(certFilePath = cert, certFilePass = pass)
        case Seq(cert) =>
          c.copy(certFilePath = cert)
        case _ =>
          c
      }
    }

  opt[Boolean]("compressed")
    .text("Request compressed response")
    .action((x, c) => c.copy(compressed = x))

  opt[String]('K', "config")
    .text("Read config from a file")
    .action((x, c) => c.copy(config = x))

  opt[Int]("connect-timeout")
    .text("Maximum time allowed for connection")
    .action((x, c) => c.copy(connectTimeout = x))

  opt[String]('b', "cookie")
    .text("Send cookies from string/file")
    .action((x, c) => c.copy(cookie = x))

  opt[String]('d', "data")
    .text("HTTP POST data")
    .action((x, c) => c.copy(data = x))

  opt[Boolean]('f', "fail")
    .text("Fail fast with no output on HTTP errors")
    .action((x, c) => c.copy(fail = x))

  opt[Boolean]('G', "get")
    .text("Put the post data in the URL and use GET")
    .action((x, c) => c.copy(requestMethod = "GET"))

  opt[Boolean]('I', "head")
    .text("Show document info only")
    .action((x, c) => c.copy(requestMethod = "HEAD"))

  opt[String]("header")
    .maxOccurs(512)
    .text("Pass custom header(s) to server")
    .action((x, c) => c.copy(header = c.header :+ x))

  opt[String]("json")
    .text("HTTP POST JSON")
    .action((x, c) => c.copy(data = x, requestMethod = "POST", contentType = "application/json; charset=utf-8"))

  opt[Boolean]('n', "netrc")
    .text("Must read .netrc for user name and password")
    .action((x, c) => c.copy(netRc = x))

  opt[String]("netrc-file")
    .text("Specify FILE for netrc")
    .action((x, c) => c.copy(netRcFile = x))

  opt[String]("oauth2-bearer")
    .text("OAuth 2 Bearer Token")
    .action((x, c) => c.copy(oauth2BearerToken = x))

  opt[Seq[String]]('r', "range")
    .text("Retrieve only the bytes within RANGE")
    .action {(x, c) =>
      val ranges = x.map(_.split('-').toSeq).flatMap{s =>
        s match {
          case Seq(a,b) if a.forall(_.isDigit) && b.forall(_.isDigit) => Option((a.toInt, b.toInt))
          case _ => None
        }
      }
      c.copy(range = ranges)
    }

  opt[String]('e', "referer")
    .text("Referrer URL")
    .action((x, c) => c.copy(referer = x))

  opt[String]('X', "request")
    .text("Specify request method to use")
    .action((x, c) => c.copy(requestMethod = x.toUpperCase))

  opt[Int]("retry")
    .text("Retry request if transient problems occur")
    .action((x, c) => c.copy(retry = x))

  opt[Boolean]('s', "silent")
    .text("Silent mode")
    .action((x, c) => c.copy(silent = x))

  opt[String]('T', "uploadFile")
    .text("Transfer local FILE to destination")
    .action((x, c) => c.copy(uploadFile = x))

  opt[String]("url")
    .text("URL to work with")
    .action((x, c) => c.copy(uri = x))

  opt[String]('u', "user")
    .text("<user:password> Server user and password")
    .action((x, c) => c.copy(user = x))

  opt[String]('A', "user-agent")
    .text("Send User-Agent <name> to server")
    .action((x, c) => c.copy(userAgent = x))

  opt[Boolean]('v', "verbose")
    .text("Make the operation more talkative")
    .action((x, c) => c.copy(verbose = x))
}
