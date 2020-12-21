# Copyright 2020 Google LLC.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# Authors: yunusd@google.com, sametkaradag@google.com

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

