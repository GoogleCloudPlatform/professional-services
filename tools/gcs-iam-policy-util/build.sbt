name := "gcs-iam-policy-util"

scalaVersion := "2.11.12"

organization := "com.google.cloud"

version := "0.1.0-SNAPSHOT"

val exclusions = Seq(
  ExclusionRule(organization = "com.google.guava"),
  ExclusionRule(organization = "androidx.annotation"))

libraryDependencies += "com.google.guava" % "guava" % "28.2-jre"

libraryDependencies ++= Seq(
  "com.google.apis" % "google-api-services-cloudresourcemanager" % "v1-rev566-1.25.0",
  "com.google.apis" % "google-api-services-storage" % "v1-rev169-1.25.0",
  "com.google.api-client" % "google-api-client" % "1.30.8", // provided for google-api-services
  "com.google.auth" % "google-auth-library-credentials" % "0.20.0",
  "com.google.auth" % "google-auth-library-oauth2-http" % "0.20.0",
  "com.google.http-client" % "google-http-client" % "1.34.2",
  "com.google.http-client" % "google-http-client-apache-v2" % "1.34.2",
  "com.google.http-client" % "google-http-client-jackson2" % "1.34.2",  // provided for google-api-services
  "com.google.protobuf" % "protobuf-java" % "3.11.3",
  "com.google.protobuf" % "protobuf-java-util" % "3.11.3",
  "com.github.scopt" %% "scopt" % "3.7.1",
  "org.apache.httpcomponents" % "httpclient" % "4.5.11",
  "org.scalatest" %% "scalatest" % "3.0.5" % Test
).map(_.excludeAll(exclusions:_*))

mainClass in assembly := Some("com.google.cloud.storage.iam.PolicyUtil")

assemblyJarName in assembly := "gcs-iam-policy-util.jar"

// Don't run tests during assembly
test in assembly := Seq()

assemblyMergeStrategy in assembly := {
  case PathList("META-INF", _) => MergeStrategy.discard
  case "application.conf"      => MergeStrategy.concat
  case _                       => MergeStrategy.first
}
