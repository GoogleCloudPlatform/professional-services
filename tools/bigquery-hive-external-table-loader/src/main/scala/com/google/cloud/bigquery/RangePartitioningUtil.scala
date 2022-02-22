/*
 * Copyright 2019 Google LLC
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

package com.google.cloud.bigquery

import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.services.bigquery.Bigquery
import com.google.api.services.bigquery.model.{Range, RangePartitioning}
import com.google.auth.http.HttpCredentialsAdapter
import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.bqhiveloader.{BQHiveLoader, Logging}

object RangePartitioningUtil extends Logging {

  def bq(cred: GoogleCredentials): Bigquery = {
    new Bigquery.Builder(new NetHttpTransport(), JacksonFactory.getDefaultInstance, new HttpCredentialsAdapter(cred))
      .setRootUrl("https://www.googleapis.com/")
      .setApplicationName(BQHiveLoader.UserAgent)
      .build()
  }

  def addRangePartitioning(rangeField: String,
                           start: Long,
                           end: Long,
                           interval: Long,
                           table: com.google.api.services.bigquery.model.Table): com.google.api.services.bigquery.model.Table = {
    val rp = new RangePartitioning(rangeField)
    rp.setRange(new Range(start, end, interval))
    table.setRangePartitioning(rp)
    table
  }

  def createTable(projectId: String,
                  datasetId: String,
                  tableInfo: TableInfo,
                  bigquery: Bigquery,
                  rangeField: String,
                  start: Long,
                  end: Long,
                  interval: Long): com.google.api.services.bigquery.model.Table = {
    val table = addRangePartitioning(rangeField, start, end, interval, tableInfo.toPb)

    val request = bigquery
      .tables()
      .insert(projectId, datasetId, table)

    val result = request.execute()
    result.setFactory(JacksonFactory.getDefaultInstance)
    logger.info(s"Created table:\n${result.toPrettyString}")
    result
  }
}
