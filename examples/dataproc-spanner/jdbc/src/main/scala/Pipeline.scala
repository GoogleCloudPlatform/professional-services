//      Copyright 2025 Google LLC
//
//      Licensed under the Apache License, Version 2.0 (the "License");
//      you may not use this file except in compliance with the License.
//      You may obtain a copy of the License at
//
//          http://www.apache.org/licenses/LICENSE-2.0
//
//      Unless required by applicable law or agreed to in writing, software
//      distributed under the License is distributed on an "AS IS" BASIS,
//      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//      See the License for the specific language governing permissions and
//      limitations under the License.

package com.google.cloud.pso

import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.jdbc.JdbcDialects

class Pipeline(
    var bqProject: String,
    var bqDataset: String,
    var bqTable: String,
    var bqPk: String,
    var spanProject: String,
    var inst: String,
    var numSpannerNodes: String,
    var db: String,
    var tbl: String,
    var batchSize: String
) {

  def exe_pipeline(): Unit = {
    // ---------CREATE SPARK SESSION---------------------------------------------
    val spark = SparkSession
      .builder()
      .appName("bigquery-spanner-template")
      .getOrCreate()

    // ---------READ SOURCE DATA FROM BIGQUERY-----------------------------------
    val inputDF = spark.read
      .format("bigquery")
      .load(s"$bqProject.$bqDataset.$bqTable")

    // ---------REPARTITION BY PRIMARY KEY-----------------------------------
    // How many partitions ?
    // Let N  be the number of nodes in our spanner instance
    // There should be 10*N partitions in our dataset
    // How to partition?
    // Partitioning should be done on the primary key
    // So that rows are written sequentially by primary key. E.g. not in random order.
    // This is all per Spanner best pratices
    // https://cloud.google.com/spanner/docs/bulk-loading#partition-by-key)
    val numPartitions = 10 * numSpannerNodes.toInt
    val inputDFRepartitioned =
      inputDF.repartition(numPartitions, inputDF(s"$bqPk"))

    // ---------TELL SPARK TO USE OUR CUSTOM SQL DIALECT FOR SPANNER-------------
    JdbcDialects.registerDialect(SpannerJdbcDialect)

    // ---------WRITE DATA FROM BIGQUERY TO SPANNER------------------------------
    val url =
      s"jdbc:cloudspanner:/projects/$spanProject/instances/$inst/databases/$db"
    val driver = "com.google.cloud.spanner.jdbc.JdbcDriver"
    val fmt = "jdbc"
    inputDFRepartitioned.write
      .format(fmt)
      .option("url", url)
      .option("driver", driver)
      .option("dbtable", tbl)
      // We do not need transaction isolation are we are doing a large batch of writes
      // As per transaction documentation
      // https://cloud.google.com/spanner/docs/transactions#introduction
      .option("isolationLevel", "NONE")
      // Each write to Spanner should contain hundreds of rows at a maximum.
      // How many hundreds ?
      // As Many as can fit into 1MB as per best practices
      // https://cloud.google.com/spanner/docs/bulk-loading#commit-size
      .option("batchsize", batchSize.toInt)
      .mode("append")
      .save()
  }
}
