#!/bin/bash
# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Run as root
# Disables services that are unnecessary on edge nodes

SERVICES="hadoop-hdfs-datanode
hadoop-hdfs-namenode
hadoop-hdfs-secondarynamenode
hadoop-mapreduce-historyserver
hadoop-yarn-nodemanager
hadoop-yarn-resourcemanager
hadoop-yarn-timelineserver
hive-metastore
hive-server2
spark-history-server
mariadb
mysql
google-fluentd
google-dataproc-agent-membership
google-dataproc-agent
google-dataproc-disk-mount"
for svc in $SERVICES; do
  systemctl stop $svc
  systemctl disable $svc
  [ -f "/etc/init.d/${svc}" ] && rm -rf "/etc/init.d/${svc}"
  [ -f "/lib/systemd/system/${svc}.service" ] && rm -v "/lib/systemd/system/${svc}.service"
  [ -f "/usr/lib/systemd/system/${svc}.service" ] && rm -v "/usr/lib/systemd/system/${svc}.service"
  [ -f "/etc/systemd/system/${svc}.service" ] && rm -v "/etc/systemd/system/${svc}.service"
  [ -d "/etc/systemd/system/${svc}.service.d" ] && rm -rvf "/etc/systemd/system/${svc}.service.d"
  [ -d "/etc/systemd/system/${svc}.service.wants" ] && rm -rvf "/etc/systemd/system/${svc}.service.wants"
done
systemctl daemon-reload
systemctl reset-failed
