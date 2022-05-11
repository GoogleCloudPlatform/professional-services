package com.google.cloud.imf.util

case class HttpConnectionConfigs(
    connectTimeoutInMillis: Int,
    readTimeoutInMillis: Int,
    maxRetryAttempts: Int
) {
  override def toString: String = s"HttpConfigs: connectTimeoutInMillis=$connectTimeoutInMillis, " +
    s"readTimeoutInMillis=$readTimeoutInMillis, maxRetryAttempts=$maxRetryAttempts"
}

object HttpConnectionConfigs extends Logging {
  private val bqConfigs = Tuple3.apply(
    "BQ_CONNECT_TIMEOUT_MILLIS" -> "30000",
    "BQ_READ_TIMEOUT_MILLIS" -> "30000",
    "BQ_MAX_ATTEMPTS_COUNT" -> "5"
  )
  private val storageConfigs = Tuple3.apply(
    "STORAGE_CONNECT_TIMEOUT_MILLIS" -> "20000",
    "STORAGE_READ_TIMEOUT_MILLIS" -> "20000",
    "STORAGE_MAX_ATTEMPTS_COUNT" -> "3"
  )
  val bgHttpConnectionConfigs = readEnv(bqConfigs)
  val storageHttpConnectionConfigs = readEnv(storageConfigs)
  logger.info(s"HttpConnectionConfigs for BigQuery=[$bgHttpConnectionConfigs], Storage=[$storageHttpConnectionConfigs]")

  private def readEnv(configs: ((String, String), (String, String), (String, String))): HttpConnectionConfigs = {
    val env = sys.env
    HttpConnectionConfigs(
      connectTimeoutInMillis = env.getOrElse(configs._1._1, configs._1._2).toInt,
      readTimeoutInMillis = env.getOrElse(configs._2._1, configs._2._2).toInt,
      maxRetryAttempts = env.getOrElse(configs._3._1, configs._3._2).toInt
    )
  }
}


