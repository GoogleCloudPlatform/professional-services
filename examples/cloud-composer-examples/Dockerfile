ARG BEAM_VERSION=2.19.0

FROM apache/beam_python3.7_sdk:${BEAM_VERSION}

COPY . ./

RUN pip3 install -r requirements.txt
