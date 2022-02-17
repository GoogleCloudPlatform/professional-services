#!/usr/bin/env bash
# Copyright 2019 Google Inc.
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

apt-get -h
if apt-get -h ; then
    echo "Package manager is apt"
    apt-get update
    apt-get install -y wget
    apt-get install -y mysql-client
    apt-get install -y libsasl2-modules libsasl2-dev
    apt-get install -y python3
    apt install -y python3-pip

else
    if yum -h ; then
        echo "Package manager is yum"
        yum -y makecache
        yum install -y wget
        yum install -y mysql
        yum install -y gcc gcc-c++ cyrus-sasl-devel
        yum install -y python36
        yum install -y python36-setuptools
        easy_install-3.6 pip
    else
        echo "Package manager is neither yum nor apt"
        exit 0
    fi
fi

function err() {
  echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $*" >&2
  return 1
}

readonly PROXY_BIN='/usr/local/bin/cloud_sql_proxy'

function install_cloud_sql_proxy() {
  # Install proxy.
  wget -q https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 \
    || err 'Unable to download cloud-sql-proxy binary'
  mv cloud_sql_proxy.linux.amd64 ${PROXY_BIN}
  chmod +x ${PROXY_BIN}
  echo "Downloaded Cloud SQL Proxy at the location /usr/local/bin/"
}

install_cloud_sql_proxy

# Install virtual environment.
pip3 install virtualenv
echo "Installed virtualenv"
