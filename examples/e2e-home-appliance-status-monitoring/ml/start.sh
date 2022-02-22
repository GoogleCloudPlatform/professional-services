#!/bin/bash
# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Example sh start.sh -p [project-id] -t

echo $GOOGLE_APPLICATION_CREDENTIALS


# default values
now=$(date +"%Y%m%d%H%M%S")
JOB_NAME="${USER}_${now}"
REGION="us-central1"
MODULE_NAME="trainer.task"
PACKAGE_PATH="./trainer"
HP_CONFIG="./hptuning_config.yaml"
NORMAL_CONFIG="./config.yaml"
HP_TUNING=0
RUN_LOCAL=0

# parse command line args
PARAMS=""
while (( "$#" )); do
  case "$1" in
    -a|--agent)
      AGENT=$2
      shift 2
      ;;
    -p|--project-id)
      PROJECT_ID=$2
      shift 2
      ;;
    -b|--bucket)
      BUCKET_NAME=$2
      shift 2
      ;;
    -r|--region)
      REGION=$2
      shift 2
      ;;
    -s|--scale-tier)
      SCALE_TIER=$2
      shift 2
      ;;
    -t|--tuning)
      HP_TUNING=1
      shift
      ;;
    -l|--local)
      RUN_LOCAL=1
      shift
      ;;
    --) # end argument parsing
      shift
      break
      ;;
    -*|--*=) # unsupported flags
      echo "Error: Unsupported flag $1" >&2
      exit 1
      ;;
    *) # preserve positional arguments
      PARAMS="$PARAMS --$1"
      shift
      ;;
  esac
done
# set positional arguments in their proper place
eval set -- "$PARAMS"

if (($RUN_LOCAL==1))
then
  LOG_DIR="./results/${JOB_NAME}"
else
  LOG_DIR="gs://${BUCKET_NAME}/ml_jobs/${JOB_NAME}"
fi

# submit job
CMLE_FLAGS="--job-dir $LOG_DIR \
            --module-name $MODULE_NAME \
            --package-path $PACKAGE_PATH \
           "
if (($HP_TUNING==1))
then
  CMLE_FLAGS=$CMLE_FLAGS"--config $HP_CONFIG "
else
  if (($RUN_LOCAL==1))
  then
    CMLE_FLAGS=$CMLE_FLAGS"--configuration $NORMAL_CONFIG "
  else
    CMLE_FLAGS=$CMLE_FLAGS"--config $NORMAL_CONFIG "
  fi
fi

DATA_DIR="./data"
PKG_FLAGS="--train-file=${DATA_DIR}/train.csv \
           --eval-file=${DATA_DIR}/valid.csv \
           --test-file=${DATA_DIR}/test.csv \
           --verbosity=INFO \
           --test=True"
ALL_FLAGS=$CMLE_FLAGS"-- "$PKG_FLAGS$PARAMS

if (($RUN_LOCAL==1))
then
  echo $ALL_FLAGS
  gcloud ml-engine local train $ALL_FLAGS
else
  ALL_FLAGS="--region $REGION "$ALL_FLAGS
  echo $ALL_FLAGS
  gcloud --project=${PROJECT_ID} ml-engine jobs submit training $JOB_NAME $ALL_FLAGS
fi

