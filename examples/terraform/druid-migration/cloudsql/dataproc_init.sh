#!/bin/bash
ROLE=$(/usr/share/google/get_metadata_value attributes/dataproc-role)
if [[ "$${ROLE}" == 'Master' ]]; then
  gsutil cp /etc/hadoop/conf/core-site.xml gs://${bucket}/config/
  gsutil cp /etc/hadoop/conf/hdfs-site.xml gs://${bucket}/config/
  gsutil cp /etc/hadoop/conf/mapred-site.xml gs://${bucket}/config/
  gsutil cp /etc/hadoop/conf/yarn-site.xml gs://${bucket}/config/
  gsutil cp /usr/lib/hadoop/lib/gcs-connector-hadoop2* gs://${bucket}/config/
fi