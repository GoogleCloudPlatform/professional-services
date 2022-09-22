/*
 * Copyright 2022 Google LLC All Rights Reserved
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
