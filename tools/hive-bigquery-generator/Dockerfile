# run "cloudrun/run.sh" to use this dokerfile via gcloud builds submit
FROM openjdk:8-jdk-alpine
ARG _JAR_FILE
ARG _PROPERTIES_YML
COPY src/main/resources/${_PROPERTIES_YML} application.yml
COPY build/libs/${_JAR_FILE} hive-bq-external-view-generator.jar
ENTRYPOINT ["java","-jar","hive-bq-external-view-generator.jar"]
