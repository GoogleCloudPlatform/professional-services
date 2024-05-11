FROM launcher.gcr.io/google/ubuntu16_04

RUN apt-get -q update && \
    apt-get install -qqy rsync ssh

ENTRYPOINT [ "rsync" ]
