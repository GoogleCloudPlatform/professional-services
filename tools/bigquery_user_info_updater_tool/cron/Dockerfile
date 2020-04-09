FROM python:3.6-slim
RUN mkdir -p ~/.kube && apt-get update && apt-get install -y curl && pip install --upgrade kubernetes
RUN curl -sSL https://sdk.cloud.google.com | bash
RUN pip install --upgrade google-cloud-bigquery
RUN mkdir -p /opt/cron
COPY bigquery_user_info_updater /opt/cron/bigquery_user_info_updater
COPY bigquery_user_updater.sh /opt/cron/
CMD printenv >> /etc/environment && cron && tail -f /var/log/cron.log
