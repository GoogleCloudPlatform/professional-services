# Copyright 2021 Google, LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM node:13.6.0-alpine AS builder

ARG IMAGE_CREATE_DATE
ARG IMAGE_VERSION
ARG IMAGE_SOURCE_REVISION

# Metadata as defined in OCI image spec annotations - https://github.com/opencontainers/image-spec/blob/master/annotations.md
LABEL org.opencontainers.image.title="Hello Kubernetes!" \
      org.opencontainers.image.description="Provides a demo image to deploy to a Kubernetes cluster. It displays a message, the name of the pod and details of the node it is deployed to." \
      org.opencontainers.image.created=$IMAGE_CREATE_DATE \
      org.opencontainers.image.version=$IMAGE_VERSION \
      org.opencontainers.image.authors="Paul Bouwer" \
      org.opencontainers.image.url="https://hub.docker.com/r/paulbouwer/hello-kubernetes/" \
      org.opencontainers.image.documentation="https://github.com/paulbouwer/hello-kubernetes/README.md" \
      org.opencontainers.image.vendor="Paul Bouwer" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/paulbouwer/hello-kubernetes.git" \
      org.opencontainers.image.revision=$IMAGE_SOURCE_REVISION 

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY ./app/package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

###################################################
FROM alpine
COPY --from=builder /usr/src/app /usr/src/app
WORKDIR /usr/src/app

USER node
CMD [ "npm", "start" ]