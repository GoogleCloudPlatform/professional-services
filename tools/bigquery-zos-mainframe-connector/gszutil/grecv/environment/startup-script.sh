#!/bin/bash
# Copyright 2022 Google LLC All Rights Reserved.
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



echo "START TIME: $(date)"

# If file already exist - no need to execute startup script (VM has been restarted not created)
# TODO implement same logic by checking each service on existence
if test -f "/opt/google-mainframe-connector/init.lock"; then
  echo "Lock file exists. Skipping installation"
else
  # More info about metadata here https://cloud.google.com/compute/docs/metadata/overview
  APP_JAR=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/attributes/app-storage-path" -H "Metadata-Flavor: Google")
  DEPS_JAR=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/attributes/deps-storage-path" -H "Metadata-Flavor: Google")
  TLS_CERT=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/attributes/tls-cert-path" -H "Metadata-Flavor: Google")
  TLS_PKEY=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/attributes/tls-pkey-path" -H "Metadata-Flavor: Google")
  TLS_GRPC_CHAIN=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/attributes/tls-grpc-chain-path" -H "Metadata-Flavor: Google")
  TLS_GRPC_KEY=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/attributes/tls-grpc-key-path" -H "Metadata-Flavor: Google")
  DNS_ALT_NAME=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/attributes/dns_alt_name" -H "Metadata-Flavor: Google")
  JAVA_XMS_GB=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/attributes/java-xms-gb" -H "Metadata-Flavor: Google")
  JAVA_XMX_GB=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/attributes/java-xmx-gb" -H "Metadata-Flavor: Google")

  _APP_PORT=51771
  _TLS_PROXY_PORT=52701

  # Install base tools
  apt-get update
  apt-get install curl gnupg software-properties-common --yes

  # https://cloud.google.com/monitoring/agent/monitoring/installation#agent-install-latest-linux
  # Install Cloud Monitoring agent
  curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
  chmod +x add-google-cloud-ops-agent-repo.sh
  ./add-google-cloud-ops-agent-repo.sh --also-install

  # Install OpenJDK 8
  curl https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | apt-key add
  add-apt-repository https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/ --yes
  apt-get update
  apt-get install adoptopenjdk-8-hotspot --yes

  # Setup and Run Grecv service
  mkdir -p /opt/google-mainframe-connector/lib
  gsutil cp $APP_JAR /opt/google-mainframe-connector/lib/
  gsutil cp $DEPS_JAR /opt/google-mainframe-connector/lib/
  gsutil cp $TLS_GRPC_CHAIN /opt/google-mainframe-connector/lib/server1.pem
  gsutil cp $TLS_GRPC_KEY /opt/google-mainframe-connector/lib/server1.key

  cat <<EOF >/etc/systemd/system/mainframe-connector.service
[Unit]
Description = Google Cloud Mainframe Connector
After=network.target
Before=stunnel.service

[Service]
Restart = always
RestartSec = 1
SuccessExitStatus = 143
Environment=LOG_WRAP_SPOOL=false
ExecStart = java -Xms${JAVA_XMS_GB}g -Xmx${JAVA_XMX_GB}g \
 -cp '/opt/google-mainframe-connector/lib/*' com.google.cloud.imf.GRecv --port=${_APP_PORT} \
 --chain="/opt/google-mainframe-connector/lib/server1.pem" \
 --key="/opt/google-mainframe-connector/lib/server1.key"

[Install]
WantedBy=multi-user.target
EOF

  export dns_alt_name=DNS_ALT_NAME
  systemctl daemon-reload
  systemctl enable mainframe-connector
  systemctl start mainframe-connector

  #Install stunnel
  apt-get install stunnel4 --yes

  gsutil cp $TLS_CERT /etc/stunnel/grecv.crt
  gsutil cp $TLS_PKEY /etc/stunnel/grecv.pem
  chmod 600 /etc/stunnel/grecv.pem

  cat <<EOF >/etc/stunnel/stunnel.conf
setuid = nobody
setgid = nogroup
pid = /tmp/stunnel.pid
output = /tmp/stunnel.log
debug = info
#foreground = yes

[grecv]
accept = 0.0.0.0:${_TLS_PROXY_PORT}
connect = 127.0.0.1:${_APP_PORT}
cert = /etc/stunnel/grecv.crt
key = /etc/stunnel/grecv.pem
CAfile = /etc/stunnel/grecv.crt
renegotiation = no
EOF

  cat <<EOF >/etc/systemd/system/stunnel.service
[Unit]
Description = stunnel
After=network.target
After=mainframe-connector.service

[Service]
Type = forking
Restart = always
RestartSec = 1
SuccessExitStatus = 143
ExecStart = stunnel

[Install]
WantedBy=multi-user.target
EOF

  cat <<EOF >/opt/google-mainframe-connector/init.lock
initialization lock file
used to prevent execution of startup script each time VM is restarted
EOF

fi

systemctl daemon-reload
systemctl enable stunnel
systemctl start stunnel

echo "END TIME: $(date)"
