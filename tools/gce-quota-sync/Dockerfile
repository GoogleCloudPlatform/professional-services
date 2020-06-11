# Copyright 2018 Google Inc.
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

FROM alpine:3.8

ENV CRONSPEC "13 * * * *"
ENV CRONTAB /etc/crontabs/root
ENV LOGFILE /var/log/app.log

COPY requirements.txt /

RUN \
  apk update && \
  apk add build-base libstdc++ python python-dev py2-pip linux-headers && \
  /usr/bin/pip install --upgrade pip && \
  /usr/bin/pip install -r requirements.txt && \
  apk del build-base python-dev linux-headers && \
  rm /var/cache/apk/*

COPY gce-quota-sync.py /
RUN chmod 755 /gce-quota-sync.py

CMD \
  echo "$CRONSPEC	/gce-quota-sync.py >>$LOGFILE 2>&1" > $CRONTAB && \
  echo "3 0 * * * echo '' >$LOGFILE" >> $CRONTAB && \
  crond -L /var/log/cron.log && \
  touch $LOGFILE && \
  tail -q -F $LOGFILE
