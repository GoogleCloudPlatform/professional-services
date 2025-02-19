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


import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.{DataFrame, Row}

object SpannerUtils {
  def createSparkSession(appName: String): SparkSession = {
    SparkSession
      .builder()
      .appName(appName)
      .config("spark.master", "local") // You can adjust this based on your cluster setup
      .config("spark.executor.memory", "8g")
      .config("spark.driver.memory", "4g")
      .config("spark.executor.instances", "13")
      .config("spark.executor.cores", "2")
      .getOrCreate()
  }

  def readDataFrameFromBigQuery(spark: SparkSession, prj: String, bqDataset: String, bqTable: String): DataFrame = {
    val old_df = spark.read.format("bigquery").load(s"$prj.$bqDataset.$bqTable")
    old_df.createOrReplaceTempView("old_df")
    spark.sql("SELECT * FROM old_df")
  }
  
}
