# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#
# This dockerfile is used to containerize our BigQuery Consolidator Utility
# so that we can essentially run this application using Google Cloud Run
# and further into any environments (like Cloud Run on GKE, GKE, etc.) which
# supports Docker, which is almost everywhere!
#
# Author		:		Suddhasatwa Bhaumik, SCE, Google Cloud
# Created Date 	:		03-03-23
#


# specify python version
FROM python:3.9.2

# container updates
RUN apt-get update

# place source code files
COPY ./src /app
COPY requirements.txt /app/requirements.txt
COPY *.json /app/bq-consolidator-sa-key.json
WORKDIR /app

# create virtualenv & install python dependencies
RUN python3 -m pip install -r /app/requirements.txt

# install gcloud sdk
RUN curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-421.0.0-linux-x86_64.tar.gz
RUN tar -xvf google-cloud-cli-421.0.0-linux-x86_64.tar.gz
RUN /app/google-cloud-sdk/install.sh
ENV PATH $PATH:/app/google-cloud-sdk/bin

# add service account 
# this is optional, hence hidden - may come useful in later releases of this tool
# RUN gcloud auth activate-service-account --key-file="/app/bq-consolidator-sa-key.json"

# configure destination project
ENV GOOGLE_CLOUD_PROJECT="<your-project-name-goes-here>"

# set the working directory
WORKDIR /app 

# END OF DOCKERFILE
