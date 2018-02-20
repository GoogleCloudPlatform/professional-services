FROM frolvlad/alpine-oraclejdk8:slim
VOLUME /tmp
ADD target/chatlate-chat-1.0.jar app.jar
RUN sh -c 'touch /app.jar'
ENV JAVA_OPTS=""
ENTRYPOINT [ "sh", "-c", "java $JAVA_OPTS -Dserver.port=80 -Djava.security.egd=file:/dev/./urandom -jar /app.jar" ]
