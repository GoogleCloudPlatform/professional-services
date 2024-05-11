FROM busybox
ENV ZOLA_VERSION=0.8.0
RUN wget -O- https://github.com/getzola/zola/releases/download/v${ZOLA_VERSION}/zola-v${ZOLA_VERSION}-x86_64-unknown-linux-gnu.tar.gz | tar xz

FROM gcr.io/distroless/cc
ENTRYPOINT ["/zola"]
COPY --from=0 /zola /
