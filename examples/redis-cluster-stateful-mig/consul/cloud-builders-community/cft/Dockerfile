FROM gcr.io/cloud-builders/gcloud

RUN apt-get update && apt-get -y install make \
    && pip install setuptools \
    && git clone https://github.com/GoogleCloudPlatform/cloud-foundation-toolkit \
    && cd cloud-foundation-toolkit/ \
    && cd dm \
    && make cft-prerequisites \
    && make build \
    && make install \
    && cd / \
    && rm -rf /cloud-foundation-toolkit

ENTRYPOINT ["/usr/local/bin/cft"]
