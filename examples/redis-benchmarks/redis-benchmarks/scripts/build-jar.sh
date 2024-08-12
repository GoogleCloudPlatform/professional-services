#!/bin/bash
set -eE

JAR_NAME=redis-benchmarks-1.0.jar

mvn spotless:apply

# Build the jar
mvn clean package

# Copy the jar to artifacts directory
cp -f ./target/${JAR_NAME} ./artifacts/