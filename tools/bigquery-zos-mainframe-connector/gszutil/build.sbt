
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
organization := "com.google.cloud.imf"
name := "mainframe-connector"
version := "5.7.9"

scalaVersion := "2.13.10"

val exGuava = ExclusionRule(organization = "com.google.guava")
val exJetty = ExclusionRule(organization = "org.mortbay.jetty")
val exZk = ExclusionRule(organization = "org.apache.zookeeper")
val exGrpc = ExclusionRule(organization = "io.grpc")
val exAvro = ExclusionRule(organization = "org.apache.avro")
val exProtobufJava = ExclusionRule(organization = "com.google.protobuf", name = "protobuf-java")
val log4j1 = ExclusionRule(organization = "log4j", name = "log4j")

libraryDependencies ++= Seq(
  "com.google.cloud.imf" %% "mainframe-util" % "2.2.5",
  // enable users to compile without IBM JZOS jars
  // comment this line out and place IBM jars in lib directory to test against IBM classes
  "com.google.cloud.imf" %% "jzos-shim" % "0.2" % Provided,
  "com.github.scopt" %% "scopt" % "3.7.1",
  "org.scalatest" %% "scalatest" % "3.2.9" % Test,
  "org.powermock" % "powermock-module-junit4" % "2.0.9" % Test,
  "org.powermock" % "powermock-api-mockito2" % "2.0.9" % Test
)

val exJsonSmart = ExclusionRule(organization = "net.minidev", name = "json-smart")
// orc and related dependencies
libraryDependencies ++= Seq(
  "org.apache.hadoop" % "hadoop-common" % "2.9.2",
  "org.apache.hadoop" % "hadoop-hdfs-client" % "2.9.2",
  "org.apache.hive" % "hive-storage-api" % "2.7.1",
  "org.apache.orc" % "orc-core" % "1.6.2",
  "net.minidev" % "json-smart" % "2.3"
).map(_ excludeAll(exGuava, exJetty, exZk, exGrpc, exAvro, exProtobufJava, exJsonSmart, log4j1))

// Don't run tests during assembly
assembly / test := Seq()

assembly / assemblyMergeStrategy := {
  case PathList("META-INF", "services", file) if file.startsWith("io.grpc") => MergeStrategy.concat
  case PathList("META-INF", _) => MergeStrategy.discard
  case _ => MergeStrategy.first
}

// Exclude IBM jars from assembly jar since they will be provided
assembly / assemblyExcludedJars := {
  val IBMJars = Set("ibmjzos.jar", "ibmjcecca.jar", "isfjcall.jar", "dataaccess.jar")
  (assembly / fullClasspath).value
    .filter(file => IBMJars.contains(file.data.getName))
}

publishMavenStyle := true

Compile / resourceGenerators += Def.task {
  val file = (Compile / resourceDirectory).value / "build.txt"
  IO.write(file, new java.text.SimpleDateFormat("yyyy/MM/dd HH:mm:ss").format(new java.util.Date))
  Seq(file)
}.taskValue

Test / testOptions := Seq(Tests.Filter(!_.endsWith("ITSpec")))

javacOptions ++= Seq("-source", "1.8", "-target", "1.8", "-Xlint")

scalacOptions ++= Seq(
  "-target:jvm-1.8",
  "-deprecation",
  "-opt-warnings",
  "-feature"
)
