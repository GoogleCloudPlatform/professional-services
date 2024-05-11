FROM golang:1.15 as builder

WORKDIR /go/src/hello-world

COPY app/go.* ./
RUN go mod download

COPY app/*.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -mod=readonly -v

FROM alpine

RUN apk add --no-cache tini

ENTRYPOINT ["/sbin/tini", "-v", "-e", "143", "--"]

COPY --from=builder /go/src/hello-world/hello-world /srv/hello-world

ARG GREETING
ARG PORT

ENV GREETING=${GREETING}
ENV PORT=${PORT}

USER nobody

CMD ["/srv/hello-world"]
