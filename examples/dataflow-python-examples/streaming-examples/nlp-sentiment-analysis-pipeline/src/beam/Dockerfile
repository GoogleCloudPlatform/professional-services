FROM ubuntu

COPY . /beam
WORKDIR /beam

ENV PIP_DISABLE_PIP_VERSION_CHECK=1
RUN apt-get update
RUN apt-get install -y python3-pip
RUN pip3 install -r requirements.txt