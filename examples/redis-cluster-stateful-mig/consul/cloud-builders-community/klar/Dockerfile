FROM golang:1.13-alpine as builder

RUN apk --update add git;
RUN go get -d github.com/optiopay/klar
WORKDIR /go/src/github.com/optiopay/klar
RUN go get -d -v ./... && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build  -o klar .
RUN pwd && ls

FROM gcr.io/cloud-builders/gcloud

COPY --from=builder /go/src/github.com/optiopay/klar/klar /usr/local/bin/klar
COPY entrypoint.bash /builder/entrypoint.bash
ENTRYPOINT ["/builder/entrypoint.bash"]