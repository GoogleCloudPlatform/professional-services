#!/bin/bash
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

FQDN=$(curl -s -H "Metadata-Flavor: Google" http://metadata/computeMetadata/v1/instance/hostname)
HOSTNAME=$(echo $FQDN | cut -d"." -f1)
openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 -subj /CN=$HOSTNAME/ -addext "subjectAltName = DNS:$FQDN" -keyout /etc/ssl/self-signed.key -out /etc/ssl/self-signed.crt
chgrp nginx /etc/ssl/self-signed.key -out /etc/ssl/self-signed.crt
sed -i "s/HOSTNAME/${HOSTNAME}/" /etc/nginx/conf.d/default.conf