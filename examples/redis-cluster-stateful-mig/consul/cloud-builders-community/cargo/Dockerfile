FROM rust

RUN apt-get update && \
    apt-get upgrade -y && \
    rustup target add x86_64-unknown-linux-musl

VOLUME /code
WORKDIR /code

ENTRYPOINT ["cargo"]
