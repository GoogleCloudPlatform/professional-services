package com.google.cloud.imf.util

import scala.annotation.tailrec
import scala.util.{Random, Try}

object RetryHelper extends Logging {

  private val Multiplier = 10
  private val MaxAllowedDelay = 120000

  def retryableOnError[A](f: => A, logMessage: String = "", attempts: Int = 3, sleep: Int = 500, canRetry: Throwable => Boolean = _ => true): Either[Throwable, A] = {
    var count = 0

    @tailrec
    def call(): Either[Throwable, A] = {
      Try(f).toEither match {
        case Left(e) =>
          count += 1
          if (count <= attempts && canRetry(e)) {
            Try(Thread.sleep(sleep))
            logger.info(s"$logMessage. Failed to execute function, retry $count of $attempts", e)
            call()
          } else Left(e)
        case Right(value) => Right(value)
      }
    }

    call()
  }

  def retryableOnResponse[A](f: => A, logMessage: String = "", attempts: Int = 3, sleep: Int = 2000, canRetry: A => Boolean): A = {
    var count = 1
    var nextDelay = sleep

    @tailrec
    def call(): A = {
      val result = f
      if (canRetry(result) && count <= attempts) {
        Try(Thread.sleep(nextDelay))
        logger.info(s"$logMessage. Not successful function response, will be retried $count time(s).")
        count += 1
        nextDelay = calculateDelay(count, sleep)
        call()
      } else {
        result
      }
    }

    call()
  }

  /**
   * For random delays case delay will be dynamically calculated based on initial delay and randomly selected delay multiplier
   * for each retry attempt. The delay multiplier in a random number which is in range for each retry attempt. See exaple:
   * Attempt	  InitDelay	    Multiplier    Shortest delay(ms)    Longest Delay(ms)
   * 1	            2000	            10	            2000	           2000 (for first retry it always equal to InitDelay
   * 2	            2000	            10	            4000	          40000
   * 3	            2000	            10	            6000	          60000
   * 4	            2000	            10	            8000	          80000
   * 5              2000              10             10000           100000
   * 6              2000              10             12000           120000 (will not go over max value=120sec)
   *
   * For second attempt delays could be: 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000 .... 40000 ms
   *
   */
  def calculateDelay(currentAttempt: Int, initialDelay: Int): Int =
    math.min(Random.between(currentAttempt, currentAttempt * Multiplier) * initialDelay, MaxAllowedDelay)
}