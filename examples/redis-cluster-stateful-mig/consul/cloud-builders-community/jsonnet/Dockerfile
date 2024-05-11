FROM ubuntu:xenial

RUN \
    apt update -y && \
    apt -y install build-essential git && \
    git clone https://github.com/google/jsonnet.git && \
    cd jsonnet && \
    make && \
    ./jsonnet --help

ENTRYPOINT ["/jsonnet/jsonnet"]
