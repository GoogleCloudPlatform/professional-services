#!/bin/bash
set -euxo pipefail
role="$(/usr/share/google/get_metadata_value attributes/dataproc-role)"
if [[ "${role}" == 'Master' ]]; then
  systemctl stop hadoop-mapreduce-historyserver
  systemctl stop spark-history-server
fi
