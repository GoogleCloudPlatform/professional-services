# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM gcr.io/dataflow-templates-base/python3-template-launcher-base:latest as template_launcher

ARG WORKDIR=/workspace
RUN mkdir -p ${WORKDIR}
WORKDIR ${WORKDIR}

COPY wordcount/ ${WORKDIR}/wordcount
COPY main.py ${WORKDIR}/main.py
COPY requirements.txt ${WORKDIR}/requirements.txt
COPY setup.py ${WORKDIR}/setup.py

ENV FLEX_TEMPLATE_PYTHON_PY_FILE="${WORKDIR}/main.py"
ENV FLEX_TEMPLATE_PYTHON_SETUP_FILE="${WORKDIR}/setup.py"

RUN pip install -U -r ${WORKDIR}/requirements.txt