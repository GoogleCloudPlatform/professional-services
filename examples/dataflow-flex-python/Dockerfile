# This Dockerfile is for creating an Image installed with all
# dependencies that will be used by Dataflow workers at run time.

FROM python:3.8-slim

RUN pip install --no-cache-dir apache-beam[gcp]==2.40.0 xmltodict==0.13.0

RUN pip check

COPY --from=apache/beam_python3.8_sdk:2.40.0 /opt/apache/beam /opt/apache/beam

ENTRYPOINT ["/opt/apache/beam/boot"]