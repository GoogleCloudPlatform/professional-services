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

package com.google.cloud.bqsh

import com.google.cloud.imf.gzos.MVSStorage.{DSN, MVSDataset, MVSPDSMember}

case class CurlConfig(basicAuth: Boolean = false,
                      caCert: String = "",
                      caPath: String = "",
                      certFilePath: String = "",
                      certFilePass: String = "",
                      compressed: Boolean = false,
                      config: String = "",
                      connectTimeout: Int = 0,
                      cookie: String = "",
                      data: String = "",
                      fail: Boolean = false,
                      requestMethod: String = "",
                      contentType: String = "",
                      header: Seq[String] = Seq.empty,
                      netRc: Boolean = false,
                      netRcFile: String = "",
                      oauth2BearerToken: String = "",
                      range: Seq[(Int,Int)] = Seq.empty,
                      referer: String = "",
                      retry: Int = -1,
                      silent: Boolean = false,
                      uploadFile: String = "",
                      uri: String = "",
                      user: String = "",
                      userAgent: String = "",
                      verbose: Boolean = false) {
  def uploadDSN: Option[DSN] = {
    val i = uploadFile.indexOf('(')
    val j = uploadFile.indexOf(')')
    if (i > 1 && j > i+1){
      Option(MVSPDSMember(uploadFile.substring(0,i),uploadFile.substring(i+1,j)))
    } else if (i > 0 && j > i+1) {
      Option(MVSDataset(uploadFile))
    } else None
  }

  override def toString: String = new com.google.gson.GsonBuilder().setPrettyPrinting().create().toJson(this)
}
