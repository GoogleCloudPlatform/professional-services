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
package com.google.cloud.bqsh

import com.google.cloud.gszutil.SchemaProvider
import com.google.cloud.gszutil.io.ZRecordReaderT
import com.google.cloud.imf.gzos.Util
import com.google.cloud.imf.gzos.gen.DataGenUtil
import com.google.cloud.imf.util.StaticMap

object GsUtilConfig {
  /** Minimal constructor */
  def createLocal(sourceDD: String,
                  sp: SchemaProvider,
                  destinationUri: String,
                  projectId: String,
                  datasetId: String,
                  location: String,
                  genData: Boolean): GsUtilConfig = {
    GsUtilConfig(source = sourceDD,
                 schemaProvider = Option(sp),
                 gcsUri = destinationUri,
                 projectId = projectId,
                 datasetId = datasetId,
                 location = location,
                 replace = true,
                 testInput =
                   if (genData) Option(DataGenUtil.generatorFor(sp))
                   else None)
  }

  def createRemote2(sourceDD: String,
                    sp: SchemaProvider,
                    destinationUri: String,
                    projectId: String,
                    datasetId: String,
                    location: String,
                    remoteHostname: String,
                    remotePort: Int,
                    genData: Boolean,
                    gcsDSNPrefix: String): GsUtilConfig = {
    GsUtilConfig(source = sourceDD,
      schemaProvider = Option(sp),
      gcsUri = destinationUri,
      projectId = projectId,
      datasetId = datasetId,
      location = location,
      remoteHost = remoteHostname,
      remotePort = remotePort,
      remote = true,
      replace = true,
      testInput = if (genData) Option(DataGenUtil.generatorFor(sp)) else None,
      gcsDSNPrefix = gcsDSNPrefix
    )
  }
}

case class GsUtilConfig(source: String = "INFILE",
                        copyBook: String = "COPYBOOK",
                        keyFile: String = "KEYFILE",
                        gcsUri: String = "",
                        destPath: String = "",
                        destDSN: String = "",
                        mode: String = "",
                        replace: Boolean = false,
                        recursive: Boolean = false,
                        maxErrorPct: Double = 0,
                        blocksPerBatch: Int = 128,
                        parallelism: Int = 4,
                        timeOutMinutes: Option[Int] = None,
                        keepAliveTimeInSeconds: Option[Int] = None,

                        // Global
                        projectId: String = "",
                        datasetId: String = "",
                        location: String = "US",

                        // Custom
                        schemaProvider: Option[SchemaProvider] = None,
                        picTCharset: Option[String] = None,
                        statsTable: String = "",
                        remote: Boolean = false,
                        remoteHost: String = "",
                        remotePort: Int = 51770,
                        trustCertCollectionFilePath: String = "",
                        nConnections: Int = 4,
                        testInput: Option[ZRecordReaderT] = None,
                        gcsDSNPrefix: String = "",
                        tfDSN:String ="",
                        tfGCS:String = ""
) {
  def toMap: java.util.Map[String,Any] = {
    val m = StaticMap.builder
    m.put("type","GsUtilConfig")
    m.put("gcsUri", Util.quote(gcsUri))
    m.put("replace",replace)
    m.put("maxErrorPct",maxErrorPct.toString)
    m.put("picTCharset", picTCharset)
    schemaProvider.map(_.toString).foreach(m.put("schemaProvider",_))
    if (statsTable.nonEmpty)
      m.put("statsTable",Util.quote(statsTable))
    m.put("remote",remote)
    if (remote && remoteHost.nonEmpty) {
      m.put("remoteHost", Util.quote(remoteHost))
      m.put("remotePort", Util.quote(remotePort.toString))
      m.put("nConnections",Util.quote(nConnections.toString))
    }
    m.build()
  }
}
