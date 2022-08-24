import org.gradle.configuration.Help

/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

plugins {
  java
  id("com.github.johnrengelman.shadow") version "7.1.2"
  id("com.diffplug.spotless") version "6.8.0"
}

group = "com.google.example"
version = "1.0-SNAPSHOT"

repositories {
  mavenCentral()
  maven {
    // Required for Beam to resolve kafka dependency
    url = uri("https://packages.confluent.io/maven/")
  }
}

val appName = "WordCount"
val className = appName
val packageName = group
val templateName = appName
val fullClassName = "$packageName.$className"

val beamVersion: String by project
val slf4jVersion: String by project

dependencies {
  implementation("org.apache.beam:beam-sdks-java-core:$beamVersion")
  implementation("org.apache.beam:beam-runners-direct-java:$beamVersion")
  implementation("org.apache.beam:beam-runners-google-cloud-dataflow-java:$beamVersion")
  implementation("org.apache.beam:beam-sdks-java-io-google-cloud-platform:$beamVersion")
  implementation("org.slf4j:slf4j-simple:$slf4jVersion")
}

spotless {
  java {
    importOrder()
    removeUnusedImports()
    googleJavaFormat()
  }
}

tasks.getByName<Test>("test") {
  useJUnitPlatform()
  testLogging {
    setEvents(mutableListOf("PASSED", "SKIPPED", "FAILED"))
  }
}

tasks.register<JavaExec>("run") {
  group = "application"
  description = "Count words in a document"
  mainClass.set(fullClassName)
  classpath = sourceSets["main"].runtimeClasspath
  if (project.hasProperty("args")) {
    args = listOf(project.property("args") as String)
  }
}

tasks.shadowJar {
  manifest {
    attributes("Main-Class" to fullClassName)
  }
  archiveVersion.set("latest")
  mergeServiceFiles()
}