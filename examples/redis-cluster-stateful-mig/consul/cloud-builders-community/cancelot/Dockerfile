FROM gcr.io/cloud-builders/go AS build-env

ADD ./ /go/src/

ENV GOBIN=/go/bin
RUN go get -d -v ./...
RUN go install /go/src/main.go

FROM alpine:latest

RUN apk add --no-cache ca-certificates

COPY --from=build-env /go/bin/main /go/bin/main

ENTRYPOINT [ "/go/bin/main" ]
