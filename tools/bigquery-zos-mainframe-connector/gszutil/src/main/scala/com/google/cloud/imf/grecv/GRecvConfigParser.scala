package com.google.cloud.imf.grecv

import com.google.cloud.bqsh.Bqsh
import scopt.OptionParser

object GRecvConfigParser extends OptionParser[GRecvConfig]("grecv") {
  def parse(args: Array[String]): Option[GRecvConfig] = parse(args.toIndexedSeq, GRecvConfig())

  head("grecv", Bqsh.UserAgent)

  help("help").text("prints this usage text")

  opt[String]("bindAddress")
    .optional
    .action{(x,c) => c.copy(host = x)}
    .text("Bind Address (default: 127.0.0.1)")

  opt[Int]('p', "port")
    .optional
    .action{(x,c) => c.copy(port = x)}
    .text("Bind Port (default: 51771)")

  opt[String]("chain")
    .optional
    .action{(x,c) => c.copy(chain = x)}
    .text("(optional) path to Certificate Chain (default: chain.pem)")

  opt[String]("key")
    .optional
    .action{(x,c) => c.copy(key = x)}
    .text("(optional) path to Private Key (default: key.pem)")

  opt[Double]("max_error_pct")
    .optional
    .text("job failure threshold for row decoding errors (default: 0)")
    .action((x,c) => c.copy(maxErrorPct = x))

  opt[Unit]("disableTls")
    .optional
    .text("disable TLS")
    .action((_,c) => c.copy(tls = false))

  opt[Unit]("enableTls")
    .optional
    .text("enable TLS")
    .action((_,c) => c.copy(tls = true))

  opt[Unit]("debug")
    .optional
    .text("enable debug logging")
    .action((_,c) => c.copy(debug = true))
}
