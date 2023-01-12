/*
 * Copyright 2022 Google LLC All Rights Reserved.
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
organization := "com.google.cloud.imf"
name := "mainframe-util"
version := "2.2.5"

scalaVersion := "2.13.10"

val exGapiClient = ExclusionRule(organization = "com.google.api-client", name = "google-api-client")
val exGuava = ExclusionRule(organization = "com.google.guava")
val exGrpcCore = ExclusionRule(organization = "io.grpc", name = "grpc-core")

libraryDependencies ++= Seq(
  "com.google.cloud" % "google-cloud-bigquery" % "2.20.0",
  "com.google.cloud" % "google-cloud-bigquerystorage" % "2.27.0",
  "com.google.cloud" % "google-cloud-storage" % "2.16.0",
  "com.google.apis" % "google-api-services-pubsub" % "v1-rev20221020-2.0.0",
  "com.google.apis" % "google-api-services-dataflow" % "v1b3-rev20221025-2.0.0",
  ("com.google.apis" % "google-api-services-logging" % "v2-rev20220922-2.0.0").excludeAll(exGapiClient),
  "org.apache.avro" % "avro" % "1.7.7",

  //TCP TransportChannelProvider for BigQuery Storage API
  ("io.grpc" % "grpc-okhttp" % "1.51.1").excludeAll(exGuava, exGrpcCore),

  //Grecv server
  ("io.grpc" % "grpc-netty" % "1.51.1").excludeAll(exGuava, exGrpcCore),

  //logging
  "org.apache.logging.log4j" % "log4j-api" % "2.19.0",
  "org.apache.logging.log4j" % "log4j-core" % "2.19.0",
  "org.apache.logging.log4j" % "log4j-slf4j-impl" % "2.19.0", //is used by netty and hadoop libs
  "org.apache.logging.log4j" % "log4j-jul" % "2.19.0", //is used by grpc-okhttp lib

  //tests
  "org.scalatest" %% "scalatest" % "3.2.9" % Test,
  "org.powermock" % "powermock-module-junit4" % "2.0.9" % Test,
  "org.powermock" % "powermock-api-mockito2" % "2.0.9" % Test,
  "org.mock-server" % "mockserver-netty" % "5.11.2" % Test,
  "org.mock-server" % "mockserver-client-java" % "5.11.2" % Test
)

// Don't run tests during assembly
assembly / test := Seq()

Test / testOptions := Seq(Tests.Filter(!_.endsWith("ITSpec")))

assembly / assemblyMergeStrategy := {
  case PathList("META-INF", _) => MergeStrategy.discard
  case _ => MergeStrategy.first
}

// Exclude IBM jars from assembly jar since they will be provided
assembly / assemblyExcludedJars := {
  val IBMJars = Set("ibmjzos.jar", "ibmjcecca.jar", "isfjcall.jar", "dataaccess.jar")
  (assembly / fullClasspath).value
    .filter(file => IBMJars.contains(file.data.getName))
}

publishMavenStyle := false

Compile/ resourceGenerators += Def.task {
  val file = (Compile / resourceDirectory).value / "mainframe-util-build.txt"
  val fmt = new java.text.SimpleDateFormat("yyyy/MM/dd HH:mm:ss")
  val timestamp = fmt.format(new java.util.Date)
  IO.write(file, timestamp)
  Seq(file)
}.taskValue

javacOptions ++= Seq("-source", "1.8", "-target", "1.8", "-Xlint")

scalacOptions ++= Seq(
  "-target:jvm-1.8",
  "-opt:l:inline",
  "-opt-inline-from:**",
  "-opt-warnings",
  "-deprecation"
)
