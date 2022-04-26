package com.google.cloud.imf.grecv

case class GRecvConfig(host: String = "0.0.0.0",
                       port: Int = 51771,
                       chain: String = "chain.pem",
                       key: String = "key.pem",
                       maxErrorPct: Double = 0,
                       tls: Boolean = false,
                       debug: Boolean = false,
                       mode: String = "grpc")

