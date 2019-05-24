#!/bin/bash
set -euxo pipefail
role="$(/usr/share/google/get_metadata_value attributes/dataproc-role)"

if [[ "${role}" == "Master" && -f /etc/init.d/spark-history-server ]]; then

  systemctl stop spark-history-server
fi

if [[ "${role}" == "Master" && -f /etc/init.d/hadoop-mapreduce-historyserver ]]; then

  systemctl stop hadoop-mapreduce-historyserver
fi
