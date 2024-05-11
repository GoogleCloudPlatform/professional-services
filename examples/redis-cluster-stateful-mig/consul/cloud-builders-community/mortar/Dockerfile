FROM gcr.io/cloud-builders/gcloud

ENV VER 0.3.2
ENV VERSION v${VER}

COPY mortar.bash /builder/mortar.bash

RUN apt-get update && \
  apt-get install -y wget && \
  wget https://github.com/kontena/mortar/releases/download/${VERSION}/mortar-linux-amd64-${VER} && \
  mkdir /builder/mortar && \
  mv mortar-linux-amd64-${VER} /builder/mortar/mortar && \
  chmod +x /builder/mortar/mortar && \
  chmod +x /builder/mortar.bash && \
  apt-get remove --purge -y wget && \
  apt-get --purge -y autoremove && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

ENV PATH=/builder/mortar:$PATH

ENTRYPOINT ["/builder/mortar.bash"]
