package com.google.cloud.imf.util

trait GoogleApiL2Retrier {
  val retriesCount:Int
  val retriesTimeoutMillis:Int

  protected def runWithRetry[A](f: => A, message: String, canRetry: Throwable => Boolean = _ => true): A =
    RetryHelper.retryableOnError(f, message, retriesCount, retriesTimeoutMillis, canRetry) match {
      case Left(ex) => throw ex
      case Right(value) => value
    }

  protected def runWithRetries[A](f: => A, message: String, canRetry: A => Boolean): A =
    RetryHelper.retryableOnResponse(f, message, retriesCount, retriesTimeoutMillis, canRetry)
}
