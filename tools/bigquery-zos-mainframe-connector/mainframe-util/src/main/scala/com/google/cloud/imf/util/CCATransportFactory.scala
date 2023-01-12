package com.google.cloud.imf.util

import java.util.concurrent.TimeUnit

import com.google.api.client.http.HttpTransport
import com.google.api.client.http.apache.v2.ApacheHttpTransport
import com.google.auth.http.HttpTransportFactory
import com.google.common.collect.ImmutableList
import org.apache.http.client.HttpClient
import org.apache.http.config.SocketConfig
import org.apache.http.impl.client.{HttpClientBuilder, StandardHttpRequestRetryHandler}
import org.apache.http.message.BasicHeader

/** Creates HttpTransport with Apache HTTP */
object CCATransportFactory extends HttpTransportFactory with Logging {
  //Http client is shared between BqClient, BqStorage, GCStorage clients.
  //There are workloads, like Parallel Export, that use thread pools to parallelize read/write data.
  //For such workloads one http connection per thread at thread pool is required.
  //Formula for pool size:
  //maxConnectionTotal = JOB_THREAD_POOL_SIZE * JOBS_IN_PARALLEL_COUNT
  //JOB_THREAD_POOL_SIZE - by default it is a vCPU count
  //JOBS_IN_PARALLEL_COUNT - by default it is 1, need load tests to detect proper number.
  private val maxConnectionTotal = sys.env.get("HTTP_CLIENT_MAX_CONNECTIONS_COUNT").flatMap(_.toIntOption)
    .getOrElse(math.max(32, Runtime.getRuntime.availableProcessors()))

  override def create: HttpTransport = new ApacheHttpTransport(newDefaultHttpClient())


  /** Creates an instance of Apache HttpClient with default configuration
   * TCP send and receive buffer size are set to 2M
   * tcpnodelay and sokeepalive are enabled
   * redirect handling is disabled
   *
   * @param optionalCaCertsPath
   * @return
   */
  def newDefaultHttpClient(optionalCaCertsPath: Option[String] = None): HttpClient = {
    val socketConfig = SocketConfig.custom()
      .setRcvBufSize(2 * 1024 * 1024)
      .setSndBufSize(2 * 1024 * 1024)
      .setTcpNoDelay(true)
      .setSoKeepAlive(true)
      .build()

    val httpClient = HttpClientBuilder.create()
      .useSystemProperties()
      .setSSLSocketFactory(CCASSLSocketFactory.create(optionalCaCertsPath))
      .setDefaultSocketConfig(socketConfig)
      .setMaxConnTotal(maxConnectionTotal)
      .setMaxConnPerRoute(maxConnectionTotal)
      .setConnectionTimeToLive(-1, TimeUnit.MILLISECONDS)
      .disableRedirectHandling()
      .setRetryHandler(new StandardHttpRequestRetryHandler)
      .setDefaultHeaders(ImmutableList.of(new BasicHeader("user-agent", Services.UserAgent)))
      .build()

    logger.info(s"Created Apache HttpClient with maximum of $maxConnectionTotal connections")
    httpClient
  }
}
