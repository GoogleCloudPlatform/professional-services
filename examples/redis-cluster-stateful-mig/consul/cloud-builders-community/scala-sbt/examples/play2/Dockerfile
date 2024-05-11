FROM openjdk:8-jdk
ADD target/universal/stage stage
CMD ["stage/bin/play-scala-seed", "-Dplay.http.secret.key=abcdefghijk"]
