FROM launcher.gcr.io/google/ubuntu1804
LABEL MAINTAINER marcin.niemira@gmail.com

RUN apt-get update && \
    apt-get -y install shellcheck

ENTRYPOINT ["shellcheck"]
