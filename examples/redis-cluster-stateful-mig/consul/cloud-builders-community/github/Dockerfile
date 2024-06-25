FROM debian:stable-slim

RUN apt update \
    && apt install -y git curl wget \
    && git version \
    && apt-get clean autoclean \
    && apt-get autoremove --yes \
    && rm -rf /var/lib/{apt,dpkg,cache,log}/

ENV CLI_VERSION=2.2.0
RUN wget -O- https://github.com/cli/cli/releases/download/v${CLI_VERSION}/gh_${CLI_VERSION}_linux_amd64.tar.gz | tar zx --strip-components=1

ADD gh.bash /usr/bin
RUN chmod +x /usr/bin/gh.bash

ENTRYPOINT ["/usr/bin/gh.bash"]
