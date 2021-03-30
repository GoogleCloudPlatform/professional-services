/*
 * Copyright 2019 Google LLC All Rights Reserved.
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

  def Success = Result()
  def Failure(msg: String, exitCode: Int = 1): Result =
    withExport("ERRMSG", msg, 1)
}
case class Result(env: Map[String,String] = Map.empty, exitCode: Int = 0)
