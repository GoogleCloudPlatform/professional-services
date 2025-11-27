# Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS source
WORKDIR /app
COPY license-header .
COPY pom.xml .
COPY src ./src

FROM source as builder
ARG PROFILE
RUN mvn package -DskipTests -P$PROFILE

# JRE builder stage
FROM eclipse-temurin:21-jdk AS metadata-gen
ARG GCP_PROJECT
WORKDIR /app
# Copy the application jar from the build stage
COPY --from=builder /app/target/*.jar service.jar
# Run AppCDS generation using the custom JRE's java
RUN java -XX:ArchiveClassesAtExit=application.jsa -Dspring.context.exit=onRefresh -jar service.jar

# Final stage using a minimal base and the custom JRE
FROM eclipse-temurin:21-jre as app-image
WORKDIR /app
# Copy the application jar and the AppCDS archive
COPY --from=metadata-gen /app/service.jar service.jar
COPY --from=metadata-gen /app/application.jsa application.jsa
EXPOSE 8080
ENTRYPOINT ["java", "-XX:SharedArchiveFile=/app/application.jsa", "-jar", "/app/service.jar"]
