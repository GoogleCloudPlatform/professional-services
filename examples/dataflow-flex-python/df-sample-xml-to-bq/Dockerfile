# This Dockerfile is to create an Image used by launcher to
# launch Dataflow workers.

FROM gcr.io/dataflow-templates-base/python38-template-launcher-base:20220418_RC00

ARG WORKDIR=/dataflow/template

RUN mkdir -p ${WORKDIR}

WORKDIR ${WORKDIR}

COPY xmltobq.py .

ENV FLEX_TEMPLATE_PYTHON_PY_FILE="${WORKDIR}/xmltobq.py"

RUN pip install apache-beam[gcp]==2.40.0 xmltodict==0.13.0