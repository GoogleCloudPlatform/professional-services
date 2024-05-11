FROM alpine:3.9

ARG VAULT_VERSION
ARG VAULT_VERSION_SHA256SUM

COPY vault_${VAULT_VERSION}_linux_amd64.zip vault_${VAULT_VERSION}_linux_amd64.zip
RUN echo "${VAULT_VERSION_SHA256SUM}  vault_${VAULT_VERSION}_linux_amd64.zip" > checksum && sha256sum -c checksum
RUN unzip vault_${VAULT_VERSION}_linux_amd64.zip
RUN cp vault /usr/bin/vault && chmod +x /usr/bin/vault

ENTRYPOINT ["/usr/bin/vault"]
