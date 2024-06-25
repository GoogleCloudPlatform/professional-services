FROM gcr.io/cloud-builders/java/mvn:3.5.0-jdk-8

# Install Boot

COPY boot.sh /usr/bin/boot
RUN chmod +x /usr/bin/boot

# Boot ENV

ENV BOOT_HOME /.boot
ENV BOOT_AS_ROOT yes
ENV BOOT_LOCAL_REPO /m2
ENV BOOT_JVM_OPTIONS=-Xmx2g
ENV BOOT_VERSION 2.7.2
ENV BOOT_CLOJURE_VERSION 1.8.0

# download & install deps, cache REPL deps
RUN /usr/bin/boot repl -e '(System/exit 0)'

ENTRYPOINT ["/usr/bin/boot"]
