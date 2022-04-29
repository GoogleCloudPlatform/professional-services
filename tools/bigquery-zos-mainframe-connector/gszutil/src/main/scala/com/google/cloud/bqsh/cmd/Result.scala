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

package com.google.cloud.bqsh.cmd

object Result {
  def withExport(name: String, value: String, exitCode: Int = 0): Result = {
    Result(Map(name -> value), exitCode)
  }

  def withExportLong(name: String, value: Long, exitCode: Int = 0): Result = {
    Result(Map(name -> value.toString), exitCode)
  }

  def Success: Result = Result()
  def Failure(msg: String, exitCode: Int = 1): Result = Result(exitCode = exitCode, message = msg)
}

// https://docs.teradata.com/reader/1fdhoBglKXYl~W_OyMEtGQ/92K64CKQxrkuO4Hm7P8IEA
case class Result(env: Map[String,String] = Map.empty,
                  exitCode: Int = 0,
                  activityCount: Long = 0,
                  message: String = "",
                  errorCount: Long = 0) {
  def errorCode: Int = exitCode
}
