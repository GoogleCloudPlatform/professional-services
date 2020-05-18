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
organization := "com.google.cloud"
name := "dataproc-init-auth"
version := "0.1.0-SNAPSHOT"

scalaVersion := "2.11.12"


val exGuava = ExclusionRule(organization = "com.google.guava")

libraryDependencies ++= Seq("com.google.guava" % "guava" % "28.2-jre")

/*
val bqDependencies = Seq(
  "com.google.api-client" % "google-api-client" % "1.30.2", // provided for google-cloud-bigquery
  "com.google.auto.value" % "auto-value-annotations" % "1.7", // provided for google-cloud-bigquery
  "com.google.cloud" % "google-cloud-bigquery" % "1.106.0"
)
*/

libraryDependencies ++= Seq(
  //"com.github.scopt" %% "scopt" % "3.7.1",
  "com.google.apis" % "google-api-services-dataproc" % "v1-rev147-1.25.0",
  "com.google.http-client" % "google-http-client-apache-v2" % "1.34.1",
  "com.google.oauth-client" % "google-oauth-client" % "1.30.5",
  "com.google.cloud" % "google-cloud-compute" % "0.117.0-alpha",
  //"com.google.cloud" % "google-cloud-storage" % "1.103.1",
  //"com.google.protobuf" % "protobuf-java" % "3.11.3",
  //"com.google.protobuf" % "protobuf-java-util" % "3.11.3",
  "com.typesafe.akka" %% "akka-actor" % "2.5.29",
  "com.typesafe.akka" %% "akka-http" % "10.1.11",
  "com.typesafe.akka" %% "akka-stream" % "2.5.29",
  "org.apache.httpcomponents" % "httpclient" % "4.5.11",
  "org.scalatest" %% "scalatest" % "3.0.5" % Test
).map(_ excludeAll exGuava)

mainClass in assembly := Some("com.google.cloud.dataproc.auth.AuthService")

assemblyJarName in assembly := "dpa-assembly.jar"
assemblyJarName in assemblyPackageDependency := "dpa-dep.jar"

// Don't run tests during assembly
test in assembly := Seq()

assemblyMergeStrategy in assembly := {
  case PathList("META-INF", _) => MergeStrategy.discard
  case "application.conf"      => MergeStrategy.concat
  case "reference.conf"        => MergeStrategy.concat
  case _                       => MergeStrategy.first
}

publishMavenStyle := false

resourceGenerators in Compile += Def.task {
  val file = (resourceDirectory in Compile).value / "build.txt"
  IO.write(file, new java.text.SimpleDateFormat("yyyy/MM/dd HH:mm:ss").format(new java.util.Date))
  Seq(file)
}.taskValue

scalacOptions ++= Seq("-optimize")
