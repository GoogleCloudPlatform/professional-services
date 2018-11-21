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

if python -c "import pyhive"
then
echo "pyhive already installed"
else
pip install pyhive
fi

if python -c "import  thrift"
then
echo "pyhive already installed"
else
pip install thrift
fi

if python -c "from google.cloud import bigquery"
then
echo "google-cloud-bigquery already installed"
else
pip install google-cloud-bigquery
fi

if python -c "from google.cloud import storage"
then
echo "google-cloud-storage already installed"
else
pip install google-cloud-storage
fi

if python -c "import  sasl"
then
echo "sasl already installed"
else
pip install sasl
fi

if python -c "import thrift_sasl "
then
echo "thrift_sasl already installed"
else
pip install thrift_sasl
fi

if python -c "import  tableprint"
then
echo "tableprint already installed"
else
pip install tableprint
fi

if python -c "import  pymysql"
then
echo "pymysql already installed"
else
pip install pymysql
fi
