#!/usr/bin/env bash

# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

if [ $# != 10 ]
then
   echo "Invalid Number of Arguments!"
   echo "Usage : $0 Snowflake_Config Snowflake_Connection Snowflake_db Snowflake_schema Snowflake_table Snowflake_stage GCS_out_path GCP_Project BigQuery_Dataset BigQuery_Table"
   exit 1
fi

SF_CONFIG=$1
SF_CONN=$2
SF_DB=$3
SF_SCHEMA=$4
SF_TABLE=$5
SF_STAGE=$6
GCS_OUT_PATH=$7
GCP_PROJECT=$8
BQ_DATASET=$9
BQ_TABLE=${10}

# Direct standard out and error to log file
exec 1>"${SF_DB}"."${SF_SCHEMA}"."${SF_TABLE}".log
exec 2>&1

# Copy from Snowflake to GCS
echo "Starting COPY from Snowflake to GCS for ${SF_DB}.${SF_SCHEMA}.${SF_STAGE} at $(date)"

SNOW_SQL="snowsql --config ${SF_CONFIG} -c ${SF_CONN} -o exit_on_error=true \
          -q \"COPY INTO @${SF_STAGE}/${SF_DB}/${SF_SCHEMA}/${SF_TABLE}/ \
          FROM ${SF_DB}.${SF_SCHEMA}.${SF_TABLE} \
          HEADER=TRUE \
          OVERWRITE=TRUE\""

echo "Snowflake COPY Command is : ${SNOW_SQL}"
eval "${SNOW_SQL}"

status=$?

if [ ${status} != 0 ]
then
   echo "Failed to COPY from Snowflake to GCS"
   exit ${status}
fi

# Load into Big Query from GCS
echo "Starting GCS to BQ load for ${STAGING_TABLE} to ${FINAL_TABLE} at $(date)"
BQ_LOAD_CMD="bq \
             --location=US load \
             --source_format=PARQUET \
             --replace \
             ${GCP_PROJECT}:${BQ_DATASET}.${BQ_TABLE} \
             ${GCS_OUT_PATH}/${SF_DB}/${SF_SCHEMA}/${SF_TABLE}/*"

echo "BQ Load Command is : ${BQ_LOAD_CMD}"
eval "${BQ_LOAD_CMD}"

status=$?

if [ ${status} != 0 ]
then
   echo "Failed to load from GCS to BigQuery"
   exit ${status}
fi

# Validate Row Counts between Snowflake Table and BigQuery Table

echo "Starting Row Count SQL for Snowflake Table at $(date)"
# TODO: Replace with more efficient metadata based row count operation.
SF_ROW_COUNT_CMD="snowsql --config ${SF_CONFIG} -c ${SF_CONN} -o friendly=false -o header=false -o timing=false -o output_format=tsv -o exit_on_error=true -q \"select count(*) from ${SF_DB}.${SF_SCHEMA}.${SF_TABLE}\""

echo "Snowflake Row Count Command is : ${SF_ROW_COUNT_CMD}"

SF_ROW_COUNT=$(eval "${SF_ROW_COUNT_CMD}")

status=$?

if [ ${status} != 0 ]
then
   echo "Failed to Select Row Count from Snowflake Table"
   exit ${status}
fi

echo "Snowflake Table Row Count is ${SF_ROW_COUNT}"

echo "Starting Row Count SQL for BigQuery Table at $(date)"
BQ_TABLE_FULL_NAME="${GCP_PROJECT}.${BQ_DATASET}.${BQ_TABLE}"

BQ_ROW_COUNT_CMD=$(bq show --format=prettyjson  "${BQ_TABLE_FULL_NAME}" | grep numRows | grep -Eo '[[:digit:]]{1,}')

echo "BigQuery Row Count Command is : ${BQ_ROW_COUNT_CMD}"

eval "${BQ_ROW_COUNT_CMD}" > /tmp/"${BQ_TABLE_FULL_NAME}".cnt 2>&1

status=$?

if [ ${status} != 0 ]
then
   echo "Failed to Select Row Count from Snowflake Table"
   exit ${status}
fi

BQ_ROW_COUNT=$(tail -1 /tmp/"${BQ_TABLE_FULL_NAME}".cnt)

# Compare the Row Counts
if [ "${SF_ROW_COUNT}" = "${BQ_ROW_COUNT}" ]
then
   echo "Snowflake Row Count ${SF_ROW_COUNT} Matches BigQuery Row Count ${BQ_ROW_COUNT}"
else
   echo "Error : Snowflake Row Count ${SF_ROW_COUNT} Does Not Match BigQuery Row Count ${BQ_ROW_COUNT}"
   exit 1
fi
