FROM golang:1.17 AS build

RUN go get -v github.com/revl/docker-reuse

FROM gcr.io/cloud-builders/docker

COPY --from=build /go/bin/docker-reuse /usr/local/bin/

ENV DOCKER_CLI_EXPERIMENTAL=enabled

ENTRYPOINT ["/usr/local/bin/docker-reuse"]
