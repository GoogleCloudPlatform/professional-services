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

object SparkPipelineExample {

  def executePipeline(prj: String, bqDataset: String, bqTable: String, inst: String, db: String, tbl: String): Unit = {
    val spark = SpannerUtils.createSparkSession("spark-spanner-demo")
    val df = SpannerUtils.readDataFrameFromBigQuery(spark, prj, bqDataset, bqTable)

    val spannerMutations = new SpannerMutations(prj, inst, db, tbl)
    spannerMutations.write(df)

    spark.stop()
  }
}
