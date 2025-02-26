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

object Main {
  def main(args: Array[String]): Unit = {

    // ---------PARSE COMMAND LINE ARGUMENTS-------------------------------------
    val numArgs = 10
    if (args.length != numArgs) {
      throw new IllegalArgumentException(
        s"Exactly $numArgs arguments are required"
      )
    }

    // source :: BigQuery Dataset & Table
    val bqProject = args(0)
    val bqDataset = args(1)
    val bqTable = args(2)
    val bqPk = args(3)
    // sink :: Spanner instance, database & table
    val spanProject = args(4)
    val inst = args(5)
    val numSpannerNodes = args(6)
    val db = args(7)
    val tbl = args(8)
    val batchSize = args(9)

    // ---------Launch pipeline-------------------------------------
    val pipeline =
      new Pipeline(
        bqProject,
        bqDataset,
        bqTable,
        bqPk,
        spanProject,
        inst,
        numSpannerNodes,
        db,
        tbl,
        batchSize
      )

    pipeline.exe_pipeline()
  }
}
