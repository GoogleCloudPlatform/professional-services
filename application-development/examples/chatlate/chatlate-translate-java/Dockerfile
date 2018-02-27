FROM frolvlad/alpine-oraclejdk8:slim
VOLUME /tmp
ADD target/chatlate-translate-1.0.jar app.jar
RUN sh -c 'touch /app.jar'
ENV JAVA_OPTS=""
ENV SA_CREDENTIALS="/etc/keys/key.json"
ENTRYPOINT [ "sh", "-c", "java $JAVA_OPTS -Dserver.port=80 -Djava.security.egd=file:/dev/./urandom -jar /app.jar" ]
