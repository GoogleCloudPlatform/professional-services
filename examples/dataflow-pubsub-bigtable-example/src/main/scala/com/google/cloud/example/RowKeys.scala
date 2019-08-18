/*
 * Copyright 2019 Google LLC All rights reserved.
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

package com.google.cloud.example

import com.google.cloud.example.protobuf.HostInfo
import com.google.protobuf.ByteString

object RowKeys {
  def byHost(host: String, dc: String, region: String, t: Long): ByteString = {
    ByteString.copyFromUtf8(s"$host#$dc#$region#$t")
  }

  def byHostInfo(hostInfo: HostInfo, t: Long): ByteString = {
    byHost(hostInfo.getHost, hostInfo.getDc, hostInfo.getCloudRegion, t)
  }
}
