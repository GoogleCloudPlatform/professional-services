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
package com.google.cloud.imf.util

import java.util
import java.util.concurrent.{Executor, ScheduledExecutorService, TimeUnit}

import com.google.api.gax.grpc.{ChannelFactory, ChannelUtil, GrpcHeaderInterceptor, GrpcTransportChannel}
import com.google.api.gax.rpc.{FixedHeaderProvider, HeaderProvider, TransportChannel, TransportChannelProvider}
import com.google.auth.Credentials
import io.grpc.ManagedChannel
import io.grpc.okhttp.OkHttpChannelBuilder

/**
 * TransportChannelProvider for use on z/OS
 * Uses OkHttpChannelBuilder with CCASSLSocketFactory
 * This enables use of z/OS hardware TLS if present
 * Also works on Linux/Mac
 *
 * The default InstantiatingGrpcChannelProvider.setChannelConfigurator is marked as Beta
 * It uses NettyChannelBuilder and netty tcnative does not work on z/OS
 *
 * @param endpoint host:port provided by Stub settings
 * @param executor Executor to use with managed channel builder
 * @param headerProvider gRPC headers
 * @param credentials gRPC credentials
 * @param poolSize number of connections to maintain
 */
case class OkHttpTransportChannelProvider(endpoint: String = null,
                                          executor: Executor = null,
                                          headerProvider: HeaderProvider = null,
                                          credentials: Credentials = null,
                                          poolSize: Int = -1)
  extends TransportChannelProvider with ChannelFactory {
  override def shouldAutoClose(): Boolean = true
  override def needsEndpoint(): Boolean = endpoint == null
  override def needsCredentials(): Boolean = credentials == null
  override def needsHeaders(): Boolean = headerProvider == null
  override def needsExecutor(): Boolean = executor == null
  override def acceptsPoolSize(): Boolean = poolSize < 1

  override def withEndpoint(endpoint: String): TransportChannelProvider = this.copy(endpoint = endpoint)
  override def withCredentials(credentials: Credentials): TransportChannelProvider =
    this.copy(credentials = credentials)
  override def withHeaders(headers: util.Map[String, String]): TransportChannelProvider =
    this.copy(headerProvider = FixedHeaderProvider.create(headers))
  override def withExecutor(executor: Executor): TransportChannelProvider =
    this.copy(executor = executor)
  override def withExecutor(executor: ScheduledExecutorService): TransportChannelProvider =
    withExecutor(executor.asInstanceOf[Executor])
  override def withPoolSize(size: Int): TransportChannelProvider = this.copy(poolSize = size)

  override def getTransportName: String = GrpcTransportChannel.getGrpcTransportName
  override def getTransportChannel: TransportChannel = {
    if (needsHeaders())
      throw new IllegalStateException("getTransportChannel() called when needsHeaders() is true");
    else if (needsEndpoint())
      throw new IllegalStateException("getTransportChannel() called when needsEndpoint() is true");

    GrpcTransportChannel.create(ChannelUtil.createPool(math.max(1, poolSize), this))
  }

  override def createSingleChannel(): ManagedChannel = {
    val headerInterceptor = new GrpcHeaderInterceptor(headerProvider.getHeaders)

    val colon = endpoint.lastIndexOf(':')
    if (colon < 0) throw new IllegalStateException("invalid endpoint - should have been validated: " + endpoint)
    val port = endpoint.substring(colon + 1).toInt
    val serviceAddress = endpoint.substring(0, colon)

    OkHttpChannelBuilder.forAddress(serviceAddress, port)
      .useTransportSecurity()
      .sslSocketFactory(CCASSLSocketFactory.factory())
      .compressorRegistry(GzipCodec.compressorRegistry)
      .maxInboundMessageSize(Int.MaxValue)
      .userAgent(headerInterceptor.getUserAgentHeader)
      .keepAliveTime(240, TimeUnit.SECONDS)
      .keepAliveWithoutCalls(true)
      .intercept(headerInterceptor, ChannelUtil.metaInterceptor, ChannelUtil.uuidInterceptor)
      .disableServiceConfigLookUp()
      .executor(executor)
      .build()
  }
}
