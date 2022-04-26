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

package org.apache.hadoop.fs

import java.net.URI
import java.nio.channels.Channels

import com.google.cloud.storage.{BlobInfo, Storage}
import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.fs.permission.FsPermission
import org.apache.hadoop.util.Progressable

object SimpleGCSFileSystem {
  val Scheme = "gs"
  val FsImpl = "fs.gs.impl"
  val ClassName = "com.google.cloud.hadoop.fs.gs.SimpleGCSFileSystem"

  def configure(c: Configuration = new Configuration()): Configuration = {
    c.set(FsImpl, ClassName)
    c
  }
}

/** FileSystem implementation with user-provided Statistics instance
  *
  * @param gcs Cloud Storage client
  * @param stats FileSystem.Statistics used to count bytes written
  */
class SimpleGCSFileSystem(private val gcs: Storage,
                          private var stats: FileSystem.Statistics)
  extends FileSystem {
  import SimpleGCSFileSystem.Scheme

  def resetStats(): Unit = stats.reset()

  def getBytesWritten(): Long = stats.getBytesWritten

  override def getUri: URI = new URI(s"$Scheme://")

  override def getScheme: String = Scheme

  override def open(f: Path, bufferSize: Int): FSDataInputStream =
    throw new UnsupportedOperationException()

  override def create(f: Path, permission: FsPermission, overwrite: Boolean,
                      bufferSize: Int, replication: Short, blockSize: Long,
                      progress: Progressable): FSDataOutputStream = {
    val uri = f.toUri
    val bucket = uri.getAuthority
    val name = uri.getPath.stripPrefix("/")
    val os = Channels.newOutputStream(gcs.writer(BlobInfo.newBuilder(bucket,name).build()))
    new FSDataOutputStream(os, stats, 0)
  }

  override def append(f: Path, bufferSize: Int, progress: Progressable): FSDataOutputStream =
    throw new UnsupportedOperationException()

  override def rename(src: Path, dst: Path): Boolean =
    throw new UnsupportedOperationException()

  override def delete(f: Path, recursive: Boolean): Boolean =
    throw new UnsupportedOperationException()

  override def listStatus(f: Path): Array[FileStatus] = Array.empty

  override def setWorkingDirectory(new_dir: Path): Unit = {}

  override def getWorkingDirectory: Path = new Path("gs://bucket/")

  override def mkdirs(f: Path, permission: FsPermission): Boolean =
    throw new UnsupportedOperationException()

  override def getFileStatus(f: Path): FileStatus =
    throw new UnsupportedOperationException()
}
