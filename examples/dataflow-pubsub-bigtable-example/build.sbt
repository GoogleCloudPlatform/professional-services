/*
 * Copyright 2019 Google LLC All rights reserved.
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

name := "cloud"

version := "0.1.0"

scalaVersion := "2.11.12"

// Beam SDK for Java 2.9.0
// https://beam.apache.org/documentation/sdks/java-dependencies/
// https://cloud.google.com/dataflow/docs/concepts/sdk-worker-dependencies
lazy val beamProvidedDependencies = Seq(
  "org.apache.activemq" % "activemq-amqp" % "5.13.1",
  "org.apache.activemq" % "activemq-broker" % "5.13.1",
  "org.apache.activemq" % "activemq-client" % "5.13.1",
  "org.apache.activemq" % "activemq-jaas" % "5.13.1",
  "org.apache.activemq.tooling" % "activemq-junit" % "5.13.1",
  "org.apache.activemq" % "activemq-kahadb-store" % "5.13.1",
  "org.apache.activemq" % "activemq-mqtt" % "5.13.1",
  "org.apache.apex" % "apex-common" % "3.7.0",
  "org.apache.apex" % "apex-engine" % "3.7.0",
  "args4j" % "args4j" % "2.33",
  "org.apache.avro" % "avro" % "1.8.2",
  "com.google.cloud.bigdataoss" % "gcsio" % "1.9.0",
  "com.google.cloud.bigdataoss" % "util" % "1.9.0",
  "com.google.cloud.bigtable" % "bigtable-client-core" % "1.4.0",
  "net.bytebuddy" % "byte-buddy" % "1.9.3",
  "org.apache.commons" % "commons-compress" % "1.16.1",
  "org.apache.commons" % "commons-csv" % "1.4",
  //"commons-io" % "commons-io" % "1.3.2",
  "commons-io" % "commons-io" % "2.5",
  "org.apache.commons" % "commons-lang3" % "3.6",
  "org.apache.commons" % "commons-math3" % "3.6.1",
  "com.google.cloud.datastore" % "datastore-v1-proto-client" % "1.6.0",
  "com.google.errorprone" % "error_prone_annotations" % "2.0.15",
  "com.google.api" % "gax-grpc" % "1.29.0",
  "com.google.api-client" % "google-api-client" % "1.27.0",
  "com.google.api-client" % "google-api-client-jackson2" % "1.27.0",
  "com.google.api-client" % "google-api-client-java6" % "1.27.0",
  "com.google.apis" % "google-api-services-bigquery" % "v2-rev20181104-1.27.0",
  "com.google.apis" % "google-api-services-clouddebugger" % "v2-rev20180801-1.27.0",
  "com.google.apis" % "google-api-services-cloudresourcemanager" % "v1-rev20181015-1.27.0",
  "com.google.apis" % "google-api-services-dataflow" % "v1b3-rev20181107-1.27.0",
  "com.google.apis" % "google-api-services-pubsub" % "v1-rev20181105-1.27.0",
  "com.google.apis" % "google-api-services-storage" % "v1-rev20181013-1.27.0",
  "com.google.auth" % "google-auth-library-credentials" % "0.10.0",
  "com.google.auth" % "google-auth-library-oauth2-http" % "0.10.0",
  "com.google.cloud" % "google-cloud-bigquery" % "1.27.0",
  "com.google.cloud" % "google-cloud-core" % "1.36.0",
  "com.google.cloud" % "google-cloud-core-grpc" % "1.36.0",
  "com.google.cloud.dataflow" % "google-cloud-dataflow-java-proto-library-all" % "0.5.160304",
  "com.google.cloud" % "google-cloud-spanner" % "0.54.0-beta",
  "com.google.http-client" % "google-http-client" % "1.27.0",
  "com.google.http-client" % "google-http-client-jackson" % "1.27.0",
  "com.google.http-client" % "google-http-client-jackson2" % "1.27.0",
  "com.google.http-client" % "google-http-client-protobuf" % "1.27.0",
  "com.google.oauth-client" % "google-oauth-client" % "1.27.0",
  "com.google.oauth-client" % "google-oauth-client-java6" % "1.27.0",
  "io.grpc" % "grpc-all" % "1.13.1",
  "io.grpc" % "grpc-auth" % "1.13.1",
  "io.grpc" % "grpc-core" % "1.13.1",
  "com.google.api.grpc" % "grpc-google-cloud-pubsub-v1" % "1.18.0",
  "io.grpc" % "grpc-netty" % "1.13.1",
  "io.grpc" % "grpc-protobuf-lite" % "1.13.1",
  "io.grpc" % "grpc-protobuf" % "1.13.1",
  "io.grpc" % "grpc-stub" % "1.13.1",
  "com.google.guava" % "guava" % "20.0",
  "com.google.guava" % "guava-testlib" % "20.0",
  "org.apache.hadoop" % "hadoop-client" % "2.7.3",
  "org.apache.hadoop" % "hadoop-common" % "2.7.3",
  "org.apache.hadoop" % "hadoop-hdfs" % "2.7.3",
  "org.apache.hadoop" % "hadoop-mapreduce-client-core" % "2.7.3",
  "org.apache.hadoop" % "hadoop-minicluster" % "2.7.3",
  "org.hamcrest" % "hamcrest-core" % "1.3",
  "org.hamcrest" % "hamcrest-library" % "1.3",
  "com.fasterxml.jackson.core" % "jackson-annotations" % "2.9.5",
  "com.fasterxml.jackson.core" % "jackson-core" % "2.9.5",
  "com.fasterxml.jackson.core" % "jackson-databind" % "2.9.5",
  "com.fasterxml.jackson.dataformat" % "jackson-dataformat-cbor" % "2.9.5",
  "com.fasterxml.jackson.dataformat" % "jackson-dataformat-yaml" % "2.9.5",
  "com.fasterxml.jackson.datatype" % "jackson-datatype-joda" % "2.9.5",
  "com.fasterxml.jackson.module" % "jackson-module-scala_2.11" % "2.9.5",
  "javax.xml.bind" % "jaxb-api" % "2.2.12",
  "joda-time" % "joda-time" % "2.4",
  "junit" % "junit" % "4.12",
  "org.apache.kafka" % "kafka_2.11" % "1.0.0",
  "org.apache.kafka" % "kafka-clients" % "1.0.0",
  "org.apache.apex" % "malhar-library" % "3.4.0",
  "org.mockito" % "mockito-core" % "1.10.19",
  "io.netty" % "netty-handler" % "4.1.25.Final",
  "io.netty" % "netty-tcnative-boringssl-static" % "2.0.8.Final",
  "io.netty" % "netty-transport-native-epoll" % "4.1.25.Final",
  "org.postgresql" % "postgresql" % "42.2.2",
  "org.powermock" % "powermock-mockito-release-full" % "1.6.4",
  "com.google.protobuf" % "protobuf-java" % "3.6.0",
  "com.google.protobuf" % "protobuf-java-util" % "3.6.0",
  "com.google.api.grpc" % "proto-google-cloud-pubsub-v1" % "1.18.0",
  "com.google.api.grpc" % "proto-google-cloud-spanner-admin-database-v1" % "0.19.0",
  "com.google.api.grpc" % "proto-google-common-protos" % "1.12.0",
  "org.slf4j" % "slf4j-api" % "1.7.25",
  "org.slf4j" % "slf4j-jdk14" % "1.7.25",
  "org.slf4j" % "slf4j-log4j12" % "1.7.25",
  "org.slf4j" % "slf4j-simple" % "1.7.25",
  "org.xerial.snappy" % "snappy-java" % "1.1.4",
  "org.apache.spark" % "spark-core_2.11" % "2.3.2",
  "org.apache.spark" % "spark-network-common_2.11" % "2.3.2",
  "org.apache.spark" % "spark-streaming_2.11" % "2.3.2",
  "org.codehaus.woodstox" % "stax2-api" % "3.1.4",
  "org.codehaus.woodstox" % "woodstox-core-asl" % "4.4.1",
  "com.pholser" % "junit-quickcheck-core" % "0.8"
)

val servletDependencies = Seq(
  "javax.servlet" % "javax.servlet-api" % "4.0.1",
  "org.eclipse.jetty" % "jetty-server" % "9.4.14.v20181114",
  "org.eclipse.jetty" % "jetty-servlet" % "9.4.14.v20181114",
  "com.fasterxml.jackson.core" % "jackson-databind" % "2.9.8",
  "com.fasterxml.jackson.module" %% "jackson-module-scala" % "2.9.8"
)

val exGuava = ExclusionRule(organization = "com.google.guava")
val exAuth = ExclusionRule(organization = "com.google.auth")

libraryDependencies ++= Seq(
  "com.google.guava" % "guava" % "20.0",
  "com.google.auth" % "google-auth-library-oauth2-http" % "0.15.0" excludeAll exGuava
)

libraryDependencies ++= Seq(
  "io.grpc" % "grpc-all" % "1.19.0",
  "org.apache.beam" % "beam-sdks-java-extensions-google-cloud-platform-core" % "2.11.0",
  "org.apache.beam" % "beam-sdks-java-io-google-cloud-platform" % "2.11.0",
  "org.apache.beam" % "beam-runners-google-cloud-dataflow-java" % "2.11.0",
  "com.github.scopt" %% "scopt" % "3.7.1",
  "com.google.cloud" % "google-cloud-monitoring" % "1.69.0",
  "com.google.api.grpc" % "grpc-google-cloud-monitoring-v3" % "1.51.0",
  "com.google.cloud" % "google-cloud-pubsub" % "1.66.0",
  "org.slf4j" % "slf4j-simple" % "1.6.2"
).map(_ excludeAll(exGuava, exAuth))

libraryDependencies ++= beamProvidedDependencies.map(_ % Provided)

libraryDependencies ++= servletDependencies

libraryDependencies += "org.scalatest" %% "scalatest" % "3.0.4" % "test"

mainClass in assembly := Some("com.google.cloud.example.CloudPipeline")

assemblyJarName in assembly := "CloudPipeline.jar"

assemblyMergeStrategy in assembly := {
  case PathList("META-INF", _) => MergeStrategy.discard
  case _ => MergeStrategy.first
}

assemblyShadeRules in assembly := Seq(
  ShadeRule.rename("com.google.common.**" -> "sguava.@1").inAll
)
