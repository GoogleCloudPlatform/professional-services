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

#######################################
# Main entry of the script
# Globals:
#   None
# Arguments:
#   None
# Returns:
#   None
#######################################
function main() {
  BASEDIR=${HOME}/GCS-CDH-PARCEL
  rm -rf ${BASEDIR}
  mkdir -p ${BASEDIR}
  LOGDIR=${HOME}/parcel-logs
  mkdir -p ${LOGDIR}/
  cp * ${BASEDIR}/
  cd ${BASEDIR}
  touch ${LOGDIR}/cparcel_error.log
  touch ${LOGDIR}/cparcel_output.log

  # Allowed OS parameter values and flag to check valid input
  OS_FLAG=0
  OS_VALUE_ARRAY=(el5 el6 el7 sles11 sles12 lucid precise trusty squeeze wheezy)

  # Link to GCS connector jar file and flag to validate the file existence
  GCSJAR_LINK="https://storage.googleapis.com/hadoop-lib/gcs/gcs-connector-hadoop2-latest.jar"
  GCSJAR_FLAG="1"

  NUM_ARG=$#
  exec > >(tee -i ${LOGDIR}/cparcel_output.log)
  exec 2>&1
  echo $(date)

  # Validating The PARAMETERS
  # Regex variable for Parcel and version validity
  PARCEL_FLAG='^[A-Za-z0-9]+$'
  VERSION_FLAG='^[0-9]\.[0-9]\.[0-9]$'

  # Getting the parameter values from command line
  while getopts 'f:v:o:d:' OPTION; do
    case "${OPTION}"
    in
      f) FILE_NAME=${OPTARG} ;;
      v) VERSION=${OPTARG} ;;
      o) OSTYPE=${OPTARG} ;;
      d) PLACE_FILE=${OPTARG} ;;
      :) help ;;
      \?) help ;;
      *) help ;;
    esac
  done
  shift "$(($OPTIND -1))"

  if [[ NUM_ARG -lt 6 ]] || [[ NUM_ARG -gt 8 ]]; then
    echo 'Error: number of parameters is not correct.'
    help
  fi

  if [[ ${FILE_NAME} =~ ${PARCEL_FLAG} && ${VERSION} =~ ${VERSION_FLAG} ]]; then
    :
  else
    echo 'Error: invalid parcel name or version'
    graceful_exit
  fi

  # Throw error if folder doesnt exists (if not using -d parameter then script fails)
  if [[ ! -d /opt/cloudera/parcel-repo/ ]] && [[ "${PLACE_FILE}" == "true" ]] ; then
    echo "Error: /opt/cloudera/parcel-repo/ folder doesn't exist"
    graceful_exit
  elif [[ ! $(getent group cloudera-scm) ]] && [[ "${PLACE_FILE}" == "true" ]]; then
    echo "Error: cloudera-scm group doesn't exist"
    graceful_exit
  fi

  # Check the OS parameter's validity
  OS=${OSTYPE}
  for item in ${OS_VALUE_ARRAY[*]}; do
    if [[ $item == ${OSTYPE} ]]; then
      OS_FLAG=1
    fi
  done
  if [[ $OS_FLAG == 0 ]]; then
    echo 'Error: below are the allowed os type'
    printf '%s\n' "${OS_VALUE_ARRAY[@]}"
    graceful_exit
  fi

  # Display variable information input by user
  echo "Version number:${VERSION}"
  echo "OS type:${OS}"
  echo "Filename:${FILE_NAME}"

  PARCEL_FULLNAME=${FILE_NAME^^}-${VERSION}

  # Path is changed to ${HOME} for further execution
  # Create the file structure for parcel building
  mkdir -p ${PARCEL_FULLNAME}/lib/hadoop/lib && mkdir -p ${PARCEL_FULLNAME}/meta
  if [[ $? -ne 0 ]]; then
    echo "Error: failed to create directory, check for folder permissions"
    graceful_exit
  fi

  touch ${PARCEL_FULLNAME}/meta/parcel.json
  if [[ $? -ne 0 ]]; then
    echo "Error: failed to create parcel.json file, check for file/folder permissions"
    graceful_exit
  fi

  # Download gcs connector jar and copy all folder content to parcel location
  # Set flag for further parcel file existence validation
  curl -o gcs-connector-hadoop2-latest.jar --fail ${GCSJAR_LINK} || GCSJAR_FLAG="0"

  # Validate if package downloaded properly
  if [[ ${GCSJAR_FLAG} = "0" ]]; then
    echo "Error: hadoop connector failed to download, check network connectivity or file/folder permissions"
    graceful_exit
  fi

  # Copy GCS connector jar
  cp gcs-connector-hadoop2-latest.jar ${PARCEL_FULLNAME}/lib/hadoop/lib/

  # Copy service account key file
  cp *.json ${PARCEL_FULLNAME}/lib/hadoop/lib/

  # Check the existence of the GCS jar file in lib folder
  [[ -f ${PARCEL_FULLNAME}/lib/hadoop/lib/gcs-connector-hadoop2-latest.jar ]] || GCSJAR_FLAG="0"

  if [[ ${GCSJAR_FLAG} = "0" ]]; then
    echo "Error: hadoop connector is missing from "$(pwd)/${PARCEL_FULLNAME}/lib/hadoop/lib/
    graceful_exit
  fi

  # Create parcel.json file required for parcel packaging
