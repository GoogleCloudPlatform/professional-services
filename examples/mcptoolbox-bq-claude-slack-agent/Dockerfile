# Build stage
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY license-header .
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests

# JRE builder stage
FROM eclipse-temurin:21-jdk-alpine AS jre-builder
WORKDIR /app
# Copy the application jar from the build stage
COPY --from=build /app/target/*.jar service.jar
# Create a custom JRE using jlink, including only java.base
# Add other options as needed for size optimization, e.g., --no-header-files, --no-man-pages, --compress=2
RUN jlink --add-modules java.base,java.desktop,java.naming,java.management,jdk.management,jdk.crypto.ec \
    --output /jre --strip-debug --no-header-files --no-man-pages --compress=2

# Metadata-gen stage using the custom JRE
FROM eclipse-temurin:21-jdk-alpine AS metadata-gen
WORKDIR /metadata
# Copy the application jar from the build stage
COPY --from=build /app/target/*.jar service.jar
# Run AppCDS generation using the custom JRE's java
RUN java -XX:ArchiveClassesAtExit=application.jsa -Dspring.context.exit=onRefresh -jar service.jar

# Final stage using a minimal base and the custom JRE
FROM alpine:latest
WORKDIR /app
# Copy the custom JRE from the jre-builder stage
COPY --from=jre-builder /jre /opt/jre
# Copy the application jar and the AppCDS archive
COPY --from=build /app/target/*.jar service.jar
COPY --from=metadata-gen /metadata/application.jsa application.jsa
EXPOSE 8080
ENTRYPOINT ["/opt/jre/bin/java", "-Xshare:auto", "-XX:SharedArchiveFile=/app/application.jsa", "-jar", "/app/service.jar"]
