FROM golang:1.16-buster as build

WORKDIR /go/src/app
ADD . /go/src/app

RUN go build -tags docker -o /go/bin/app main.go

FROM gcr.io/distroless/base-debian10
ADD ./migrations /migrations
COPY --from=build /go/bin/app /
CMD ["/app"] 