cat >>${PARCEL_FULLNAME}/meta/parcel.json<<EOL
{
  "schema_version":     1,
  "name":               "${FILE_NAME^^}",
  "version":            "${VERSION}",
  "extraVersionInfo": {
    "fullVersion":        "${VERSION}-0-${OS}",
    "baseVersion":        "${FILE_NAME^^}${VERSION}",
    "patchCount":         ""
  },
  "conflicts":          "",
  "setActiveSymlink":   true,
  "scripts": {
    "defines": "${FILE_NAME^^}.sh"
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
    echo "Error: failed to write in parcel.json "$(pwd)/${PARCEL_FULLNAME}/meta/parcel.json
    graceful_exit
  fi

  # export HADOOP_CLASSPATH to enable command line to use the connector

cat >>${PARCEL_FULLNAME}/meta/${FILE_NAME}.sh<<EOL
#!/bin/bash
export HADOOP_CLASSPATH=\$HADOOP_CLASSPATH:/opt/cloudera/parcels/${FILE_NAME}-${VERSION}/lib/hadoop/lib/gcs-connector-latest-hadoop2.jar
EOL

  if [[ $? -ne 0 ]]; then
    echo "Error: failed to write in file "$(pwd)/${PARCEL_FULLNAME}/meta/${FILE_NAME}.sh
    graceful_exit
  fi

  # Create parcel file, checksum file and move parcel files to
  # Cloudera parcel directory and change ownership to cloudera-scm user
  if [[ $(getent group cloudera-scm) ]]; then
    echo "clouder-scm group exists, proceeding further"
    sudo tar zcvf ${PARCEL_FULLNAME}-${OS}.parcel ${PARCEL_FULLNAME}/  --owner=cloudera-scm --group=cloudera-scm
  else
    echo "clouder-scm group does not exist, creating parcle without group permission"
    sudo tar zcvf ${PARCEL_FULLNAME}-${OS}.parcel ${PARCEL_FULLNAME}/
  fi

  if [[ $? -ne 0 ]]; then
    echo "Error: failed to create parcel, check cloudera-scm owner/group exists or not"
    graceful_exit
  fi

  # Create checksum file for parcel
  sudo sha1sum ${PARCEL_FULLNAME}-${OS}.parcel | awk '{ print $1 }' > ${PARCEL_FULLNAME}-${OS}.parcel.sha
  if [[ $? -ne 0 ]]; then
    echo "Error: failed to create checksum(.sha) file, check for valid parcel file "$(pwd)/${PARCEL_FULLNAME}-${OS}.parcel
    graceful_exit
  fi

  # Check if this machine has /opt/cloudera/parcel-repo directory
  if [[ "${PLACE_FILE}" == "true" ]]; then
    sudo cp ${PARCEL_FULLNAME}-${OS}.parcel* /opt/cloudera/parcel-repo/
    if [[ $(getent group cloudera-scm) ]]; then
      sudo chown cloudera-scm:cloudera-scm /opt/cloudera/parcel-repo/*
    else
      echo "Error: not a Cloudera Manager machine, exiting"
      graceful_exit
    fi
    rm -rf *
    rm -rf ${BASEDIR}/cparcel
    echo "Parcel created successfully in /opt/cloudera/parcel-repo/"${PARCEL_FULLNAME}-${OS}.parcel
  else
    echo "Parcel created locally in "${BASEDIR}
  fi

  if [[ $? -ne 0 ]]; then
    echo "Error: check cloudera-scm owner/group or /opt/cloudera/parcel-repo/"
    graceful_exit
  fi
}

main "$@"
