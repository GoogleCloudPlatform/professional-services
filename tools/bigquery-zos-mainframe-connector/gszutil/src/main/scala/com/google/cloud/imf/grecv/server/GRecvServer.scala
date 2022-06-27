package com.google.cloud.imf.grecv.server

import java.net.InetSocketAddress
import java.util.concurrent.Executors
import com.google.api.services.storage.{Storage => LowLevelStorageApi}
import com.google.cloud.bigquery.BigQuery
import com.google.cloud.bigquery.storage.v1.BigQueryReadClient
import com.google.cloud.imf.grecv.GRecvConfig
import com.google.cloud.imf.util.{GzipCodec, Logging}
import com.google.cloud.storage.Storage
import com.google.protobuf.ByteString
import io.grpc.Server
import io.grpc.netty.NettyServerBuilder
import io.grpc.{Grpc, Server, ServerBuilder, TlsServerCredentials}

import java.io.File


class GRecvServer(cfg: GRecvConfig,
                  storageFunc: ByteString => Storage,
                  bqStorageFunc: ByteString => BigQueryReadClient,
                  storageApiFunc: ByteString => LowLevelStorageApi,
                  bqFunc: (String, String, ByteString) => BigQuery) extends Logging {
  private val server: Server = {
    val ex = Executors.newWorkStealingPool()
    val tlsBuilder = TlsServerCredentials.newBuilder.keyManager(new File(cfg.chain), new File(cfg.key))
    val b = Grpc.newServerBuilderForPort(cfg.port, tlsBuilder.build())
      .addService(new GRecvService(storageFunc, bqStorageFunc, storageApiFunc, bqFunc)).asInstanceOf[ServerBuilder[_]]
      .compressorRegistry(GzipCodec.compressorRegistry).asInstanceOf[ServerBuilder[_]]
      .executor(ex).asInstanceOf[ServerBuilder[_]]
    b.build
  }

  def start(block: Boolean = true): Unit = {
    logger.info(s"starting server on ${cfg.host}:${cfg.port}")
    server.start()
    if (block) {
      logger.info("awaiting server termination")
      server.awaitTermination()
      logger.info("server terminated")
    }
  }

  def shutdown(): Unit = {
    server.shutdownNow()
  }
}
