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

name := "bigquery-hive-external-table-loader"

version := "1.0.0"

scalaVersion := "2.11.11"

val sparkVersion = "2.3.0"

val exGuava = ExclusionRule("com.google.guava")

libraryDependencies ++= Seq(
  "com.google.guava" % "guava" % "28.1-jre",
  "com.google.cloud" % "google-cloud-bigquery" % "1.91.0",
  "com.google.cloud" % "google-cloud-storage" % "1.91.0",
  "log4j" % "log4j" % "1.2.17"
)

libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-core" % sparkVersion % Provided,
  "org.apache.spark" %% "spark-sql" % sparkVersion % Provided,
  "org.apache.spark" %% "spark-hive" % sparkVersion % Provided,
  "com.github.scopt" %% "scopt" % "3.7.1"
).map(_ excludeAll exGuava)

libraryDependencies += "org.scalatest" %% "scalatest" % "3.0.4" % "test"

mainClass in assembly := Some("com.google.cloud.bqhiveloader.BQHiveLoader")

assemblyMergeStrategy in assembly := {
  case PathList("META-INF", _) => MergeStrategy.discard
  case _ => MergeStrategy.first
}

assemblyJarName in assembly := "bqhiveloader.jar"

assemblyShadeRules in assembly := Seq(
  ShadeRule.rename("com.google.common.**" -> "s.guava.@1").inAll,
  ShadeRule.rename("com.google.protobuf.*" -> "s.proto.@1").inAll
)

assemblyOption in assembly ~= { _.copy(includeScala = false) }
