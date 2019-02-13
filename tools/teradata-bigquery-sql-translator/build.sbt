name := "sql"

scalaVersion := "2.11.8"

libraryDependencies ++= Seq(
  "org.scala-lang.modules" %% "scala-parser-combinators" % "1.0.4",
  "javax.servlet" % "javax.servlet-api" % "4.0.1",
  "org.eclipse.jetty" % "jetty-server" % "9.4.14.v20181114",
  "org.eclipse.jetty" % "jetty-servlet" % "9.4.14.v20181114",
  "com.google.code.gson" % "gson" % "2.8.5",
  "com.google.guava" % "guava" % "27.0.1-jre",
  "org.scalatest" %% "scalatest" % "3.0.5" % Test
)

mainClass in assembly := Some("com.google.cloud.pso.sql.RewriteDir")
