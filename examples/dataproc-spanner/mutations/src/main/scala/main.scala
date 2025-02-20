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


object main {
  def main(args: Array[String]): Unit = {
    // ---------PARSE COMMAND LINE ARGUMENTS-------------------------------------
        val numArgs = 6
        if (args.length != numArgs) {
          throw new IllegalArgumentException(
            s"Exactly $numArgs arguments are required"
          )
        }
        val prj = args(0)
        // source :: BigQuery Dataset & Table
        val bqDataset = args(1)
        val bqTable = args(2)
        // sink :: Spanner instance, database & table
        val inst = args(3)
        val db = args(4)
        val tbl = args(5)


    // ---------Launch pipeline-------------------------------------
    SparkPipelineExample.executePipeline(prj, bqDataset, bqTable, inst, db, tbl)
  }
}
