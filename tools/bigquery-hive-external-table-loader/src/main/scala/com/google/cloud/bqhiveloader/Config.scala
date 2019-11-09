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

package com.google.cloud.bqhiveloader

case class Config(partitioned: Boolean = true,
                  dryRun: Boolean = false,
                  partFilters: String = "",
                  partitionColumn: Option[String] = None,
                  partitionRangeStart: Long = -1,
                  partitionRangeEnd: Long = -1,
                  partitionRangeInterval: Long = -1,
                  partitionType: String = "DAY",
                  clusterColumns: Seq[String] = Seq.empty,
                  dropColumns: Set[String] = Set.empty,
                  keepColumns: Set[String] = Set.empty,
                  renameColumns: Seq[(String,String)] = Seq.empty,
                  partColFormats: Seq[(String,String)] = Seq.empty,
                  unusedColumnName: String = "unused",
                  hiveDbName: String = "",
                  hiveTableName: String = "",
                  hiveMetastoreType: String = "jdbc",
                  hiveJdbcUrl: String = "",
                  hiveStorageFormat: Option[String] = None,
                  bqProject: String = "",
                  bqDataset: String = "",
                  bqTable: String = "",
                  bqLocation: String = "US",
                  refreshPartition: Option[String] = None,
                  tempDataset: String = "",
                  useTempTable: Boolean = false,
                  useTempViews: Boolean = false,
                  bqOverwrite: Boolean = false,
                  bqBatch: Boolean = true,
                  bqKeyFile: Option[String] = None,
                  bqCreateTableKeyFile: Option[String] = None,
                  bqWriteKeyFile: Option[String] = None,
                  gcsKeyFile: Option[String] = None,
                  krbKeyTab: Option[String] = None,
                  krbPrincipal: Option[String] = None
                 )
