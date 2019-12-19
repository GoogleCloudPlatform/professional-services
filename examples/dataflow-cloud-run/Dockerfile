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
COPY --from=cloudrunbuilder /app/target/endpoint-app-0.0.1-SNAPSHOT.jar /endpoint.jar
COPY --from=dataflowApp /app/target/dataflow-app-1.0-SNAPSHOT.jar /dataflowApp.jar

CMD ["java","-Dserver.port=${PORT}","-jar","/endpoint.jar"]
