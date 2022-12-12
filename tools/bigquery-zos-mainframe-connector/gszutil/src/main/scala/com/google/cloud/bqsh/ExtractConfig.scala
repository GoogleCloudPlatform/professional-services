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

case class ExtractConfig(
                         // Custom Options
                         destinationUri: String = "",
                         sourceTable: String = "",
                         sql: String = "",
                         queryDSN: String = "",
                         delimiter: String = "",
                         timeoutMinutes: Int = 90,
                         compress: Boolean = false,
                         replace: Boolean = false,
                         format: String = "",

                         // Standard Options
                         allowLargeResults: Boolean = false,
                         useLegacySql: Boolean = false,
                         destinationTable: String = "",
                         batch: Boolean = false,
                         dryRun: Boolean = false,
                         maximumBytesBilled: Long = -1,
                         requireCache: Boolean = false,
                         useCache: Boolean = true,

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

  override def toString: String =
    s"""
      |destinationUri=$destinationUri
      |sourceTable=$sourceTable
      |sql=$sql,
      |queryDSN=$queryDSN,
      |delimiter=$delimiter,
      |format=$format,
      |timeoutMinutes=$timeoutMinutes,
      |batch=$batch,
      |compress=$compress,
      |sync=$sync,
      |replace=$replace,
      |dryRun=$dryRun,
      |maximumBytesBilled=$maximumBytesBilled,
      |useCache=$useCache,
      |requireCache=$requireCache,
      |datasetId=$datasetId,
      |location=$location,
      |projectId=$projectId,
      |statsTable=$statsTable,
      |allowLargeResults=$allowLargeResults,
      |useLegacySql=$useLegacySql,
      |destinationTable=$destinationTable
      |""".stripMargin
}
