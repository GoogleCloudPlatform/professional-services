/**
  * Copyright 2019 Google LLC
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  * https://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */

import sbt._
import Keys._

val scioVersion = "0.8.0"
val beamVersion = "2.17.0"
val kafkaClientsVersion = "2.3.1"
val scalaMacrosVersion = "2.1.1"
val pureconfigVersion = "0.12.1"
val avro4sVersion = "3.0.4"
val slf4jVersion = "1.7.29"

lazy val commonSettings = Defaults.coreDefaultSettings ++ Seq(
  organization := "com.google.cloud.pso",
  // Semantic versioning http://semver.org/
  version := "0.2.0-SNAPSHOT",
  scalaVersion := "2.12.10",
  scalacOptions ++= Seq("-target:jvm-1.8",
                        "-deprecation",
                        "-feature",
                        "-unchecked"),
  javacOptions ++= Seq("-source", "1.8", "-target", "1.8")
)

lazy val paradiseDependency =
  "org.scalamacros" % "paradise" % scalaMacrosVersion cross CrossVersion.full
lazy val macroSettings = Seq(
  libraryDependencies += "org.scala-lang" % "scala-reflect" % scalaVersion.value,
  addCompilerPlugin(paradiseDependency)
)

lazy val root: Project = project
  .in(file("."))
  .settings(commonSettings)
  .settings(macroSettings)
  .settings(
    name := "kafka2avro",
    description := "kafka2avro",
    publish / skip := true,
    libraryDependencies ++= Seq(
      "com.spotify" %% "scio-core" % scioVersion,
      "com.spotify" %% "scio-test" % scioVersion % Test,
      "org.apache.beam" % "beam-runners-direct-java" % beamVersion,
      "org.apache.beam" % "beam-runners-google-cloud-dataflow-java" % beamVersion,
      "org.apache.beam" % "beam-sdks-java-io-kafka" % beamVersion,
      "org.apache.kafka" % "kafka-clients" % kafkaClientsVersion,
      // Configuration library
      "com.github.pureconfig" %% "pureconfig" % pureconfigVersion,
      // Avro schema automation
      "com.sksamuel.avro4s" %% "avro4s-core" % avro4sVersion,
      "org.slf4j" % "slf4j-simple" % slf4jVersion
    )
  )
  .enablePlugins(PackPlugin)

lazy val repl: Project = project
  .in(file(".repl"))
  .settings(commonSettings)
  .settings(macroSettings)
  .settings(
    name := "repl",
    description := "Scio REPL for kafka2avro",
    libraryDependencies ++= Seq(
      "com.spotify" %% "scio-repl" % scioVersion
    ),
    Compile / mainClass := Some("com.spotify.scio.repl.ScioShell"),
    publish / skip := true
  )
  .dependsOn(root)
