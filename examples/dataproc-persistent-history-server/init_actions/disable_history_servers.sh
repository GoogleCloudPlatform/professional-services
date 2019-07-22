#!/bin/bash
set -euxo pipefail
role="$(/usr/share/google/get_metadata_value attributes/dataproc-role)"
SPARK_HISTORY_SERVER_PATH=/etc/init.d/spark-history-server
MR_HISTORY_SERVER_PATH=/etc/init.d/hadoop-mapreduce-historyserver

if [[ "${role}" == "Master" && -f ${SPARK_HISTORY_SERVER_PATH} ]]; then

  systemctl stop spark-history-server
fi

if [[ "${role}" == "Master" && -f ${MR_HISTORY_SERVER_PATH} ]]; then

  systemctl stop hadoop-mapreduce-historyserver
fi
