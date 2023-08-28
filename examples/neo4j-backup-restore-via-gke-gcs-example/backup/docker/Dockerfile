# Copyright 2023 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This Dockerfile will install a neo4j instance along with cloud-sdk on
# the backup pod along with the backup admin shell script to complete
# the scheduled backup

FROM launcher.gcr.io/google/debian11
RUN apt-get update
RUN apt-get install -y bash curl wget gnupg apt-transport-https apt-utils lsb-release
RUN wget -O - https://debian.neo4j.com/neotechnology.gpg.key | apt-key add -
RUN curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.18.0/bin/linux/amd64/kubectl
RUN chmod +x ./kubectl
RUN mv ./kubectl /usr/local/bin/kubectl
RUN echo 'deb http://debian.neo4j.com stable 5' | tee -a /etc/apt/sources.list.d/neo4j.list
RUN apt-get update
RUN echo "deb http://packages.cloud.google.com/apt cloud-sdk-$(lsb_release -c -s) main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list

RUN echo "neo4j-enterprise neo4j/accept-license select Accept commercial license" | debconf-set-selections

RUN apt-get update
RUN apt-get install -y neo4j-enterprise=1:5.8.0 --fix-missing
RUN apt-get install -y google-cloud-sdk

RUN mkdir /backups
ADD /neo4j-backup-admin.sh /scripts/neo4j-backup-admin.sh
RUN chmod u+x /scripts/neo4j-backup-admin.sh
ADD /neo4j-env-variables.sh /scripts/neo4j-env-variables.sh
RUN chmod u+x /scripts/neo4j-env-variables.sh

CMD ["/scripts/neo4j-backup-admin.sh"]