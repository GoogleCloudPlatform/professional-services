//do not use "bare style" for build.sbt
//instead use "multi project" for our build.sbt
lazy val root = (project in file(".")).settings(
  inThisBuild(
    List(
      organization := "com.google.cloud.pso",
      // version of scala compatible with latest dataproc images
      scalaVersion := "2.12.18"
    )
  ),
  name := "spark-bigquery-spanner"
)

// we need to use spark & spanner jdbc in this project
val sparkVersion = "3.5.0"
val sparkJDBC = "2.17.1"

libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-core" % sparkVersion,
  "org.apache.spark" %% "spark-sql" % sparkVersion,
  "com.google.cloud" % "google-cloud-spanner-jdbc" % sparkJDBC
)
