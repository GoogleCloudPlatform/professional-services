/*
 * Copyright 2019 Google LLC All Rights Reserved.
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

import java.nio.channels.ReadableByteChannel

trait ZRecordReaderT extends ReadableByteChannel {

  /** Read a record from the dataset into a buffer.
    *
    * @param buf - the byte array into which the bytes will be read
    * @return the number of bytes read, -1 if EOF encountered.
    */
  def read(buf: Array[Byte]): Int

  /** Read a record from the dataset into a buffer.
    *
    * @param buf the byte array into which the bytes will be read
    * @param off the offset, inclusive in buf to start reading bytes
    * @param len the number of bytes to read
    * @return the number of bytes read, -1 if EOF encountered.
    */
  def read(buf: Array[Byte], off: Int, len: Int): Int

  /** Close the reader and underlying native file.
    * This will also free the associated DD if getAutoFree() is true.
    * Must be issued by the same thread as the factory method.
    */
  def close(): Unit

  def isOpen: Boolean

  /** LRECL is the maximum record length for variable length files.
    *
    * @return
    */
  val lRecl: Int

  /** Maximum block size
    *
    * @return
    */
  val blkSize: Int

  def getDsn: String

  /** Number of records read
    *
    */
  def count(): Long
}
