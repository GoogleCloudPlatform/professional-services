FROM gcr.io/cloud-builders/kubectl

RUN mkdir -p /builder/bin && \
  apt-get update && \
  apt-get install -y curl && \
  curl -sSLo /builder/bin/skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64 && \
  chmod +x /builder/bin/skaffold && \
  apt-get remove --purge -y curl && \
  apt-get --purge -y autoremove && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

ENV PATH=/builder/bin/:$PATH
ENV DOCKER_CONFIG=/builder/home/.docker

COPY skaffold.bash /builder/skaffold.bash
RUN chmod +700 /builder/skaffold.bash
ENTRYPOINT ["/builder/skaffold.bash"]
