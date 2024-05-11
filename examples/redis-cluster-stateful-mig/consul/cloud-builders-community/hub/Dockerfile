FROM gcr.io/cloud-builders/git

RUN apt-get update && \
  apt-get install -y wget && \
  wget https://github.com/github/hub/releases/download/v2.14.2/hub-linux-amd64-2.14.2.tgz && \
  tar xvfz hub-linux-amd64-2.14.2.tgz && \
  rm hub-linux-amd64-2.14.2.tgz && \
  mv hub-linux-amd64-2.14.2/bin/hub /usr/bin/ && \
  chmod +x /usr/bin/hub && \
  alias git=hub

ENTRYPOINT ["/usr/bin/hub"]
