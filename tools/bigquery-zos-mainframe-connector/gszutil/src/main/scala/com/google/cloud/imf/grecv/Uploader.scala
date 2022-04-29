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

package com.google.cloud.imf.grecv

import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.gszutil.io.ZRecordReaderT
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest

trait Uploader {
  def upload(req: GRecvRequest,
             host: String,
             port: Int,
             trustCertCollectionFilePath: String,
             nConnections: Int,
             zos: MVS,
             in: ZRecordReaderT,
             timeoutInMinutes: Option[Int],
             keepAliveInSeconds: Option[Int]): Result
}
