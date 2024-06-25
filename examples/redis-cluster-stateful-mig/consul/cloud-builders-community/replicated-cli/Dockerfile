FROM ubuntu:18.04

RUN apt-get update && \
    apt-get -y install curl&& \
    curl -sSL https://raw.githubusercontent.com/replicatedhq/replicated/master/install.sh | bash

ENTRYPOINT ["replicated"]
