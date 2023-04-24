#!/bin/bash
# Copyright 2022 Google LLC
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

# Run in Cloud Shell to set up your project and deploy solution.

usage() {
    echo "Usage: [ -i projectId ] [ -n projectNumber ] [ -r region ] [ -d dataset ] [ -t table ]"
}
export -f usage

while getopts ":i:n:r:d:t:" opt; do
    case $opt in
        i ) projectId="$OPTARG";;
        n ) projectNumber="$OPTARG";;
        r ) region="$OPTARG";;
        d ) dataset="$OPTARG";;
        t ) table="$OPTARG";;
        \?) echo "Invalid option -$OPTARG"
        usage
        exit 1
        ;;
    esac
done

echo "===================================================="
echo " Inputs ..."
echo " Project ID: ${projectId}" 
echo " Project Number: ${projectNumber}" 
echo " Region: ${region}" 
echo " Dataset: ${dataset}"
echo " Table: ${table}"

echo "===================================================="
echo " Setting up project ..."


export CLUSTER_NAME="$projectId"-dp-cluster
export GCS_BUCKET_NAME="$projectId"-services

gcloud config set project "$projectId"

gcloud services enable dataproc.googleapis.com \
  compute.googleapis.com \
  storage-component.googleapis.com \
  bigquery.googleapis.com \
  bigquerystorage.googleapis.com

echo "===================================================="
echo " Deploying Hive Cluster ..."

gcloud beta dataproc clusters create "$CLUSTER_NAME"-hive \
--enable-component-gateway \
--optional-components=JUPYTER,ANACONDA \
--service-account="$projectNumber"-compute@developer.gserviceaccount.com \
--region "$region" --subnet default --zone "$region"-a \
--master-machine-type n1-standard-4 --master-boot-disk-size 1000 \
--num-masters 1 \
--num-workers 5 --worker-machine-type n1-standard-4 \
--worker-boot-disk-size 1000 --image-version 1.5-debian \
--scopes https://www.googleapis.com/auth/cloud-platform \
--project "$projectId" 


echo "===================================================="
echo " Setting up BigQuery ..."

bq --location=US mk "$dataset"

# refresh
bq rm -f -t "$dataset"."$table"

sleep 30 

echo "===================================================="
echo " Loading BigQuery Table ..."

bq load \
    --autodetect \
    --source_format=NEWLINE_DELIMITED_JSON \
    "$dataset"."$table" \
    gs://"$GCS_BUCKET_NAME"/"$table"/*

sleep 30 


echo "===================================================="
echo " Extracting table data into various file formats ..."

# --- AVRO

bq extract --location=US \
--destination_format AVRO \
--compression SNAPPY \
"$projectId":"$dataset"."$table" \
gs://"$GCS_BUCKET_NAME"/"$table"_format_testing/AVRO_SNAPPY/*.snappy.avro

bq extract --location=US \
--destination_format AVRO \
--compression DEFLATE \
"$projectId":"$dataset"."$table" \
gs://"$GCS_BUCKET_NAME"/"$table"_format_testing/AVRO_DEFLATE/*.avro

bq extract --location=US \
--destination_format AVRO \
"$projectId":"$dataset"."$table" \
gs://"$GCS_BUCKET_NAME"/"$table"_format_testing/AVRO/*.avro

# --- PARQUET

bq extract --location=US \
--destination_format PARQUET \
--compression SNAPPY \
"$projectId":"$dataset"."$table" \
gs://"$GCS_BUCKET_NAME"/"$table"_format_testing/PARQUET_SNAPPY/*.snappy.parquet

bq extract --location=US \
--destination_format PARQUET \
"$projectId":"$dataset"."$table" \
gs://"$GCS_BUCKET_NAME"/"$table"_format_testing/PARQUET/*.parquet

bq extract --location=US \
--destination_format PARQUET \
--compression GZIP \
"$projectId":"$dataset"."$table" \
gs://"$GCS_BUCKET_NAME"/"$table"_format_testing/PARQUET_GZIP/*.parquet.gz

# --- JSON

bq extract --location=US \
--destination_format NEWLINE_DELIMITED_JSON \
"$projectId":"$dataset"."$table" \
gs://"$GCS_BUCKET_NAME"/"$table"_format_testing/JSON/*.json

bq extract --location=US \
--destination_format NEWLINE_DELIMITED_JSON \
--compression GZIP \
"$projectId":"$dataset"."$table" \
gs://"$GCS_BUCKET_NAME"/"$table"_format_testing/JSON_GZIP/*.json.gz


echo "===================================================="
echo " Submitting Hive job for creating external tables ..."

# edit the table-create.hql script
cp scripts/table-create.hql.template scripts/table-create.hql
sed -i "s|%%PROJECT_ID%%|$projectId|g" scripts/table-create.hql
sed -i "s|%%TABLE%%|$table|g" scripts/table-create.hql

gcloud dataproc jobs submit hive --region="$region" --cluster="$CLUSTER_NAME"-hive --file=scripts/table-create.hql 
