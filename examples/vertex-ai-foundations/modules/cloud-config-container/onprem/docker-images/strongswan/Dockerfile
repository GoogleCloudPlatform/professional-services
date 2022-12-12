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

FROM alpine:latest

RUN set -xe \
  && apk add --no-cache strongswan bash sudo

COPY entrypoint.sh /entrypoint.sh
RUN chmod 0755 /entrypoint.sh

COPY ipsec-vti.sh /var/lib/strongswan/ipsec-vti.sh
RUN chmod 0755 /var/lib/strongswan/ipsec-vti.sh

RUN echo 'ipsec ALL=NOPASSWD:SETENV:/usr/sbin/ipsec,/sbin/ip,/sbin/sysctl' > /etc/sudoers.d/ipsec
RUN chmod 0440 /etc/sudoers.d/ipsec

ENV VPN_DEVICE=eth0
ENV LAN_NETWORKS=192.168.0.0/24

EXPOSE 500/udp 4500/udp

ENTRYPOINT ["/entrypoint.sh"]
