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

import org.apache.log4j.{Level, LogManager, PatternLayout, ConsoleAppender}

object Util {
  val DefaultLayout = new PatternLayout("%d{ISO8601} [%t] %-5p %c %x - %m%n")

  def setDebug(logName: String): Unit = setLvl(logName, Level.DEBUG)

  def setWarn(logName: String): Unit = setLvl(logName, Level.WARN)

  def setOff(logName: String): Unit = setLvl(logName, Level.OFF)

  def setLvl(logName: String, level: Level): Unit =
    LogManager.getLogger(logName).setLevel(level)

  def configureLogging(): Unit = {
    val rootLogger = LogManager.getRootLogger
    rootLogger.addAppender(new ConsoleAppender(DefaultLayout))
    rootLogger.setLevel(Level.INFO)
  }

  def quietSparkLogs(): Unit = {
    Util.setDebug("com.google.cloud.example")
    Seq(
      "org.apache.orc.impl.MemoryManagerImpl",
      "org.apache.spark.ContextCleaner",
      "org.apache.spark.network.netty",
      "org.apache.spark.executor.Executor",
      "org.apache.spark.scheduler",
      "org.apache.spark.SparkEnv",
      "org.apache.spark.sql.catalyst.expressions.codegen",
      "org.apache.spark.sql.execution",
      "org.apache.spark.sql.internal.SharedState",
      "org.apache.spark.SecurityManager",
      "org.apache.spark.storage.BlockManager",
      "org.apache.spark.storage.BlockManagerInfo",
      "org.apache.spark.storage.BlockManagerMaster",
      "org.apache.spark.storage.BlockManagerMasterEndpoint",
      "org.apache.spark.storage.DiskBlockManager",
      "org.apache.spark.storage.memory.MemoryStore",
      "org.apache.spark.ui",
      "org.apache.spark.util"
    ).foreach(Util.setWarn)
    Util.setOff("org.apache.hadoop.util.NativeCodeLoader")
  }
}
