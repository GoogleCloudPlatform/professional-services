#!/bin/bash

apt-get -h
if [ $? -eq 0 ]; then
    echo "Package manager is apt"
    apt-get update
    apt-get install -y git
    apt-get install -y libpq-dev python-dev libxml2-dev libxslt1-dev libldap2-dev libsasl2-dev libffi-dev
    apt-get install -y sasl2-bin libsasl2-2 libsasl2-dev libsasl2-modules
    apt install -y python-pip
else
    yum -h
    if [ $? -eq 0 ]; then
        echo "Package manager is yum"
        yum -y update
        yum install -y git
        yum install -y python-pip gcc gcc-c++ python-virtualenv cyrus-sasl-devel
    else
        echo "Package manager is neither yum nor apt"
        exit 0
    fi
fi

# Download the Cloud SQL proxy
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy

# Install virtual environment
pip install virtualenv