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
name := "gszutil"

scalaVersion := "2.11.8"

organization := "com.google.cloud"

version := "1.0.0"

val exGuava = ExclusionRule(organization = "com.google.guava")

libraryDependencies ++= Seq("com.google.guava" % "guava" % "28.0-jre")

libraryDependencies ++= Seq(
  "com.github.scopt" %% "scopt" % "3.7.1",
  "com.google.api-client" % "google-api-client" % "1.30.2",
  "com.google.http-client" % "google-http-client-apache-v2" % "1.30.2",
  "com.google.cloud" % "google-cloud-bigquery" % "1.82.0",
  "com.google.cloud" % "google-cloud-storage" % "1.82.0",
  "com.google.protobuf" % "protobuf-java" % "3.7.1",
  "com.google.protobuf" % "protobuf-java-util" % "3.7.1",
  "com.typesafe.akka" %% "akka-actor" % "2.5.22",
  "org.apache.hive" % "hive-storage-api" % "2.6.0",
  "org.apache.httpcomponents" % "httpclient" % "4.5.9",
  "org.apache.orc" % "orc-core" % "1.5.5",
  "org.scalatest" %% "scalatest" % "3.0.5" % Test
).map(_ excludeAll exGuava)

mainClass in assembly := Some("com.google.cloud.gszutil.GSZUtil")

assemblyJarName in assembly := "gszutil.jar"
assemblyJarName in assemblyPackageDependency := "gszutil.dep.jar"

// Don't run tests during assembly
test in assembly := Seq()

assemblyMergeStrategy in assembly := {
  case PathList("META-INF", _) => MergeStrategy.discard
  case _ => MergeStrategy.first
}

// Exclude IBM jars from assembly jar since they will be provided
assemblyExcludedJars in assembly := {
  val IBMJars = Set("ibmjzos.jar", "ibmjcecca.jar", "dataaccess.jar")
  (fullClasspath in assembly).value
    .filter(file => IBMJars.contains(file.data.getName))
}

publishMavenStyle := false

resourceGenerators in Compile += Def.task {
  val file = (resourceDirectory in Compile).value / "build.txt"
  IO.write(file, new java.text.SimpleDateFormat("yyyy/MM/dd HH:mm:ss").format(new java.util.Date))
  Seq(file)
}.taskValue
