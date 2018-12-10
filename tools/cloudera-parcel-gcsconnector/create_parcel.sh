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
# -d: flag is to be used if you want to deploy the parcel to the Cloudera manager parcel repo
# folder, this flag is optional and if not provided then the parcel file will be created in the
# same directory where script run.

BASEDIR=${HOME}/GCS-CDH-PARCEL
rm -rf ${BASEDIR}
mkdir -p ${BASEDIR}
LOGDIR=${HOME}/parcel-logs
mkdir -p ${LOGDIR}/
cd ${BASEDIR}
touch ${LOGDIR}/cparcel_error.log
touch ${LOGDIR}/cparcel_output.log

#######################################
# Capture logs in create_parcel.log and exit
# Globals:
#   None
# Arguments:
#   None
# Returns:
#   None
#######################################
function graceful_exit() {
echo "-------------------------------">>${LOGDIR}/create_parcel.log
echo "From User: "$(whoami)>>${LOGDIR}/create_parcel.log
cat ${LOGDIR}/cparcel_output.log >> ${LOGDIR}/create_parcel.log
exit 1
}

#######################################
# User Help function for irregular input parameters
# Globals:
#   None
# Arguments:
#   -f: Parcel name
#   -v: Parcel version
#   -o: Operating system
#   -d: (Optional)Parcel deployment through Clodera Manager value : true
# Returns:
#   None
#######################################
function help {
  echo 'Usage: create_parcel.sh -f <parcel_name> -v <version> -o <os_distro_suffix> [-d true]'
  graceful_exit
}

###Allowed OS parameter values and flag to check valid input
os_flag=0
os_value_arr=(el5 el6 el7 sles11 sles12 lucid precise trusty squeeze wheezy)

###Link to hadoop jar file and flag to validate the file existence
jar_link="https://storage.googleapis.com/hadoop-lib/gcs/gcs-connector-hadoop2-latest.jar"
hadoop_jar_flag="1"

exec > >(tee -i ${LOGDIR}/cparcel_output.log)
exec 2>&1
echo $(date)

if [[ $# -lt 6 ]] || [[ $# == 7 ]] || [[ $# -gt 8 ]]; then
  echo 'Error: Number of parameters do not match'
  help
  graceful_exit
fi

###*************
#CHECKING The PARAMETERS
###Regex varible for Parcel and version validity
parcel_flag='^[A-Za-z0-9]+$'
version_flag='^[0-9]\.[0-9]\.[0-9]$'

### Check the validity of parameters at valid points
if [[ $1 != '-f' || $3 != '-v' || $5 != '-o' ]]; then
  echo 'Error: Sequence of parameters not valid'
  help
  graceful_exit
elif [[ $2 == '' || $4 == '' || $6 == '' ]]; then
  echo 'Error: Null value not allowed'
  graceful_exit
elif [[ $7 != '' ]]; then
  if [[ $8 != 'true' ]]; then
    echo 'Error: The only accepted parameter is true'
    graceful_exit
  fi
fi

if [[ $2 =~ $parcel_flag && $4 =~ $version_flag ]]; then
  :
else
  echo 'Error: invalid parcel name or version'
  graceful_exit
fi

### Getting the paramter values from command line
while getopts 'f:v:o:d:' option; do
  case "${option}"
  in
    f) filen=${OPTARG} ;;
    v) version=${OPTARG} ;;
    o) OSTYPE=${OPTARG} ;;
    d) placefile=${OPTARG} ;;
    :) help
    ;;
    \?) help
    ;;
    *) help
    ;;
  esac
done
shift "$(($OPTIND -1))"

##Throw error if folder doesnt exists (if not using -d parameter then script fails)
if [[ ! -d /opt/cloudera/parcel-repo/ ]] && [[ "$placefile" == "true" ]] ; then
  echo "Error: /opt/cloudera/parcel-repo/ folder doesn't exist"
  graceful_exit
elif ! grep -q "cloudera-scm" /etc/group && [[ "$placefile" == "true" ]]; then
  echo "Error: cloudera-scm group doesn't exist"
  graceful_exit
fi

###Redirect every current executions stderr to ${LOGDIR}/cparcel_output.log and
#consolidated output log to ${LOGDIR}/create_parcel.log

OS=${OSTYPE}
for item in ${os_value_arr[*]}; do
  if [[ $item == $OSTYPE ]]; then
    os_flag=1
  fi
done

if [[ $os_flag == 0 ]]; then
  echo 'Error: below are the allowed os type'
  printf '%s\n' "${os_value_arr[@]}"
  graceful_exit
