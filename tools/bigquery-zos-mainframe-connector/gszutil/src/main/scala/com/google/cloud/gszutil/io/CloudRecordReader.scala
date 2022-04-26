/*
 * Copyright 2020 Google LLC All Rights Reserved.
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

import com.google.cloud.storage.Blob

/**
  *
  * @param dsn original DSNAME
  * @param lRecl record length
  * @param bucket GCS bucket name
  * @param name GCS object name
  * @param gdg generational flag
  * @param versions object generations found in Cloud Storage
  * @param pds partitioned flag
  */
case class CloudRecordReader(dsn: String,
                             override val lRecl: Int,
                             bucket: String = "",
                             name: String = "",
                             gdg: Boolean = false,
                             versions: IndexedSeq[Blob] = IndexedSeq.empty,
                             pds: Boolean = false) extends ZRecordReaderT {
  override def read(dst: ByteBuffer): Int = -1
  override def read(buf: Array[Byte]): Int = -1
  override def read(buf: Array[Byte], off: Int, len: Int): Int = -1
  override def close(): Unit = {}
  override def isOpen: Boolean = false
  override def getDsn: String = dsn
  override def count(): Long = 0
  val uri: String = s"gs://$bucket/$name"
  val gdgUri = (objectName: String) => s"gs://$bucket/$objectName"
  override val blkSize: Int = lRecl
}
