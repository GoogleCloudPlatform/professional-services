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

import java.nio.ByteBuffer
import java.nio.channels.WritableByteChannel

trait ZRecordWriterT extends WritableByteChannel {
  def write(src: Array[Byte]): Unit
  def flush(): Unit
  override def write(src: ByteBuffer): Int
  override def isOpen: Boolean
  override def close(): Unit

  /** Record length */
  val lRecl: Int

  /** Maximum block size */
  val blkSize: Int

  val recfm: String

  /** Number of records read */
  def count(): Long

  /** DSN */
  def getDsn: String
}
