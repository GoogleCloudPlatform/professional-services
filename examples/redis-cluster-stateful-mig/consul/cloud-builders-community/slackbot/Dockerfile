FROM gcr.io/cloud-builders/go AS build-env

WORKDIR /app
COPY . .

RUN go get -v
RUN go build main.go

FROM alpine:latest

RUN apk add --no-cache ca-certificates

COPY --from=build-env /app/main /app/main

ENTRYPOINT [ "/app/main" ]
