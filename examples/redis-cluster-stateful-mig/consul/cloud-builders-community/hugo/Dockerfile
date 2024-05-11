FROM busybox
ENV HUGO_VERSION=0.89.4
RUN wget -O- https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz | tar zx

FROM gcr.io/distroless/cc
ENTRYPOINT ["/hugo"]
COPY --from=0 /hugo /
