package com.google.cloud.imf.util

import com.google.api.client.json.gson.GsonFactory
import com.google.api.gax.core.FixedCredentialsProvider
import com.google.api.gax.retrying.RetrySettings
import com.google.api.gax.rpc.{FixedHeaderProvider, HeaderProvider}
import com.google.api.services.bigquery.BigqueryScopes
import com.google.api.services.logging.v2.{Logging, LoggingScopes}
import com.google.api.services.pubsub.{Pubsub, PubsubScopes}
import com.google.api.services.storage.StorageScopes
import com.google.auth.Credentials
import com.google.auth.http.HttpCredentialsAdapter
import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.bigquery.storage.v1.{BigQueryReadClient, BigQueryReadSettings}
import com.google.cloud.bigquery.{BigQuery, BigQueryOptions}
import com.google.cloud.http.HttpTransportOptions
import com.google.cloud.storage.{Storage, StorageOptions}
import org.threeten.bp.Duration

object Services {
  /** Route JUL (java.util.logging) to Log4j2 for grpc-okhttp client */
  System.setProperty("java.util.logging.manager", "org.apache.logging.log4j.jul.LogManager")

  val UserAgent = "google-pso-tool/gszutil/5.0"
  val headerProvider: HeaderProvider = FixedHeaderProvider.create("user-agent", UserAgent)

  val l2RetriesCount: Int = sys.env.get("GOOGLE_API_L2_RETRY_COUNT").flatMap(_.toIntOption).getOrElse(3)
  val l2RetriesTimeoutMillis: Int = sys.env.get("GOOGLE_API_L2_RETRY_TIMEOUT_SECONDS").flatMap(_.toIntOption).getOrElse(5) * 1000

  private def retrySettings(httpConfig: HttpConnectionConfigs): RetrySettings = RetrySettings.newBuilder
    .setMaxAttempts(httpConfig.maxRetryAttempts)
    .setTotalTimeout(Duration.ofMinutes(30))
    .setInitialRetryDelay(Duration.ofSeconds(10))
    .setMaxRetryDelay(Duration.ofMinutes(2))
    .setRetryDelayMultiplier(2.0d)
    .setMaxRpcTimeout(Duration.ofMinutes(2))
    .setRpcTimeoutMultiplier(2.0d)
    .build

  private def transportOptions(httpConfig: HttpConnectionConfigs): HttpTransportOptions = HttpTransportOptions.newBuilder
    .setHttpTransportFactory(CCATransportFactory)
    .setConnectTimeout(httpConfig.connectTimeoutInMillis)
    .setReadTimeout(httpConfig.readTimeoutInMillis)
    .build

  def storage(credentials: Credentials): Storage = {
    new StorageWithRetries(new StorageOptions.DefaultStorageFactory()
      .create(StorageOptions.newBuilder
        .setCredentials(credentials)
        .setTransportOptions(transportOptions(HttpConnectionConfigs.storageHttpConnectionConfigs))
        .setRetrySettings(retrySettings(HttpConnectionConfigs.storageHttpConnectionConfigs))
        .setHeaderProvider(headerProvider)
        .build), l2RetriesCount, l2RetriesTimeoutMillis)
  }

  def storageCredentials(): GoogleCredentials =
    GoogleCredentials.getApplicationDefault.createScoped(StorageScopes.DEVSTORAGE_READ_WRITE)

  def storage(): Storage = storage(storageCredentials())

  /** Low-level GCS client */
  def storageApi(credentials: Credentials): com.google.api.services.storage.Storage = {
    new com.google.api.services.storage.Storage.Builder(CCATransportFactory.create,
      GsonFactory.getDefaultInstance, new HttpCredentialsAdapter(credentials))
      .setApplicationName(UserAgent).build()
  }

  def bigqueryCredentials(): GoogleCredentials =
    GoogleCredentials.getApplicationDefault.createScoped(BigqueryScopes.BIGQUERY)

  def bigQuery(project: String, location: String, credentials: Credentials): BigQuery =
    new BigQueryWithRetries(
      bigQueryOptions(project, location, credentials).getService,
      l2RetriesCount, l2RetriesTimeoutMillis)

  /**
   * [DON'T USE IN PRODUCTION]
   * This service could be used in integration tests while mocking bigQuery client.
   *
   * @param project     - bigQuery project
   * @param location    - bigQuery location
   * @param credentials - bigQuery credentials
   * @param host        - where BigQuery is running
   * @return BigQuery service which is running on provided host
   */
  def bigQuerySpec(project: String, location: String, credentials: Credentials, host: String): BigQuery =
    new BigQueryWithRetries(bigQueryOptions(project, location, credentials).toBuilder.setHost(host).build().getService,
      l2RetriesCount, l2RetriesTimeoutMillis)

  private def bigQueryOptions(project: String, location: String, credentials: Credentials) =
    BigQueryOptions.newBuilder
      .setLocation(location)
      .setProjectId(project)
      .setCredentials(credentials)
      .setTransportOptions(transportOptions(HttpConnectionConfigs.bgHttpConnectionConfigs))
      .setRetrySettings(retrySettings(HttpConnectionConfigs.bgHttpConnectionConfigs))
      .setHeaderProvider(headerProvider)
      .build

  def bigQueryApi(credentials: Credentials): com.google.api.services.bigquery.Bigquery = {
    new com.google.api.services.bigquery.Bigquery.Builder(
      CCATransportFactory.create,
      GsonFactory.getDefaultInstance,
      new HttpCredentialsAdapter(credentials))
      .setApplicationName(UserAgent).build()
  }

  def bigQueryStorage(credentials: Credentials): BigQueryReadClient = {
    BigQueryReadClient.create(BigQueryReadSettings
      .newBuilder()
      .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
      .setHeaderProvider(headerProvider)
      .setTransportChannelProvider(OkHttpTransportChannelProvider())
      .build())
  }

  def loggingCredentials(): GoogleCredentials =
    GoogleCredentials.getApplicationDefault.createScoped(LoggingScopes.LOGGING_WRITE)

  def logging(credentials: Credentials): Logging =
    new Logging.Builder(CCATransportFactory.create,
      GsonFactory.getDefaultInstance,
      new HttpCredentialsAdapter(credentials))
      .setApplicationName(UserAgent).build

  def pubsubCredentials(): GoogleCredentials =
    GoogleCredentials.getApplicationDefault.createScoped(PubsubScopes.PUBSUB)

  def pubsub(credentials: Credentials): Pubsub =
    new Pubsub.Builder(CCATransportFactory.create,
      GsonFactory.getDefaultInstance,
      new HttpCredentialsAdapter(credentials))
      .setApplicationName(UserAgent).build
}
