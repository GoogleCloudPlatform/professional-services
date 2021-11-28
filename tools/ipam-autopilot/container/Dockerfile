FROM golang:1.16-buster as build

WORKDIR /go/src/app
ADD . /go/src/app

RUN go build -tags docker -o /go/bin/app *.go

FROM gcr.io/distroless/base-debian10
COPY ./migrations /migrations
COPY --from=build /go/bin/app /
CMD ["/app"] 