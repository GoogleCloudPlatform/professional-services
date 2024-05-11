FROM alpine:3.10

ARG VELERO_VERSION
ARG VELERO_VERSION_SHA256SUM

COPY velero-${VELERO_VERSION}-linux-amd64.tar.gz velero-${VELERO_VERSION}-linux-amd64.tar.gz
RUN echo "${VELERO_VERSION_SHA256SUM}  velero-${VELERO_VERSION}-linux-amd64.tar.gz" > checksum && sha256sum -c checksum
RUN tar xvf velero-${VELERO_VERSION}-linux-amd64.tar.gz

FROM gcr.io/cloud-builders/gcloud

COPY --from=0 velero-v1.1.0-linux-amd64/velero /usr/bin/velero
COPY velero.bash /builder/velero.bash
ENTRYPOINT ["/builder/velero.bash"]
