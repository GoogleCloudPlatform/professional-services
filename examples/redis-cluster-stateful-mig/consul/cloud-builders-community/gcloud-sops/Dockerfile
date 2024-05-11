FROM gcr.io/cloud-builders/gcloud

ENV VER 3.7.1

COPY sops.bash /builder/sops.bash

RUN apt-get update && \
    apt-get install -y wget && \
    wget https://github.com/mozilla/sops/releases/download/v${VER}/sops_${VER}_amd64.deb && \
    dpkg -i sops_${VER}_amd64.deb && \
    chmod +x /builder/sops.bash && \
    apt-get remove --purge -y wget && \
    apt-get --purge -y autoremove && \
    apt-get clean && \
    rm sops_${VER}_amd64.deb && \
    rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["/builder/sops.bash"]
