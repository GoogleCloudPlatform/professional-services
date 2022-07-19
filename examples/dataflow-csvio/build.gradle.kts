/*
 * Copyright 2022 Google.
 * This software is provided as-is, without warranty or representation for any use or purpose.
 * Your use of it is subject to your agreement with Google.
 */

plugins {
    id("java")
    id("com.github.johnrengelman.shadow") version "7.1.2"
}

group = "com.google.example"
description = "Read and parse CSV files"
version = "1.0-SNAPSHOT"

java.sourceCompatibility = JavaVersion.VERSION_11
java.targetCompatibility = JavaVersion.VERSION_11

val appName = "ExampleRead"
val className = appName
val packageName = group
val templateName = appName
val fullClassName = "$packageName.$className"

val autoValueVersion: String by project
val beamVersion: String by project
val csvCommonsVersion: String by project
val gsonVersion: String by project
val jupiterVersion: String by project
val slf4jVersion: String by project

repositories {
    mavenCentral()
    maven {
        url = uri("https://packages.confluent.io/maven/")
    }
}

dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter-api:$jupiterVersion")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine")

    implementation("org.apache.beam:beam-sdks-java-core:$beamVersion")
    implementation("org.apache.beam:beam-sdks-java-io-contextualtextio:$beamVersion")
    implementation("org.apache.beam:beam-runners-direct-java:$beamVersion")
    implementation("org.apache.beam:beam-runners-google-cloud-dataflow-java:$beamVersion")
    implementation("org.apache.beam:beam-sdks-java-io-google-cloud-platform:$beamVersion")
    implementation("org.apache.beam:beam-sdks-java-extensions-sql:$beamVersion")

    implementation("org.apache.commons:commons-csv:$csvCommonsVersion")
    implementation("com.google.code.gson:gson:$gsonVersion")
    implementation("org.slf4j:slf4j-simple:$slf4jVersion")

    compileOnly("com.google.auto.value:auto-value-annotations:$autoValueVersion")
    annotationProcessor("com.google.auto.value:auto-value:$autoValueVersion")
}

tasks.getByName<Test>("test") {
    useJUnitPlatform()
    testLogging {
        setEvents(mutableListOf("PASSED", "SKIPPED", "FAILED"))
    }
}

tasks.register<JavaExec>("run") {
    group = "application"
    description = description
    mainClass.set(fullClassName)
    classpath = sourceSets["main"].runtimeClasspath
    if (project.hasProperty("args")) {
        args = (project.property("args") as String).split(" ")
    }
}

tasks.shadowJar {
    manifest {
        attributes("Main-Class" to fullClassName)
    }
    archiveVersion.set("latest")
    mergeServiceFiles()
    isZip64 = true
}