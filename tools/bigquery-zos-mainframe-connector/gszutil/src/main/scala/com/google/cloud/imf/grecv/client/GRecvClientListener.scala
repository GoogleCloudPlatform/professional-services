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

package com.google.cloud.imf.grecv.client

import java.net.URI
import java.nio.ByteBuffer
import com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest
import com.google.cloud.imf.util.Logging
import com.google.cloud.storage.Storage
import io.grpc.ManagedChannelBuilder
import io.grpc.okhttp.OkHttpChannelBuilder


/** Sends bytes to server, maintaining a hash of all bytes sent */
class GRecvClientListener(gcs: Storage,
                          cb: ManagedChannelBuilder[_],
                          request: GRecvRequest,
                          baseUri: URI,
                          bufSz: Int,
                          partLimit: Long) extends Logging {
  val buf: ByteBuffer = ByteBuffer.allocate(bufSz)

  def newObj(): TmpObj = {
    TmpObj(
      baseUri.getAuthority,
      baseUri.getPath.stripPrefix("/").stripSuffix("/") + "/tmp/",
      gcs, cb, request, partLimit, compress = true)
  }
  private var obj: TmpObj = _

  def getWriter(): TmpObj = {
    if (obj == null || obj.isClosed) obj = newObj()
    obj
  }

  def flush(): Unit = {
    buf.flip()
    getWriter().write(buf)
  }

  def close(): Unit = {
    if (obj != null) {
      obj.close()
      obj = null
    }
  }
}

