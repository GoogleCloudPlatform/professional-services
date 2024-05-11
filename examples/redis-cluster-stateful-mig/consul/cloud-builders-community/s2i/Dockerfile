FROM gcr.io/cloud-builders/docker

ARG version=1.1.13
ARG commit=b54d75d3

RUN \
  curl -L "https://github.com/openshift/source-to-image/releases/download/v$version/source-to-image-v$version-$commit-linux-amd64.tar.gz" -o /tmp/release.tar.gz && \
  tar -C /tmp -xzvf /tmp/release.tar.gz  && \
  cp /tmp/s2i /usr/local/bin && \
  chmod +x /usr/local/bin/s2i 

ENTRYPOINT ["/usr/local/bin/s2i"]
