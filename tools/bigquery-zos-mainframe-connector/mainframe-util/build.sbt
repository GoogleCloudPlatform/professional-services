/*
 * Copyright 2020 Google LLC All Rights Reserved.
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
version := "2.2.0"

scalaVersion := "2.13.1"

val exGapiClient = ExclusionRule(organization = "com.google.api-client", name = "google-api-client")
val exGuava = ExclusionRule(organization = "com.google.guava")
val exGrpcCore = ExclusionRule(organization = "io.grpc", name = "grpc-core")

libraryDependencies ++= Seq(
  "com.google.cloud" % "google-cloud-bigquery" % "2.5.1",
  "com.google.cloud" % "google-cloud-bigquerystorage" % "2.7.0",
  "com.google.cloud" % "google-cloud-storage" % "2.2.2",
  ("com.google.apis" % "google-api-services-logging" % "v2-rev656-1.25.0").excludeAll(exGapiClient),
  "org.apache.avro" % "avro" % "1.7.7",

  //TCP TransportChannelProvider for BigQuery Storage API
  ("io.grpc" % "grpc-okhttp" % "1.42.1").excludeAll(exGuava, exGrpcCore),

  //Grecv server
  ("io.grpc" % "grpc-netty" % "1.42.1").excludeAll(exGuava, exGrpcCore),

  //logging
  "org.apache.logging.log4j" % "log4j-api" % "2.17.1",
  "org.apache.logging.log4j" % "log4j-core" % "2.17.1",
  "org.apache.logging.log4j" % "log4j-slf4j-impl" % "2.17.1", //is used by netty and hadoop libs
  "org.apache.logging.log4j" % "log4j-jul" % "2.17.1", //is used by grpc-okhttp lib

  //tests
  "org.scalatest" %% "scalatest" % "3.2.9" % Test,
  "org.powermock" % "powermock-module-junit4" % "2.0.9" % Test,
  "org.powermock" % "powermock-api-mockito2" % "2.0.9" % Test,
  "org.mock-server" % "mockserver-netty" % "5.11.2" % Test,
  "org.mock-server" % "mockserver-client-java" % "5.11.2" % Test
)

// Don't run tests during assembly
test in assembly := Seq()

Test / testOptions := Seq(Tests.Filter(!_.endsWith("ITSpec")))

assemblyMergeStrategy in assembly := {
  case PathList("META-INF", _) => MergeStrategy.discard
  case _ => MergeStrategy.first
}

// Exclude IBM jars from assembly jar since they will be provided
assemblyExcludedJars in assembly := {
  val IBMJars = Set("ibmjzos.jar", "ibmjcecca.jar")
  (fullClasspath in assembly).value
    .filter(file => IBMJars.contains(file.data.getName))
}

publishMavenStyle := false

resourceGenerators in Compile += Def.task {
  val file = (resourceDirectory in Compile).value / "mainframe-util-build.txt"
  val fmt = new java.text.SimpleDateFormat("yyyy/MM/dd HH:mm:ss")
  val timestamp = fmt.format(new java.util.Date)
  IO.write(file, timestamp)
  Seq(file)
}.taskValue
scalacOptions ++= Seq(
  "-opt:l:inline",
  "-opt-inline-from:**",
  "-opt-warnings",
  "-deprecation"
)
