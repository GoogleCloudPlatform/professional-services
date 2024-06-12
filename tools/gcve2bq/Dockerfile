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

FROM ubuntu:latest
RUN apt-get update
RUN apt-get install -y wget unzip apt-transport-https software-properties-common vim curl
RUN wget -q https://packages.microsoft.com/config/ubuntu/16.04/packages-microsoft-prod.deb
RUN dpkg -i packages-microsoft-prod.deb
RUN apt-get update
RUN apt-get install -y powershell
RUN wget https://vdc-download.vmware.com/vmwb-repository/dcr-public/8bf09c32-43c0-46d4-8816-92515c3b8228/15761272-b339-4da4-888a-4b8633f9a964/VMware-PowerCLI-11.3.0-13990089.zip -P /opt/microsoft/powershell/7/Modules
RUN unzip -d /opt/microsoft/powershell/7/Modules/ /opt/microsoft/powershell/7/Modules/VMware-PowerCLI-11.3.0-13990089.zip; exit 0
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg  add - && apt-get update -y && apt-get install google-cloud-cli -y

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

ENTRYPOINT /usr/bin/pwsh get-gcve-util.ps1