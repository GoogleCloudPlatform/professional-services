package com.google.cloud.gszutil.io

import com.google.cloud.imf.gzos.Util
import org.apache.logging.log4j.Logger

class WriteTimer {
  private var elapsedTime: Long = 0
  private var startTime: Long = System.currentTimeMillis()
  private var endTime: Long = -1
  private var t0: Long = -1

  def reset(): Unit = {
    startTime = System.currentTimeMillis()
    endTime = -1
    elapsedTime = 0
  }

  def start(): Unit = t0 = System.currentTimeMillis()

  def end(): Unit = {
    val t1 = System.currentTimeMillis
    elapsedTime += (t1 - t0)
  }

  case class Snapshot(duration: Long, active: Long,
                      rate: Double, compressionRatio: Double) {
    override def toString: String ={
      val formattedCompressionRatio = f"$compressionRatio%1.2f"
      s"""rate: $rate mbps
         |duration: $duration ms
         |active: $active ms
         |idle: ${duration - active} ms
         |ratio: $formattedCompressionRatio
         |""".stripMargin
    }
  }

  def snapshot(t: Long, bytesIn: Long, bytesOut: Long): Snapshot = {
    val dt = t - startTime
    val compressionRatio = (bytesOut * 1.0d) / bytesIn
    val mbps = Util.mbps(bytesOut, elapsedTime)
    Snapshot(dt, elapsedTime, mbps, compressionRatio)
  }

  def close(logger: Logger, msg: String, bytesIn: Long, bytesOut: Long): Unit = {
    endTime = System.currentTimeMillis
    logger.info(
      s"""$msg
         |recv: $bytesIn bytes
         |send: $bytesOut bytes
         |${snapshot(endTime, bytesIn, bytesOut)}
         |""".stripMargin)
  }
}
