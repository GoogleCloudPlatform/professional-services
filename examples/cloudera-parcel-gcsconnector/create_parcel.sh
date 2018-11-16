#!/bin/bash
# Copyright 2018 Google Inc.
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

# This script creates a Cloudera Parcel which contains Google Cloud Storage connector which
# enables connections between CDH cluster and Cloud Storage. Using the parcel, CDH can distribute
# the connector to all the nodes to save time and efforts of distributing and installing the
# connector.

# User must run the script in a separate folder where only the files to be packaged are present
# -f: name of the parcel in a single string format without any spaces or special characters.
# -v: version of the parcel in the format x.x.x (ex: 1.0.0)
# -o: name of the operating system distribution
# -d: flag is to be used if you want to deploy the parcel to the cloudera manager parcel repo
# folder, this flag is optional and if not provided then the parcel file will be created in the
# same directory where script run.

while getopts f:v:o:d: option; do
  case "${option}"
  in
    f) filen=${OPTARG} ;;
    v) version=${OPTARG} ;;
    o) OSTYPE=${OPTARG} ;;
    d) placefile='true' ;;
  esac
done

#capture logs of this script to /var/log/build_parcel.log file
>/var/log/build_parcel.log
exec 1>/var/log/build_parcel.log 2>&1

if [[ "$OSTYPE" == "el5" ]]; then
  OS=el5
  yum install wget -y
elif [[ "$OSTYPE" == "el6" ]]; then
  OS=el6
  yum install wget -y
elif [[ "$OSTYPE" == "el7" ]]; then
  OS=el7
  yum install wget -y
elif [[ "$OSTYPE" == "sles11" ]]; then
  OS=sles11
  zypper install wget -y
elif [[ "$OSTYPE" == "sles12" ]]; then
  OS=sles12
  zypper install wget -y
elif [[ "$OSTYPE" == "lucid" ]]; then
  OS=lucid
  apt-get install wget -y
elif [[ "$OSTYPE" == "precise" ]]; then
  OS=precise
  apt-get install wget -y
elif [[ "$OSTYPE" == "trusty" ]]; then
  OS=trusty
  apt-get install wget -y
elif [[ "$OSTYPE" == "squeeze" ]]; then
  OS=squeeze
  apt-get install wget -y
elif [[ "$OSTYPE" == "wheezy" ]]; then
  OS=wheezy
  apt-get install wget -y
else
  echo "OS not in list, please provide valid OS name"
fi

## Display variable information input by user
echo "Version number:${version}"
echo "OS type:${OS}"
echo "Filename:${filen}"
mkdir -p ${filen^^}-$version/lib/hadoop/lib && mkdir -p ${filen^^}-$version/meta
touch ${filen^^}-$version/meta/parcel.json

##Download gcs connector jar and copy all folder content to parcel location
wget https://storage.googleapis.com/hadoop-lib/gcs/gcs-connector-hadoop2-latest.jar
cp * ${filen^^}-$version/lib/hadoop/lib/

## Create parcel.json file required for parcel packaging
cat >>${filen^^}-$version/meta/parcel.json<< EOL
{
  "schema_version":     1,
  "name":               "${filen^^}",
  "version":            "$version",
  "extraVersionInfo": {
    "fullVersion":        "$version-0-$OS",
    "baseVersion":        "${filen^^}$version",
    "patchCount":         ""
  },

  "conflicts":          "",

  "setActiveSymlink":   true,

  "scripts": {
        "defines": "${filen^^}.sh"
  },

  "packages": [ ],
  "components": [ ],

  "provides": [
    "cdh-plugin"
  ],

  "users": { },

  "groups": [ ]
}

EOL

##export HADOOP_CLASSPATH to enable command line commands can use the connector
cat >>${filen^^}-$version/meta/$filen.sh<< EOL
export HADOOP_CLASSPATH=\$HADOOP_CLASSPATH:/opt/cloudera/parcels/$filen-$version/lib/hadoop/lib/gcs-connector-latest-hadoop2.jar
EOL

## Create parcel file, checksum file and shift parcel files to cloudera parcel directory and change ownership to cloudera-scm user
sudo tar zcvf ${filen^^}-$version-$OS.parcel ${filen^^}-$version/ --owner=root --group=root
sudo sha1sum ${filen^^}-$version-$OS.parcel | awk '{ print $1 }' > ${filen^^}-$version-$OS.parcel.sha

if [[ "$placefile" == "true" ]]; then
  sudo cp ${filen^^}-$version-$OS.parcel* /opt/cloudera/parcel-repo/
  sudo chown cloudera-scm:cloudera-scm /opt/cloudera/parcel-repo/*
else
  echo "Creating parcel on local host"
fi
