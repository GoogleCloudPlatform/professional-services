# Copyright 2022 Google LLC All Rights Reserved.
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

# Works in pair with bq_export.sh
clear
export PROJECT_ID=$(gcloud config get-value project)

export LOG_WRAP_SPOOL=false

export INFILE=$PWD/bq_export.outfile
export INFILE_LRECL=80
export INFILE_BLKSIZE=512

export INFILE_DSN=$PWD/bq_export.outfile

export COPYBOOK=$PWD/bq_export.cp

export BUCKET=$PROJECT_ID-test-storage


export SBT_OPTS=" -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"

cd ..
sbt "runMain com.google.cloud.bqsh.Bqsh" << EOF
gsutil cp \
  --project_id=$PROJECT_ID \
  --location="US" \
  --replace \
  gs://$BUCKET/test.orc
EOF

bq load --autodetect \
--source_format=ORC \
--replace \
test.something \
gs://$BUCKET/test.orc/*