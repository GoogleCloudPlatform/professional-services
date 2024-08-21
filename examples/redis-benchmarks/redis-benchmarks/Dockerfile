# Use the official Java 11 base image
FROM adoptopenjdk/openjdk11:alpine-slim

# Create a directory for the application JAR
WORKDIR /app

# Copy the JAR file to the working directory
COPY artifacts/${JAR_NAME} .

ENTRYPOINT ["java", "-jar", "redis-benchmarks-1.0.jar"]