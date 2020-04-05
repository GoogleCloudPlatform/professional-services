# Copyright 2020 Google LLC
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


FROM ruby:alpine

# Install all packages and pin the versions
RUN apk add --no-cache --update bash~=5.0.11-r1 build-base~=0.5-r1 libxml2-dev~=2.9.10-r1 \
    libffi-dev~=3.2.1-r6 git~=2.24.1-r0 openssh-client~=8.1_p1-r0 curl~=7.67.0-r0 \
    jq~=1.6-r0 vim~=8.2.0-r0 python2~=2.7.16-r3 libsodium-dev~=1.0.18-r0 less~=551-r0 && \
    gem install inspec:3.9.3 --no-document && \
    gem uninstall mixlib-shellout:3.0.7 && \
    apk del build-base

# Install gcloud
RUN curl -sSL https://sdk.cloud.google.com > /tmp/gcl && \
    bash /tmp/gcl --install-dir=~/gcloud --disable-prompts && \
    rm /tmp/gcl

# Enable gcloud completion
COPY .profile /root/.bashrc
ENV ENV="/root/.bashrc"

# Set up vi -> vim and not busybox vi
RUN rm /usr/bin/vi && ln -s /usr/bin/vim /usr/bin/vi

# Set up mount points for the working directory
RUN mkdir -p /share
WORKDIR /share/kitchen

# Default command is running inspec
CMD ["inspec"]
VOLUME ["/share"]
