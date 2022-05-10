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

case class ExportConfig(
                         // Custom Options
                         sql: String = "",
                         queryDSN: String = "",
                         outDD: String = "OUTFILE",
                         cobDsn: String = "",
                         timeoutMinutes: Int = 90,
                         vartext: Boolean = false,
                         runMode: String = "parallel",
                         picTCharset: Option[String] = None,

                         bucket: String = "",
                         remoteHost: String = "",
                         remotePort: Int = 52701,
                         trustCertCollectionFilePath: String = "",
                         keepAliveTimeInSeconds: Int = 480,

                         // Standard Options
                         allowLargeResults: Boolean = false,
                         useLegacySql: Boolean = false,
                         destinationTable: String = "",
                         batch: Boolean = false,
                         dryRun: Boolean = false,
                         maximumBytesBilled: Long = -1,
                         requireCache: Boolean = false,
                         requirePartitionFilter: Boolean = true,
                         useCache: Boolean = true,

                         //size of thread pool used by parallel export
                         exporterThreadCount: Int = 4,

                         // Global Options
                         datasetId: String = "",
                         debugMode: Boolean = false,
                         jobId: String = "",
                         jobProperties: Map[String, String] = Map.empty,
                         location: String = "",
                         projectId: String = "",
                         sync: Boolean = true,

                         statsTable: String = ""
                       ) {
  def dsn: Option[DSN] = {
    val i = queryDSN.indexOf('(')
    val j = queryDSN.indexOf(')')
    if (i > 1 && j > i+1){
      Option(MVSPDSMember(queryDSN.substring(0,i),queryDSN.substring(i+1,j)))
    } else if (i > 0 && j > i+1) {
      Option(MVSDataset(queryDSN))
    } else None
  }

  def toMap: Map[String, String] = {
    def getConfigParams(cc: Product): Map[String, String] = {
      val values = cc.productIterator
      cc.getClass.getDeclaredFields.map( _.getName -> {
        values.next match {
          case x: Option[String]  => x.getOrElse("")
          case x => x.toString
        }
      }).toMap
    }
    getConfigParams(this)
  }

  override def toString: String =
    s"""
      |sql=$sql,
      |queryDSN=$queryDSN,
      |outDD=$outDD,
      |cobDsn=$cobDsn,
      |timeoutMinutes=$timeoutMinutes,
      |vartext=$vartext,
      |picTCharset=${picTCharset.getOrElse("")},
      |bucket=$bucket,
      |remoteHost=$remoteHost,
      |remotePort=$remotePort,
      |keepAliveTimeInSeconds=$keepAliveTimeInSeconds,
      |batch=$batch,
      |dryRun=$dryRun,
      |maximumBytesBilled=$maximumBytesBilled,
      |useCache=$useCache,
      |datasetId=$datasetId,
      |location=$location,
      |projectId=$projectId,
      |statsTable=$statsTable,
      |runMode=$runMode,
      |allowLargeResults=$allowLargeResults,
      |useLegacySql=$useLegacySql,
      |destinationTable=$destinationTable
      |""".stripMargin
}

object ExportConfig {
  def apply(configs: Map[String, String]): ExportConfig = {
    ExportConfig(
      runMode = configs.getOrElse("runMode", ""),
      sql = configs.getOrElse("sql", ""),
      queryDSN = configs.getOrElse("queryDSN", ""),
      outDD = configs.getOrElse("outDD", ""),
      cobDsn = configs.getOrElse("cobDsn", ""),
      timeoutMinutes = configs.getOrElse("timeoutMinutes", "").toInt,
      vartext = configs.getOrElse("vartext", "").toBoolean,
      picTCharset = configs.get("picTCharset").collect { case x if x.trim.nonEmpty => x },
      bucket = configs.getOrElse("bucket", ""),
      remoteHost = configs.getOrElse("remoteHost", ""),
      remotePort = configs.getOrElse("remotePort", "").toInt,
      keepAliveTimeInSeconds = configs.getOrElse("keepAliveTimeInSeconds", "").toInt,
      batch = configs.getOrElse("batch", "").toBoolean,
      dryRun = configs.getOrElse("dryRun", "").toBoolean,
      maximumBytesBilled =  configs.getOrElse("maximumBytesBilled", "").toLong,
      useCache = configs.getOrElse("useCache", "").toBoolean,
      datasetId = configs.getOrElse("datasetId", ""),
      location = configs.getOrElse("location", ""),
      projectId = configs.getOrElse("projectId", ""),
      statsTable = configs.getOrElse("statsTable", ""),
      allowLargeResults = configs.getOrElse("allowLargeResults", "").toBoolean,
      useLegacySql = configs.getOrElse("useLegacySql", "").toBoolean,
      destinationTable = configs.getOrElse("destinationTable", "")
    )
  }
}
