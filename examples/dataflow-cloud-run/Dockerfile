#    Copyright 2019 Google LLC
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

FROM maven:3.6.1-jdk-8 as cloudrunbuilder

# Copy local code to the container image.
WORKDIR /app
COPY cloudrun/pom.xml .
COPY cloudrun/src ./src

# Build a release artifact.
RUN mvn package

FROM maven:3.6.1-jdk-8 as dataflowApp

# Copy local code to the container image.
WORKDIR /app
COPY dataflowApp/pom.xml .
COPY dataflowApp/src ./src

# Build a release artifact.
RUN mvn package


FROM adoptopenjdk/openjdk8:x86_64-alpine-jdk8u232-b09-slim

# Copy the jar to the production image from the builder stage.
COPY --from=cloudrunbuilder /app/target/endpoint*.jar /endpoint.jar
COPY --from=dataflowApp /app/target/bikeshare*.jar /dataflowApp.jar

CMD ["java","-Dserver.port=${PORT}","-jar","/endpoint.jar"]
