FROM python:3.7-stretch

ARG release=19
ARG update=6

RUN mkdir -p /schema_converter && mkdir -p /opt/oracle && \
    wget -q -nv https://download.oracle.com/otn_software/linux/instantclient/19600/instantclient-basiclite-linux.x64-${release}.${update}.0.0.0dbru.zip -O /opt/oracle/instantclient_${release}_${update}.zip && \
    unzip /opt/oracle/instantclient_${release}_${update}.zip -d /opt/oracle/ && \
    rm /opt/oracle/instantclient_${release}_${update}.zip

RUN apt update && apt install libaio-dev -y && pip install pipenv

ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_${release}_${update}:$LD_LIBRARY_PATH

WORKDIR /schema_converter

ENTRYPOINT ["/bin/bash"]

