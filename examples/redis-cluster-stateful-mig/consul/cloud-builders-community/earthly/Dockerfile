FROM ubuntu:bionic

ARG VERSION=0.5.23
ARG PLATFORM=linux
ARG ARCH=amd64

RUN apt-get -y update && \
    apt-get -y install ca-certificates wget docker.io && \
    rm -rf /var/lib/apt/lists/* && \
    wget -qO /usr/local/bin/earthly https://github.com/earthly/earthly/releases/download/v$VERSION/earthly-$PLATFORM-$ARCH && \
    chmod +x /usr/local/bin/earthly

ENTRYPOINT ["earthly"]
