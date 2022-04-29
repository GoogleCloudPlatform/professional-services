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

clear
export PROJECT_ID=$(gcloud config get-value project)

export LOG_WRAP_SPOOL=false

export QUERY=$PWD/bq_export.sql
export QUERY_LRECL=5000
export QUERY_BLKSIZE=5000

export OUTFILE=$PWD/bq_export.outfile
export OUTFILE_LRECL=80
export OUTFILE_BLKSIZE=512

export COPYBOOK=$PWD/bq_export.cp
export BUCKET=$PROJECT_ID-test-storage

export SBT_OPTS=" -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
rm $OUTFILE

cd ..
sbt "runMain com.google.cloud.bqsh.Bqsh" << EOF
bq export \
  --project_id=$PROJECT_ID \
  --location="US" \
  --run_mode=storage_api \
  --outDD=OUTFILE
EOF

#Simulation of luminex step, duplication in metadata name is intentional
gsutil cp -Z $OUTFILE gs://$BUCKET/EXPORT/OUTFILE
gsutil setmeta -h "x-goog-meta-x-goog-meta-lrecl:$OUTFILE_LRECL" gs://$BUCKET/EXPORT/OUTFILE
