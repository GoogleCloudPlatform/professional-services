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
FROM marketplace.gcr.io/google/debian11

RUN apt-get update && apt-get dist-upgrade -y && apt-get install -y curl gnupg2
RUN curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
RUN bash add-google-cloud-ops-agent-repo.sh --also-install 
RUN rm -f add-google-cloud-ops-agent-repo.sh

RUN echo '#!/bin/bash' > /entrypoint.sh
RUN echo 'cd /tmp' >> /entrypoint.sh
RUN echo '/opt/google-cloud-ops-agent/libexec/google_cloud_ops_agent_engine -service=otel -in /etc/google-cloud-ops-agent/config.yaml' >> /entrypoint.sh
RUN echo '/opt/google-cloud-ops-agent/subagents/opentelemetry-collector/otelopscol --config=/tmp/otel.yaml --feature-gates=exporter.googlecloud.OTLPDirect' >> /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT /entrypoint.sh
CMD []