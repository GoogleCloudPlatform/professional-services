# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


FROM google/cloud-sdk:alpine

COPY entrypoint.sh /entrypoint.sh
RUN chmod 0755 /entrypoint.sh

RUN apk update && \
  apk add bash curl bind-tools busybox-extras netcat-openbsd && \
  rm /var/cache/apk/*

RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl && \
  chmod 755 kubectl && mv kubectl /usr/local/bin/

CMD ["/bin/bash"]

ENTRYPOINT ["/entrypoint.sh"]
