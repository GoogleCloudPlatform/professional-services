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

object BQHiveLoader extends Logging {
  val UserAgent = "google-pso-tool/bq-hive-external-table-loader/1.0"
  def init(): Unit = {
    Util.configureLogging()
    Util.quietSparkLogs()
  }

  def main(args: Array[String]): Unit = {
    ConfigParser.parse(args) match {
      case Some(config) =>
        init()
        for {
          keytab <- config.krbKeyTab
          principal <- config.krbPrincipal
        } yield {
          Kerberos.configureJaas(keytab, principal)
        }

        SparkJobs.run(config)

      case _ =>
        System.err.println("Invalid args")
        System.exit(1)
    }
  }
}
