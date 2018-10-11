FROM alpine:3.8

ENV CRONSPEC "0 * * * *"
ENV CRONTAB /etc/crontabs/root
ENV LOGFILE /var/log/app.log

COPY requirements.txt /

RUN \
  apk update && \
  apk add build-base libstdc++ python python-dev py2-pip && \
  /usr/bin/pip install --upgrade pip && \
  /usr/bin/pip install -r requirements.txt && \
  apk del build-base python-dev && \
  rm /var/cache/apk/*

COPY gce-quota-sync.py /
RUN chmod 755 /gce-quota-sync.py

CMD \
  echo "$CRONSPEC	/gce-quota-sync.py >>$LOGFILE 2>&1" > $CRONTAB && \
  echo "3 0 * * * echo '' >$LOGFILE" >> $CRONTAB && \
  crond -L /var/log/cron.log && \
  touch $LOGFILE && \
  tail -q -F $LOGFILE