fi

## Display variable information input by user
echo "Version number:${version}"
echo "OS type:${OS}"
echo "Filename:${filen}"

### Path is changed to ${HOME} for further execution
#Create the file structure for parcel building
mkdir -p ${filen^^}-$version/lib/hadoop/lib && mkdir -p ${filen^^}-$version/meta
if [[ $? -ne 0 ]]; then
  echo "Error: failed to create directory, check for folder permissions"
  graceful_exit
fi

touch ${filen^^}-$version/meta/parcel.json
if [[ $? -ne 0 ]]; then
  echo "Error: failed to create parcel.json file, check for file/folder permissions"
  graceful_exit
fi

##Download gcs connector jar and copy all folder content to parcel location
##Used flag for further validation

curl -o gcs-connector-hadoop2-latest.jar --fail ${jar_link} || hadoop_jar_flag="0"

##Validate if package downloaded properly
if [[ ${hadoop_jar_flag} = "0" ]]; then
  echo "Error: hadoop connector failed to download, check network connectivity or file/folder permissions"
  graceful_exit
fi

cp gcs-connector-hadoop2-latest.jar ${filen^^}-$version/lib/hadoop/lib/

###Check the file in lib folder
[ -f ${filen^^}-$version/lib/hadoop/lib/gcs-connector-hadoop2-latest.jar ] || hadoop_jar_flag="0"

if [[ ${hadoop_jar_flag} = "0" ]]; then
  echo "Error: hadoop connector is missing from "$(pwd)/${filen^^}-$version/lib/hadoop/lib/
  graceful_exit
fi

## Create parcel.json file required for parcel packaging
cat >>${filen^^}-$version/meta/parcel.json<<EOL
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

if [[ $? -ne 0 ]]; then
  echo "Error: failed to write in parcel.json "$(pwd)/${filen^^}-$version/meta/parcel.json
  graceful_exit
fi

##export HADOOP_CLASSPATH to enable command line to use the connector

cat >>${filen^^}-$version/meta/$filen.sh<<EOL
#!/bin/bash
export HADOOP_CLASSPATH=\$HADOOP_CLASSPATH:/opt/cloudera/parcels/$filen-$version/lib/hadoop/lib/gcs-connector-latest-hadoop2.jar
EOL

if [[ $? -ne 0 ]]; then
  echo "Error: failed to write in file "$(pwd)/${filen^^}-$version/meta/$filen.sh
  graceful_exit
fi

##Create parcel file, checksum file and move parcel files to
##cloudera parcel directory and change ownership to cloudera-scm user

if grep -q "cloudera-scm" /etc/group; then
  echo "clouder-scm group exists, proceeding further"
  sudo tar zcvf ${filen^^}-$version-$OS.parcel ${filen^^}-$version/  --owner=cloudera-scm --group=cloudera-scm
else
  echo "clouder-scm group does not exist, creating parcle without group permission"
  sudo tar zcvf ${filen^^}-$version-$OS.parcel ${filen^^}-$version/
fi

if [[ $? -ne 0 ]]; then
  echo "Error: failed to create parcel, check cloudera-scm owner/group exists or not"
  graceful_exit
fi

##Create checksum file for parcel
sudo sha1sum ${filen^^}-$version-$OS.parcel | awk '{ print $1 }' > ${filen^^}-$version-$OS.parcel.sha
if [[ $? -ne 0 ]]; then
  echo "Error: failed to create checksum(.sha) file, check for valid parcel file "$(pwd)/${filen^^}-$version-$OS.parcel
  graceful_exit
fi

##Check if cloudera machine

if [[ "$placefile" == "true" ]]; then                                                                                                           ###changed
  sudo cp ${filen^^}-$version-$OS.parcel* /opt/cloudera/parcel-repo/
  if grep -q "cloudera-scm" /etc/group; then
    sudo chown cloudera-scm:cloudera-scm /opt/cloudera/parcel-repo/*
  else
    echo "Error: not a cloudera machine, exiting"
    graceful_exit
  fi
  rm -rf *
  rm -rf ${BASEDIR}/cparcel
  echo "Parcel created successfully in /opt/cloudera/parcel-repo/"${filen^^}-$version-$OS.parcel
else
  echo "Parcel created locally in "${BASEDIR}
fi

if [[ $? -ne 0 ]]; then
  echo "Error: check cloudera-scm owner/group or /opt/cloudera/parcel-repo/"
  graceful_exit
fi


